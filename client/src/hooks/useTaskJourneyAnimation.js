import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin);

/**
 * Drives the pinned "task journey" stage: three offices arranged in a
 * zigzag, threaded by one neon SVG path that draws as the user scrolls.
 *
 * Because the stage and the SVG share a fixed design-space viewBox, the path
 * `d` and every coordinate are static — no DOM measurement. On mount the
 * hook scans the path to find the length-fraction at which the line reaches
 * each office `anchor`; those become the thresholds that light offices up.
 *
 * On desktop (lg+) without reduced motion it pins the stage and scrubs one
 * ScrollTrigger. Per frame it:
 *   - draws the bright neon core/glow (strokeDashoffset ← 1 − progress),
 *   - flies a glowing "task light" comet (+ two trailing sparks) at the draw
 *     front via getPointAtLength, so energy visibly travels the line,
 *   - lights exactly the office whose threshold the draw has passed (single
 *     active; the previous one returns to idle) as a short eased transition
 *     rather than a scrubbed one, so it stays smooth at any scroll speed.
 * A slow gradient shimmer along the line runs independently of scroll.
 *
 * Tablet/mobile/reduced-motion: no pin, no SVG — the component renders a
 * static stacked fallback and this hook only does the headline reveal.
 *
 * Everything is created inside a gsap.context() scoped to containerRef, so a
 * single ctx.revert() on unmount tears it all down.
 */
export function useTaskJourneyAnimation({
  containerRef,
  stageRef,
  headingRef,
  sceneApiRefs,
  pathCoreRef,
  pathGlowRef,
  taskLightRef,
  sparkRefs,
  gradientRef,
  anchors,
  chapterCount,
  onStateChange,
}) {
  const [isCinematic] = useState(() => {
    if (typeof window === 'undefined') return false;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    return !prefersReduced && isDesktop;
  });
  const lastIndexRef = useRef(-1);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      // Headline: character stagger fade-up, once, the first time it's in view.
      if (headingRef.current) {
        if (prefersReduced) {
          gsap.set(headingRef.current, { opacity: 1 });
        } else {
          const split = new SplitText(headingRef.current, { type: 'chars,words' });
          gsap.set(headingRef.current, { opacity: 1 });
          gsap.from(split.chars, {
            opacity: 0,
            y: 26,
            rotateX: -40,
            stagger: 0.014,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: headingRef.current, start: 'top 85%', once: true },
          });
        }
      }

      if (!isCinematic) {
        onStateChange(0, false);
        return;
      }

      const core = pathCoreRef.current;
      if (!core) return;

      const total = core.getTotalLength();

      // Find the draw-progress at which the line reaches each office anchor.
      const thresholds = anchors.map((a) => {
        let bestLen = 0;
        let bestDist = Infinity;
        const samples = 240;
        for (let i = 0; i <= samples; i += 1) {
          const len = (i / samples) * total;
          const p = core.getPointAtLength(len);
          const dist = (p.x - a.x) ** 2 + (p.y - a.y) ** 2;
          if (dist < bestDist) {
            bestDist = dist;
            bestLen = len;
          }
        }
        return bestLen / total;
      });

      const setActive = (idx, complete) => {
        if (idx !== lastIndexRef.current) {
          const prev = lastIndexRef.current;
          if (prev >= 0) sceneApiRefs.current[prev]?.deactivate();
          sceneApiRefs.current[idx]?.activate();
          lastIndexRef.current = idx;
        }
        // TaskJourney guards its own React state; safe to call every frame.
        onStateChange(idx, complete);
      };

      // Initial state: line undrawn, first office already alive.
      gsap.set([core, pathGlowRef.current], {
        strokeDasharray: total,
        strokeDashoffset: total,
      });
      gsap.set([taskLightRef.current, ...sparkRefs.current.filter(Boolean)], { opacity: 0 });
      setActive(0, false);

      const positionComet = (progress) => {
        const front = gsap.utils.clamp(0, total, progress * total);
        const p = core.getPointAtLength(front);
        gsap.set(taskLightRef.current, { attr: { cx: p.x, cy: p.y } });
        sparkRefs.current.forEach((el, i) => {
          if (!el) return;
          const sp = core.getPointAtLength(Math.max(0, front - (i + 1) * 42));
          gsap.set(el, { attr: { cx: sp.x, cy: sp.y } });
        });
        const visible = progress > 0.012 && progress < 0.992 ? 1 : 0;
        gsap.set(taskLightRef.current, { opacity: visible });
        sparkRefs.current.forEach((el) => el && gsap.set(el, { opacity: visible * 0.8 }));
      };

      const master = gsap.timeline({
        scrollTrigger: {
          trigger: stageRef.current,
          start: 'center center',
          end: `+=${chapterCount * 90}%`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = self.progress;
            let idx = 0;
            for (let i = 0; i < thresholds.length; i += 1) {
              if (progress + 0.0015 >= thresholds[i]) idx = i;
            }
            setActive(idx, progress > 0.985);
            positionComet(progress);
          },
        },
      });

      master.to([core, pathGlowRef.current], { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0);

      // Gentle animated-gradient shimmer along the neon line (scroll-independent).
      if (!prefersReduced && gradientRef.current) {
        gsap.fromTo(
          gradientRef.current,
          { attr: { x1: '0%', y1: '0%', x2: '60%', y2: '60%' } },
          {
            attr: { x1: '40%', y1: '40%', x2: '100%', y2: '100%' },
            duration: 5,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut',
          },
        );
      }
    }, containerRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isCinematic };
}

export default useTaskJourneyAnimation;
