import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import logoMark from '@/assets/logo.png';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

/**
 * Sticky glass header shared by every public marketing page (landing,
 * contribute, …). "Home" and "Features" are smart: on the landing page they
 * smooth-scroll in place, elsewhere they navigate to `/` (optionally with
 * `#features`, which LandingPage scrolls to on mount).
 */
export function SiteHeader() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const goHome = (e) => {
    e.preventDefault();
    if (isHome) window.scrollTo({ top: 0, behavior: 'smooth' });
    else navigate('/');
  };

  const goFeatures = (e) => {
    e.preventDefault();
    if (isHome) document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    else navigate('/#features');
  };

  const goContribute = (e) => {
    e.preventDefault();
    if (isHome) document.getElementById('contribute')?.scrollIntoView({ behavior: 'smooth' });
    else navigate('/#contribute');
  };

  return (
    // Sticky wrapper (never scrolls away) — the pill itself floats inset from
    // the edges so whatever scrolls beneath shows through the glass on all sides.
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <div
        className="border-border/50 bg-background/55 supports-[backdrop-filter]:bg-background/40 relative mx-auto flex max-w-5xl items-center justify-between rounded-full border px-3 py-2 shadow-lg shadow-black/5 backdrop-blur-2xl backdrop-saturate-150 sm:px-4 dark:shadow-black/30"
      >
        <Link to="/" className="flex shrink-0 items-center gap-2 ps-1 font-semibold">
          <img
            src={logoMark}
            alt="TaskControl"
            className="size-8 rounded-lg object-cover"
            width={32}
            height={32}
          />
          <span className="hidden sm:inline">TaskControl</span>
        </Link>

        <nav className="text-muted-foreground absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 text-sm font-medium md:flex">
          <a href="/" onClick={goHome} className="hover:text-foreground transition-colors">
            {t('landing.navHome')}
          </a>
          <a href="/#features" onClick={goFeatures} className="hover:text-foreground transition-colors">
            {t('landing.navFeatures')}
          </a>
          <a href="/#contribute" onClick={goContribute} className="hover:text-foreground transition-colors">
            {t('landing.navContribute')}
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          <LanguageToggle showLabel={false} className="rounded-full" />
          <ThemeToggle className="rounded-full" />
          <Button asChild variant="ghost" className="hidden rounded-full sm:inline-flex">
            <Link to="/login">{t('common.signIn')}</Link>
          </Button>
          <Button asChild variant="cta" className="rounded-full">
            <Link to="/register">{t('landing.getStartedFree')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
