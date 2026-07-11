import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Logo } from '@/components/common/Logo';

/**
 * Shared marketing footer — product/legal navigation plus copyright. Mounted
 * on the landing page and every standalone legal/contact page so the same
 * links are reachable from anywhere in the public site.
 */
export function SiteFooter() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const goSection = (hash) => (e) => {
    e.preventDefault();
    if (isHome) document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
    else navigate(`/#${hash}`);
  };

  const productLinks = [
    { label: t('landing.navHome'), to: '/' },
    { label: t('landing.navFeatures'), href: `/#features`, onClick: goSection('features') },
    { label: t('landing.navContribute'), href: `/#contribute`, onClick: goSection('contribute') },
  ];

  const legalLinks = [
    { label: t('footer.privacyPolicy'), to: '/privacy-policy' },
    { label: t('footer.terms'), to: '/terms' },
    { label: t('footer.intellectualProperty'), to: '/intellectual-property' },
  ];

  return (
    <footer className="border-border/60 relative z-10 border-t">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              {t('footer.productHeading')}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {productLinks.map((link) =>
                link.to ? (
                  <li key={link.label}>
                    <Link to={link.to} className="text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ) : (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={link.onClick}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
              {t('footer.legalHeading')}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {legalLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-border/60 text-muted-foreground mt-12 border-t pt-6 text-center text-sm">
          {t('footer.rights', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
