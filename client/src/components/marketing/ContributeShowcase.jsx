import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bug,
  GitFork,
  GitPullRequest,
  Layers,
  Scale,
  Terminal,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

const REPO_URL = 'https://github.com/uuofi/Task-Manager';

const EASE = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const ARCHITECTURE_FLOW = ['routes', 'controllers', 'services', 'repositories', 'models'];

const BACKEND_STACK = [
  'Node.js',
  'Express',
  'MongoDB + Mongoose',
  'Redis (cache)',
  'BullMQ (queues)',
  'Socket.IO',
  'JWT',
  'Multer',
];
const FRONTEND_STACK = ['React 19', 'Vite', 'React Router', 'TanStack Query', 'Tailwind CSS', 'Framer Motion'];

const QUICK_START = [
  `git clone ${REPO_URL}.git`,
  'cd Task-Manager && npm run install:all',
  'npm run dev',
];

function StepCard({ icon: Icon, title, desc, index }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
      className="border-border bg-card/60 relative rounded-2xl border p-5 backdrop-blur-sm"
    >
      <span className="text-muted-foreground/50 absolute end-5 top-4 text-3xl font-extrabold tabular-nums">
        {String(index).padStart(2, '0')}
      </span>
      <div className="bg-primary/10 text-primary grid size-10 place-items-center rounded-xl">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function StackColumn({ title, items }) {
  return (
    <div className="border-border bg-card/60 rounded-2xl border p-5 backdrop-blur-sm">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="border-border bg-background/60 rounded-full border px-3 py-1 text-xs font-medium"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * "Open Source / Contribute" section — lives inline in the landing page's
 * scroll order (id="contribute", linked from SiteHeader) rather than as a
 * standalone route, matching the other feature sections (ContractShowcase,
 * TaskJourney).
 */
export function ContributeShowcase() {
  const { t } = useTranslation();

  const steps = [
    { icon: GitFork, title: t('contribute.step1Title'), desc: t('contribute.step1Desc') },
    { icon: Layers, title: t('contribute.step2Title'), desc: t('contribute.step2Desc') },
    { icon: Terminal, title: t('contribute.step3Title'), desc: t('contribute.step3Desc') },
    { icon: GitPullRequest, title: t('contribute.step4Title'), desc: t('contribute.step4Desc') },
  ];

  return (
    <section id="contribute" className="relative z-10 mx-auto max-w-6xl px-6 py-16 sm:py-20">
      {/* Intro */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={fadeUp}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="border-border bg-card/60 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm backdrop-blur-sm">
          <GitFork className="text-primary size-3.5" />
          {t('contribute.eyebrow')}
        </span>

        <h2 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {t('contribute.title')}
        </h2>

        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg leading-relaxed text-pretty">
          {t('contribute.subtitle')}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" variant="cta">
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              {t('contribute.forkRepo')} <ArrowRight className="size-4 rtl:rotate-180" />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">
              <Bug className="size-4" /> {t('contribute.issuesCta')}
            </a>
          </Button>
        </div>
      </motion.div>

      {/* Quick start */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        variants={fadeUp}
        className="mx-auto mt-14 max-w-2xl"
      >
        <h3 className="text-center text-lg font-semibold">{t('contribute.quickStartTitle')}</h3>
        <div className="border-border bg-[#0D1321] mt-4 overflow-hidden rounded-2xl border shadow-xl">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="space-y-2 p-5 font-mono text-sm">
            {QUICK_START.map((line) => (
              <p key={line} className="text-white/85">
                <span className="text-[#00C2A8]">$</span> {line}
              </p>
            ))}
          </div>
        </div>
      </motion.div>

      {/* How to contribute */}
      <div className="mt-16">
        <motion.h3
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
        >
          {t('contribute.stepsTitle')}
        </motion.h3>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <StepCard key={step.title} index={i + 1} {...step} />
          ))}
        </div>
      </div>

      {/* Architecture flow */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.6 }}
        variants={fadeUp}
        className="border-border bg-card/60 mx-auto mt-16 flex max-w-4xl flex-wrap items-center justify-center gap-2 rounded-2xl border p-6 backdrop-blur-sm"
      >
        {ARCHITECTURE_FLOW.map((layer, i) => (
          <span key={layer} className="flex items-center gap-2">
            <span className="border-border bg-background/70 rounded-full border px-3.5 py-1.5 text-sm font-mono font-medium">
              {layer}
            </span>
            {i < ARCHITECTURE_FLOW.length - 1 && (
              <ArrowRight className="text-muted-foreground size-4 rtl:rotate-180" />
            )}
          </span>
        ))}
      </motion.div>

      {/* Tech stack */}
      <div className="mx-auto mt-16 max-w-4xl">
        <motion.h3
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          variants={fadeUp}
          className="text-center text-2xl font-bold tracking-tight sm:text-3xl"
        >
          {t('contribute.stackTitle')}
        </motion.h3>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <StackColumn title={t('contribute.stackBackend')} items={BACKEND_STACK} />
          <StackColumn title={t('contribute.stackFrontend')} items={FRONTEND_STACK} />
        </div>
      </div>

      {/* License */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.6 }}
        variants={fadeUp}
        className="border-border bg-card/60 mx-auto mt-16 flex max-w-2xl items-start gap-4 rounded-2xl border p-6 backdrop-blur-sm"
      >
        <div className="bg-primary/10 text-primary grid size-11 shrink-0 place-items-center rounded-xl">
          <Scale className="size-5" />
        </div>
        <div>
          <h3 className="font-semibold">{t('contribute.licenseTitle')}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {t('contribute.licenseDesc')}
          </p>
        </div>
      </motion.div>
    </section>
  );
}

export default ContributeShowcase;
