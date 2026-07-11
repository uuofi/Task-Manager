import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ContractPreview } from '@/components/marketing/ContractPreview';

const EASE = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/**
 * "Contract System" feature showcase — a copy block explaining how projects
 * (contracts) and tasks (sub-contracts) link together, paired with a live
 * animated replica of the real diagram from ContractSystemPage.jsx.
 */
export function ContractShowcase() {
  const { t } = useTranslation();

  const points = [t('landing.contractPoint1'), t('landing.contractPoint2'), t('landing.contractPoint3')];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
        >
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {t('landing.contractEyebrow')}
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {t('landing.contractTitle')}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-lg leading-relaxed text-pretty">
            {t('landing.contractSubtitle')}
          </p>

          <ul className="mt-6 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <ContractPreview />
      </div>
    </section>
  );
}

export default ContractShowcase;
