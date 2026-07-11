import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Static demo data for the marketing preview — mirrors the shape the real
 * Contract System page builds (client/src/pages/app/ContractSystemPage.jsx):
 * project "contracts" as hubs, their tasks as orbiting "sub-contracts",
 * dashed spokes back to the hub, solid arrows for task dependencies, and an
 * orange dashed line for a user-created project ↔ project link.
 */
const W = 500;
const H = 320;

const HUBS = [
  { id: 'a', label: 'WEB', color: '#5A3BFF', anchor: { x: 155, y: 165 } },
  { id: 'b', label: 'APP', color: '#00C2A8', anchor: { x: 360, y: 120 } },
];

const TASKS = [
  { id: 't1', hub: 'a', color: '#3b82f6', anchor: { x: 80, y: 95 } },
  { id: 't2', hub: 'a', color: '#f59e0b', anchor: { x: 90, y: 235 } },
  { id: 't3', hub: 'a', color: '#10b981', anchor: { x: 225, y: 210 }, dep: 't2' },
  { id: 't4', hub: 'b', color: '#a855f7', anchor: { x: 300, y: 55 } },
  { id: 't5', hub: 'b', color: '#10b981', anchor: { x: 430, y: 90 } },
  { id: 't6', hub: 'b', color: '#3b82f6', anchor: { x: 420, y: 195 } },
];

const HUB_BY_ID = Object.fromEntries(HUBS.map((h) => [h.id, h]));
const TASK_BY_ID = Object.fromEntries(TASKS.map((t) => [t.id, t]));

/** Small deterministic drift so every node breathes without any two syncing. */
const FLOAT = TASKS.concat(HUBS).map((n, i) => ({
  id: n.id,
  ax: 4 + ((i * 7) % 5),
  ay: 4 + ((i * 5) % 6),
  sx: 0.5 + ((i * 3) % 5) * 0.08,
  sy: 0.45 + ((i * 2) % 5) * 0.08,
  px: i * 1.3,
  py: i * 2.1,
}));
const FLOAT_BY_ID = Object.fromEntries(FLOAT.map((f) => [f.id, f]));

function useDrift(reduceMotion) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduceMotion) return undefined;
    let raf;
    const start = performance.now();
    const tick = (now) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);
  return t;
}

function driftPos(id, base, t) {
  const f = FLOAT_BY_ID[id];
  if (!f || t === 0) return base;
  return {
    x: base.x + Math.sin(t * f.sx + f.px) * f.ax,
    y: base.y + Math.cos(t * f.sy + f.py) * f.ay,
  };
}

/**
 * Animated, self-contained replica of the real Contract System diagram used
 * to demo "project ↔ contract" linking on the marketing page. No data
 * fetching, no drag — just enough motion to read as alive.
 */
export function ContractPreview() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const time = useDrift(reduceMotion);
  const svgRef = useRef(null);

  const posOf = (id, base) => driftPos(id, base, time);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-lg"
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -14, 0] }}
        transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ rotateX: 6, rotateY: 10, transformPerspective: 1400 }}
        role="img"
        aria-label={t('landing.contractPreviewAlt')}
        className="border-border bg-card/90 rounded-3xl border p-4 shadow-[0_50px_100px_-30px_rgba(0,194,168,0.35)] backdrop-blur-xl sm:p-5"
      >
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-full w-full select-none" aria-hidden="true">
          <defs>
            <marker
              id="previewArrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-primary" />
            </marker>
          </defs>

          {/* Spokes: each task links back to its project hub. */}
          {TASKS.map((task) => {
            const hub = HUB_BY_ID[task.hub];
            const a = posOf(hub.id, hub.anchor);
            const b = posOf(task.id, task.anchor);
            return (
              <line
                key={`spoke-${task.id}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="stroke-border"
                strokeWidth={1.25}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Task → task dependency. */}
          {TASKS.filter((task) => task.dep).map((task) => {
            const from = TASK_BY_ID[task.dep];
            const a = posOf(from.id, from.anchor);
            const b = posOf(task.id, task.anchor);
            return (
              <line
                key={`dep-${task.id}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="stroke-primary/60"
                strokeWidth={1.75}
                markerEnd="url(#previewArrow)"
              />
            );
          })}

          {/* Project ↔ project link — the moving dashes read as "linking" in motion. */}
          {(() => {
            const a = posOf('a', HUB_BY_ID.a.anchor);
            const b = posOf('b', HUB_BY_ID.b.anchor);
            return (
              <motion.line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#f97316"
                strokeWidth={2.5}
                strokeDasharray="8 6"
                strokeLinecap="round"
                animate={reduceMotion ? undefined : { strokeDashoffset: [0, -28] }}
                transition={reduceMotion ? undefined : { duration: 1.4, repeat: Infinity, ease: 'linear' }}
              />
            );
          })()}

          {/* Hubs (contracts) + tasks (sub-contracts). */}
          {HUBS.map((hub) => {
            const p = posOf(hub.id, hub.anchor);
            return (
              <g key={hub.id} transform={`translate(${p.x} ${p.y})`}>
                <circle r={20} fill={hub.color} opacity={0.18} />
                <motion.circle
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  r={13}
                  fill={hub.color}
                  stroke="white"
                  strokeWidth={2}
                  className="drop-shadow-sm"
                />
                <text x={0} y={34} textAnchor="middle" className="fill-foreground text-[13px] font-bold">
                  {hub.label}
                </text>
              </g>
            );
          })}
          {TASKS.map((task) => {
            const p = posOf(task.id, task.anchor);
            return (
              <g key={task.id} transform={`translate(${p.x} ${p.y})`}>
                <motion.circle
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  r={6}
                  fill={task.color}
                  stroke="white"
                  strokeWidth={1.5}
                  className="drop-shadow-sm"
                />
              </g>
            );
          })}
        </svg>
      </motion.div>

      <div
        aria-hidden="true"
        className="mx-auto mt-6 h-8 w-3/4 rounded-full bg-black/20 blur-2xl dark:bg-black/50"
      />
    </motion.div>
  );
}

export default ContractPreview;
