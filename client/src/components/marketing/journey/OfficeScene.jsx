import gsap from 'gsap';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * One office in the always-visible three-office stack. Idle vs. active
 * styling (opacity/grayscale/scale/glow) and the ambient "alive" loops
 * (breathing, screen glow, drifting particles) are exposed imperatively via
 * `ref.current.activate()` / `.deactivate()` so the scroll-driven hook can
 * flip exactly one office on and off in sync with the neon path — per spec,
 * ambient animation only runs while an office is active, and stops the
 * instant it goes idle.
 */
export const OfficeScene = forwardRef(function OfficeScene(
  { image, alt, accent, initiallyActive = false, reduceMotion },
  ref,
) {
  const frameRef = useRef(null);
  const glowRingRef = useRef(null);
  const flashRef = useRef(null);
  const tiltRef = useRef(null);
  const screenGlowRefs = useRef([]);
  const particleRefs = useRef([]);
  const ambientTweens = useRef([]);
  const isActiveRef = useRef(initiallyActive);

  const killAmbient = () => {
    ambientTweens.current.forEach((tw) => tw.kill());
    ambientTweens.current = [];
    gsap.set(screenGlowRefs.current.filter(Boolean), { opacity: 0 });
    gsap.set(particleRefs.current.filter(Boolean), { opacity: 0 });
  };

  const startAmbient = () => {
    if (reduceMotion) return;
    killAmbient();
    ambientTweens.current.push(
      gsap.to(frameRef.current, {
        scale: 1.015,
        duration: 3.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      }),
    );
    screenGlowRefs.current.forEach((el, i) => {
      if (!el) return;
      ambientTweens.current.push(
        gsap.to(el, {
          opacity: i === 0 ? 0.5 : 0.28,
          duration: 1.8 + i * 0.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.7,
        }),
      );
    });
    particleRefs.current.forEach((el, i) => {
      if (!el) return;
      ambientTweens.current.push(
        gsap
          .timeline({ repeat: -1, delay: i * 0.8, repeatDelay: 0.4 })
          .fromTo(el, { y: 0, opacity: 0 }, { opacity: 0.85, duration: 0.8, ease: 'sine.out' })
          .to(el, { y: -28, opacity: 0, duration: 2.4, ease: 'sine.in' }, '<'),
      );
    });
  };

  useImperativeHandle(ref, () => ({
    activate() {
      isActiveRef.current = true;
      if (reduceMotion) {
        gsap.set(frameRef.current, { opacity: 1, scale: 1, filter: 'grayscale(0)' });
        gsap.set(glowRingRef.current, { opacity: 0.18 });
      } else {
        gsap.to(frameRef.current, {
          opacity: 1,
          scale: 1,
          filter: 'grayscale(0)',
          duration: 0.8,
          ease: 'power3.out',
        });
        gsap.to(glowRingRef.current, { opacity: 0.18, duration: 0.8, ease: 'power2.out' });
        gsap.fromTo(
          flashRef.current,
          { opacity: 0.22, scale: 0.92 },
          { opacity: 0, scale: 1.12, duration: 0.7, ease: 'power2.out' },
        );
      }
      startAmbient();
    },
    deactivate() {
      isActiveRef.current = false;
      killAmbient();
      if (reduceMotion) {
        gsap.set(frameRef.current, { opacity: 0.7, scale: 0.94, filter: 'grayscale(1)' });
        gsap.set(glowRingRef.current, { opacity: 0 });
      } else {
        gsap.to(frameRef.current, {
          opacity: 0.7,
          scale: 0.94,
          filter: 'grayscale(1)',
          duration: 0.6,
          ease: 'power2.inOut',
        });
        gsap.to(glowRingRef.current, { opacity: 0, duration: 0.5 });
      }
    },
  }));

  useEffect(() => {
    if (initiallyActive) {
      gsap.set(frameRef.current, { opacity: 1, scale: 1, filter: 'grayscale(0)' });
      gsap.set(glowRingRef.current, { opacity: 1 });
      startAmbient();
    } else {
      gsap.set(frameRef.current, { opacity: 0.7, scale: 0.94, filter: 'grayscale(1)' });
      gsap.set(glowRingRef.current, { opacity: 0 });
    }
    return () => killAmbient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = tiltRef.current;
    if (!el || reduceMotion || window.matchMedia('(pointer: coarse)').matches) return undefined;

    const quickRotateY = gsap.quickTo(el, 'rotateY', { duration: 0.6, ease: 'power3.out' });
    const quickRotateX = gsap.quickTo(el, 'rotateX', { duration: 0.6, ease: 'power3.out' });

    const handleMove = (e) => {
      if (!isActiveRef.current) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      quickRotateY(px * 4);
      quickRotateX(-py * 4);
    };
    const handleLeave = () => {
      quickRotateY(0);
      quickRotateX(0);
    };

    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', handleLeave);
    return () => {
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
    };
  }, [reduceMotion]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={glowRingRef}
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-[2rem] blur-xl"
        style={{ backgroundColor: accent, opacity: 0 }}
      />
      <div ref={frameRef} className="relative w-full">
        <div
          ref={tiltRef}
          style={{ transformStyle: 'preserve-3d', transformPerspective: 1200 }}
          className="relative w-full overflow-hidden rounded-2xl"
        >
          <img
            src={image}
            alt={alt}
            loading="lazy"
            draggable={false}
            className="h-auto w-full select-none object-contain"
          />
          <span
            ref={(el) => (screenGlowRefs.current[0] = el)}
            aria-hidden="true"
            className="pointer-events-none absolute size-8 rounded-full blur-xl"
            style={{ backgroundColor: accent, opacity: 0, left: '40%', top: '32%' }}
          />
          <span
            ref={(el) => (screenGlowRefs.current[1] = el)}
            aria-hidden="true"
            className="pointer-events-none absolute size-6 rounded-full blur-xl"
            style={{ backgroundColor: accent, opacity: 0, left: '58%', top: '48%' }}
          />
          {[0, 1].map((i) => (
            <span
              key={i}
              ref={(el) => (particleRefs.current[i] = el)}
              aria-hidden="true"
              className="pointer-events-none absolute size-1.5 rounded-full"
              style={{ backgroundColor: accent, left: `${32 + i * 26}%`, top: `${66 - i * 10}%` }}
            />
          ))}
          <span
            ref={flashRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ backgroundColor: accent, opacity: 0 }}
          />
        </div>
      </div>
    </div>
  );
});

export default OfficeScene;
