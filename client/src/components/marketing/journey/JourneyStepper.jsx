import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';

const COMPLETED_ACCENT = '#22D37D';

/**
 * Vertical progress rail on the right of the cinematic stage — mirrors the
 * reference: 01 / 02 / 03 nodes plus a final "Completed" check, distributed
 * evenly across the FULL height of the stage (justify-between inside a
 * height-filling container). A single background rail runs node-center to
 * node-center; the filled overlay grows to the current node. Fill is
 * cumulative (every reached node stays lit), while the *current* node gets
 * the extra glow + scale so the eye always knows where the task is.
 *
 * Parent must give this a height (see TaskJourney: top/bottom insets).
 */
export function JourneyStepper({ chapters, activeIndex, complete }) {
  const { t } = useTranslation();

  const nodes = [
    ...chapters.map((c, i) => ({ key: c.id, label: t(c.nameKey), accent: c.accent, index: i })),
    {
      key: 'completed',
      label: t('journey.completed'),
      accent: COMPLETED_ACCENT,
      index: chapters.length,
      isCompleted: true,
    },
  ];

  const currentPos = complete ? chapters.length : activeIndex;
  const fillRatio = currentPos / (nodes.length - 1);

  return (
    <div className="relative flex h-full flex-col justify-between">
      {/* Background rail — spans from first node center to last node center. */}
      <span
        aria-hidden="true"
        className="absolute start-[11px] top-[11px] bottom-[11px] w-0.5 rounded-full bg-white/12"
      />
      {/* Filled rail — grows to the current node. */}
      <span
        aria-hidden="true"
        className="absolute start-[11px] top-[11px] w-0.5 rounded-full bg-white/80 transition-[height] duration-700 ease-out"
        style={{ height: `calc((100% - 22px) * ${fillRatio})` }}
      />

      {nodes.map((node) => {
        const reached = node.index <= currentPos;
        const isCurrent = node.index === currentPos;

        return (
          <div key={node.key} className="relative z-10 flex items-center gap-4">
            <span
              aria-hidden="true"
              className="grid size-[23px] shrink-0 place-items-center rounded-full border-2 transition-all duration-500"
              style={{
                borderColor: reached ? node.accent : 'rgba(255,255,255,0.25)',
                backgroundColor: reached ? node.accent : 'transparent',
                boxShadow: isCurrent ? `0 0 16px 2px ${node.accent}` : 'none',
                transform: isCurrent ? 'scale(1.25)' : 'scale(1)',
              }}
            >
              {node.isCompleted && reached && <Check className="size-3.5 text-[#0D1321]" />}
            </span>

            <div className="leading-tight">
              {!node.isCompleted && (
                <span
                  className="block text-sm font-bold tabular-nums transition-colors duration-500"
                  style={{ color: reached ? node.accent : 'rgba(255,255,255,0.4)' }}
                >
                  {String(node.index + 1).padStart(2, '0')}
                </span>
              )}
              <span
                className={cn(
                  'block text-sm font-medium transition-colors duration-500',
                  isCurrent ? 'text-white' : reached ? 'text-white/75' : 'text-white/40',
                )}
              >
                {node.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default JourneyStepper;
