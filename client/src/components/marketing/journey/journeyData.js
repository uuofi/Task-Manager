import devopsOffice from '@/assets/Dev-Ops.png';
import developmentOffice from '@/assets/Development.png';
import taskManagementOffice from '@/assets/work-Area.png';

/**
 * Fixed design canvas the cinematic stage is laid out in. The stage element
 * is forced to this exact aspect ratio, and the neon SVG uses it as its
 * viewBox — so office CSS percentages and SVG path coordinates share one
 * coordinate system (no DOM measurement needed) and circles never distort.
 */
export const DESIGN_W = 1600;
export const DESIGN_H = 1100;

/**
 * The connecting neon route, in design-space units, snaking down through the
 * three offices (top-left → mid-right → bottom-left) like the reference.
 * The `anchor` on each chapter below lies on this path; the animation hook
 * scans the path to find each anchor's length-fraction, which is exactly
 * when that office lights up as the line draws.
 */
export const NEON_PATH_D =
  'M 600 380 C 540 520, 900 600, 1030 560 C 1150 690, 790 800, 710 900';

/**
 * The three chapters of the storytelling section. Order and copy come from
 * the product's real i18n content (`journey` namespace). Each chapter also
 * carries its illustration, a brand accent (from the app palette), and its
 * placement in the design canvas: `office` (center + width), `label` (text
 * block corner) and `anchor` (where the neon path touches it).
 */
export const JOURNEY_CHAPTERS = [
  {
    id: 'task-management',
    image: taskManagementOffice,
    accent: '#5A3BFF',
    nameKey: 'journey.chapter1Name',
    titleKey: 'journey.chapter1Title',
    descKey: 'journey.chapter1Desc',
    featureKeys: [
      'journey.chapter1Feature1',
      'journey.chapter1Feature2',
      'journey.chapter1Feature3',
      'journey.chapter1Feature4',
    ],
    office: { cx: 650, cy: 230, w: 500 },
    label: { x: 40, y: 110, w: 21 },
    anchor: { x: 600, y: 380 },
  },
  {
    id: 'devops',
    image: devopsOffice,
    accent: '#00C2A8',
    nameKey: 'journey.chapter2Name',
    titleKey: 'journey.chapter2Title',
    descKey: 'journey.chapter2Desc',
    featureKeys: [
      'journey.chapter2Feature1',
      'journey.chapter2Feature2',
      'journey.chapter2Feature3',
      'journey.chapter2Feature4',
    ],
    office: { cx: 1170, cy: 470, w: 500 },
    label: { x: 905, y: 56, w: 22 },
    anchor: { x: 1030, y: 560 },
  },
  {
    id: 'development',
    image: developmentOffice,
    accent: '#2D7CFF',
    nameKey: 'journey.chapter3Name',
    titleKey: 'journey.chapter3Title',
    descKey: 'journey.chapter3Desc',
    featureKeys: [
      'journey.chapter3Feature1',
      'journey.chapter3Feature2',
      'journey.chapter3Feature3',
      'journey.chapter3Feature4',
    ],
    office: { cx: 640, cy: 850, w: 500 },
    label: { x: 40, y: 700, w: 21 },
    anchor: { x: 710, y: 900 },
  },
];

/** Convert a design-space point to CSS left/top percentages of the stage. */
export const toPct = (x, y) => ({
  left: `${(x / DESIGN_W) * 100}%`,
  top: `${(y / DESIGN_H) * 100}%`,
});
