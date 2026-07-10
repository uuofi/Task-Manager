import { motion } from 'framer-motion';
import { ChevronDown, CircleCheck, LineChart, Moon, Sun, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/contexts/ThemeContext';

export const BRAND_GRADIENT = 'linear-gradient(105deg, #5A3BFF 0%, #2D7CFF 48%, #00C2A8 100%)';

export const EASE = [0.16, 1, 0.3, 1];

export const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

export const fadeUpItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

function Feature({ icon: Icon, title, desc }) {
  return (
    <motion.div variants={fadeUpItem} className="flex items-start gap-4">
      <div className="border-border bg-foreground/[0.04] text-primary grid size-11 shrink-0 place-items-center rounded-xl border dark:bg-white/5">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-muted-foreground text-sm">{desc}</p>
      </div>
    </motion.div>
  );
}

/** Types `lead` out, then `accent`, one character at a time, with a blinking caret. */
function TypewriterHeading({ lead, accent }) {
  const [leadCount, setLeadCount] = useState(0);
  const [accentCount, setAccentCount] = useState(0);
  const [caretOn, setCaretOn] = useState(true);

  useEffect(() => {
    if (leadCount < lead.length) {
      const id = setTimeout(() => setLeadCount((c) => c + 1), 55);
      return () => clearTimeout(id);
    }
    if (accentCount < accent.length) {
      const id = setTimeout(() => setAccentCount((c) => c + 1), 55);
      return () => clearTimeout(id);
    }
  }, [leadCount, accentCount, lead, accent]);

  useEffect(() => {
    const id = setInterval(() => setCaretOn((v) => !v), 500);
    return () => clearInterval(id);
  }, []);

  const leadDone = leadCount >= lead.length;
  const accentDone = accentCount >= accent.length;

  return (
    <h1 className="mt-8 text-6xl font-extrabold leading-[1.05] tracking-tight">
      {lead.slice(0, leadCount)}
      {!leadDone && <span className={caretOn ? 'opacity-100' : 'opacity-0'}>|</span>}
      <br />
      <span className="bg-clip-text text-transparent" style={{ backgroundImage: BRAND_GRADIENT }}>
        {accent.slice(0, accentCount)}
      </span>
      {leadDone && !accentDone && (
        <span className={caretOn ? 'text-primary opacity-100' : 'opacity-0'}>|</span>
      )}
    </h1>
  );
}

function AuthHero() {
  const { t, i18n } = useTranslation();

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="hidden lg:block"
    >
      <motion.span
        variants={fadeUpItem}
        className="border-border bg-card/50 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm backdrop-blur-sm"
      >
        <Users className="text-primary size-4" />
        {t('auth.badge')}
      </motion.span>

      <motion.div variants={fadeUpItem}>
        <TypewriterHeading
          key={i18n.language}
          lead={t('auth.heroLead')}
          accent={t('auth.heroAccent')}
        />
      </motion.div>

      <motion.p
        variants={fadeUpItem}
        className="text-muted-foreground mt-6 max-w-md text-lg leading-relaxed"
      >
        {t('auth.heroDesc')}
      </motion.p>

      <div className="mt-10 space-y-6">
        <Feature icon={Users} title={t('auth.feat1Title')} desc={t('auth.feat1Desc')} />
        <Feature icon={CircleCheck} title={t('auth.feat2Title')} desc={t('auth.feat2Desc')} />
        <Feature icon={LineChart} title={t('auth.feat3Title')} desc={t('auth.feat3Desc')} />
      </div>

      {/* Dotted decoration */}
      <motion.div
        variants={fadeUpItem}
        aria-hidden
        className="text-primary/40 mt-12 h-24 w-36"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1.6px, transparent 1.6px)',
          backgroundSize: '20px 20px',
        }}
      />
    </motion.section>
  );
}

/**
 * Shared full-page chrome for auth screens (login/register): ambient gradient
 * orbs, theme toggle, and the left marketing hero. `children` renders the
 * right-hand auth card, which each page composes for its own form.
 */
export function AuthPageShell({ children }) {
  const { t } = useTranslation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="bg-background text-foreground relative min-h-dvh overflow-hidden">
      {/* Ambient gradient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-[#5A3BFF]/25 blur-[130px]" />
        <div className="absolute -bottom-48 left-1/4 size-[34rem] rounded-full bg-[#00C2A8]/20 blur-[130px]" />
        <div className="absolute -right-32 top-1/3 size-[26rem] rounded-full bg-[#2D7CFF]/10 blur-[130px]" />
      </div>

      {/* Theme toggle pill (top-end) */}
      <motion.button
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        type="button"
        onClick={toggleTheme}
        className="border-border bg-card/60 hover:bg-card absolute end-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition"
      >
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        {isDark ? t('settings.dark') : t('settings.light')}
        <ChevronDown className="size-4 opacity-60" />
      </motion.button>

      <div className="relative z-10 mx-auto grid min-h-dvh max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-8 lg:px-8">
        <AuthHero />

        {/* ── Auth card (right) ── */}
        <motion.section
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="mx-auto w-full max-w-md"
        >
          {children}
        </motion.section>
      </div>
    </div>
  );
}
