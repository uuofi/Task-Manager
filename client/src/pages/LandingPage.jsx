import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import { ContractShowcase } from '@/components/marketing/ContractShowcase';
import { ContributeShowcase } from '@/components/marketing/ContributeShowcase';
import { DashboardPreview } from '@/components/marketing/DashboardPreview';
import { TaskJourney } from '@/components/marketing/journey/TaskJourney';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { Button } from '@/components/ui/button';

const EASE = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: EASE },
  }),
};

export function LandingPage() {
  const { t } = useTranslation();
  const location = useLocation();

  // Land on `#features` (e.g. navigated here from another page's header) —
  // React Router doesn't scroll to hashes on its own.
  useEffect(() => {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    el?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

  return (
    // The header lives outside the overflow-hidden wrapper below — an
    // `overflow: hidden` ancestor (needed to clip the decorative orbs) also
    // clips/breaks `position: sticky`, so it can't sit between the header and
    // the viewport or the header would scroll away instead of staying fixed.
    <div className="bg-background text-foreground relative min-h-screen">
      <SiteHeader />

      <div className="relative overflow-hidden">
        {/* Ambient gradient orbs — matches the auth pages' brand treatment */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-[#5A3BFF]/20 blur-[130px]" />
          <div className="absolute -right-32 top-1/4 size-[28rem] rounded-full bg-[#2D7CFF]/15 blur-[130px]" />
        </div>

        {/* Hero */}
        <main className="relative z-10">
          <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:py-28">
            <div>
              <motion.span
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="border-border bg-card/60 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm backdrop-blur-sm"
              >
                <span className="bg-primary size-1.5 rounded-full" />
                {t('landing.badgeOrganize')} <span className="text-muted-foreground">•</span>{' '}
                {t('landing.badgeTrack')} <span className="text-muted-foreground">•</span>{' '}
                {t('landing.badgeAchieve')}
              </motion.span>

              <motion.h1
                initial="hidden"
                animate="show"
                custom={1}
                variants={fadeUp}
                className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl"
              >
                {t('landing.heroTitleLead')}{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(105deg, #5A3BFF 0%, #2D7CFF 48%, #00C2A8 100%)',
                  }}
                >
                  {t('landing.heroTitleAccent')}
                </span>
              </motion.h1>

              <motion.p
                initial="hidden"
                animate="show"
                custom={2}
                variants={fadeUp}
                className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed text-pretty"
              >
                {t('landing.heroSubtitle')}
              </motion.p>

              <motion.div
                initial="hidden"
                animate="show"
                custom={3}
                variants={fadeUp}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Button asChild size="lg" variant="cta">
                  <Link to="/register">
                    {t('landing.getStartedFree')} <ArrowRight className="size-4 rtl:rotate-180" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#features">{t('landing.exploreFeatures')}</a>
                </Button>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="show"
                custom={4}
                variants={fadeUp}
                className="text-muted-foreground mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm"
              >
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="text-success size-4" /> {t('landing.trustEasy')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="text-success size-4" /> {t('landing.trustCollab')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="text-success size-4" /> {t('landing.trustRealtime')}
                </span>
              </motion.div>
            </div>

            <DashboardPreview />
          </section>
        </main>

        {/* Contract System — projects as contracts, tasks as linked sub-contracts. */}
        <ContractShowcase />

        {/* How work moves — replaces a conventional features grid with a
            storytelling journey through real departments. */}
        <TaskJourney />

        {/* Open source — how to run it locally and contribute. */}
        <ContributeShowcase />

        <footer className="border-border/60 text-muted-foreground relative z-10 border-t py-8 text-center text-sm">
          © {new Date().getFullYear()} TaskControl. Crafted for teams that ship.
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
