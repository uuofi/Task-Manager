import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useTaskJourneyAnimation } from '@/hooks/useTaskJourneyAnimation';
import { cn } from '@/lib/utils';

import { DESIGN_H, DESIGN_W, JOURNEY_CHAPTERS, NEON_PATH_D, toPct } from './journeyData';
import { JourneyStepper } from './JourneyStepper';
import { OfficeScene } from './OfficeScene';

const EASE = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const ANCHORS = JOURNEY_CHAPTERS.map((c) => c.anchor);

/**
 * "How work moves" — the reference storytelling section. On desktop the
 * three real offices sit in a fixed zigzag, threaded by one neon path that
 * draws on scroll; each office lights to full color only once the line
 * reaches it (all others stay faded), the per-office label beside it lifts
 * to full emphasis, and the right-hand stepper fills. See
 * hooks/useTaskJourneyAnimation.js for the scroll timeline and
 * journeyData.js for the fixed design-space layout. Tablet/mobile and
 * reduced-motion get a simple stacked reveal instead.
 */
export function TaskJourney() {
  const { t } = useTranslation();
  const [{ activeIndex, complete }, setState] = useState({ activeIndex: 0, complete: false });

  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const headingRef = useRef(null);
  const sceneApiRefs = useRef([]);
  const pathCoreRef = useRef(null);
  const pathGlowRef = useRef(null);
  const taskLightRef = useRef(null);
  const sparkRefs = useRef([]);
  const gradientRef = useRef(null);

  const handleStateChange = useCallback((index, isComplete) => {
    setState((prev) =>
      prev.activeIndex === index && prev.complete === isComplete
        ? prev
        : { activeIndex: index, complete: isComplete },
    );
  }, []);

  const { isCinematic } = useTaskJourneyAnimation({
    containerRef,
    stageRef,
    headingRef,
    sceneApiRefs,
    pathCoreRef,
    pathGlowRef,
    taskLightRef,
    sparkRefs,
    gradientRef,
    anchors: ANCHORS,
    chapterCount: JOURNEY_CHAPTERS.length,
    onStateChange: handleStateChange,
  });

  return (
    <section id="features" ref={containerRef} className="relative isolate scroll-mt-20">
      {/* Dark premium stage — scoped to this section, built from the app's real brand hexes. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden bg-[#0D1321]">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div className="absolute -left-32 top-24 size-[26rem] rounded-full bg-[#5A3BFF]/[0.07] blur-[170px]" />
        <div className="absolute -right-32 bottom-24 size-[24rem] rounded-full bg-[#00C2A8]/[0.04] blur-[170px]" />
      </div>

      <div className="mx-auto max-w-3xl px-6 pt-20 sm:pt-28">
        <div className="mx-auto text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
            {t('journey.eyebrow')}
          </span>
          <h2
            ref={headingRef}
            style={{ opacity: 0 }}
            className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            {t('journey.title')}
          </h2>
          <p className="mt-5 text-lg text-white/70 sm:text-xl">{t('journey.subtitle')}</p>
        </div>
      </div>

      {isCinematic ? (
        <>
          {/* Pinned zigzag stage — fixed aspect ratio so the SVG viewBox and
              the office percentages share one coordinate system. */}
          <div className="mx-auto max-w-7xl px-6 pb-10 pt-12">
            <div
              ref={stageRef}
              className="relative mx-auto aspect-[16/11] max-h-[92vh] w-full"
            >
              {/* Neon path (behind offices). */}
              <svg
                viewBox={`0 0 ${DESIGN_W} ${DESIGN_H}`}
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 z-0 h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient ref={gradientRef} id="journeyNeon" x1="0%" y1="0%" x2="60%" y2="60%">
                    <stop offset="0%" stopColor="#00C2A8" />
                    <stop offset="50%" stopColor="#2D7CFF" />
                    <stop offset="100%" stopColor="#5A3BFF" />
                  </linearGradient>
                  <filter id="journeyBloom" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="7" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Faint full route — the not-yet-reached portion stays dim. */}
                <path
                  d={NEON_PATH_D}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Wide bloom halo, drawn progressively. */}
                <path
                  ref={pathGlowRef}
                  d={NEON_PATH_D}
                  fill="none"
                  stroke="url(#journeyNeon)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  opacity="0.5"
                  filter="url(#journeyBloom)"
                />
                {/* Crisp bright core, drawn progressively. */}
                <path
                  ref={pathCoreRef}
                  d={NEON_PATH_D}
                  fill="none"
                  stroke="url(#journeyNeon)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                {/* Trailing sparks + leading task-light comet at the draw front. */}
                {[0, 1].map((i) => (
                  <circle
                    key={i}
                    ref={(el) => (sparkRefs.current[i] = el)}
                    r="5"
                    fill="#cfe4ff"
                    opacity="0"
                    filter="url(#journeyBloom)"
                  />
                ))}
                <circle
                  ref={taskLightRef}
                  r="11"
                  fill="#ffffff"
                  opacity="0"
                  filter="url(#journeyBloom)"
                />
              </svg>

              {/* Offices — absolutely placed in the design grid. */}
              {JOURNEY_CHAPTERS.map((chapter, i) => {
                const pos = toPct(chapter.office.cx, chapter.office.cy);
                return (
                  <div
                    key={chapter.id}
                    className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: pos.left, top: pos.top, width: `${(chapter.office.w / DESIGN_W) * 100}%` }}
                  >
                    <OfficeScene
                      ref={(el) => (sceneApiRefs.current[i] = el)}
                      image={chapter.image}
                      alt={t(chapter.titleKey)}
                      accent={chapter.accent}
                      initiallyActive={i === 0}
                      reduceMotion={false}
                    />
                  </div>
                );
              })}

              {/* Per-office labels. */}
              {JOURNEY_CHAPTERS.map((chapter, i) => {
                const pos = toPct(chapter.label.x, chapter.label.y);
                const isActive = i === activeIndex;
                const reached = i < activeIndex;
                return (
                  <div
                    key={`label-${chapter.id}`}
                    className="absolute z-20 transition-all duration-500"
                    style={{
                      left: pos.left,
                      top: pos.top,
                      width: `${chapter.label.w}%`,
                      opacity: isActive ? 1 : reached ? 0.55 : 0.32,
                      transform: isActive ? 'translateY(0)' : 'translateY(6px)',
                    }}
                  >
                    <span
                      className="text-4xl font-extrabold tabular-nums"
                      style={{ color: isActive ? chapter.accent : 'rgba(255,255,255,0.55)' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-2 text-2xl font-bold leading-tight text-white">
                      {t(chapter.titleKey)}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">
                      {t(chapter.descKey)}
                    </p>
                  </div>
                );
              })}

              {/* Vertical stepper — far right, spanning the stage height. */}
              <div className="absolute -end-6 top-[9%] bottom-[9%] z-20">
                <JourneyStepper
                  chapters={JOURNEY_CHAPTERS}
                  activeIndex={activeIndex}
                  complete={complete}
                />
              </div>
            </div>
          </div>

          {/* CTA appears after the pinned journey releases. */}
          <div className="mx-auto max-w-6xl px-6 pb-24 text-center">
            <Button asChild size="lg" variant="cta">
              <Link to="/register">
                {t('journey.cta')} <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        </>
      ) : (
        // Tablet / mobile / reduced-motion — simplified stacked fallback.
        <div className="mx-auto max-w-6xl px-6 pb-24">
          <div className="mt-14 space-y-16">
            {JOURNEY_CHAPTERS.map((chapter, i) => (
              <motion.div
                key={chapter.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                variants={fadeUp}
                className="grid items-center gap-8 sm:grid-cols-2"
              >
                <div
                  className={cn(
                    'overflow-hidden rounded-2xl border border-white/10',
                    i % 2 === 1 && 'sm:order-2',
                  )}
                >
                  <img
                    src={chapter.image}
                    alt={t(chapter.titleKey)}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-white">
                  <span
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: chapter.accent }}
                  >
                    {t('journey.step')} {i + 1}
                  </span>
                  <h3 className="mt-1 text-2xl font-bold">{t(chapter.titleKey)}</h3>
                  <p className="mt-3 leading-relaxed text-white/70">{t(chapter.descKey)}</p>
                  <ul className="mt-4 grid grid-cols-2 gap-2">
                    {chapter.featureKeys.map((key) => (
                      <li key={key} className="flex items-center gap-2 text-sm text-white/90">
                        <CheckCircle2 className="size-4 shrink-0" style={{ color: chapter.accent }} />
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
            <div className="text-center">
              <Button asChild size="lg" variant="cta">
                <Link to="/register">
                  {t('journey.cta')} <ArrowRight className="size-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default TaskJourney;
