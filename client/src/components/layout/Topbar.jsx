import { Menu, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageToggle } from '@/components/common/LanguageToggle';
import { GlobalSearch } from '@/components/layout/GlobalSearch';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { UserMenu } from '@/components/layout/UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

export function Topbar({ onMenuClick }) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd/Ctrl-K opens search.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="Menu">
        <Menu className="size-5" />
      </Button>

      <button
        onClick={() => setSearchOpen(true)}
        className="text-muted-foreground hover:bg-accent hidden h-9 w-full max-w-xs items-center gap-2 rounded-md border px-3 text-sm transition-colors sm:flex"
      >
        <Search className="size-4" />
        {t('common.search')}
        <kbd className="bg-muted ms-auto rounded px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setSearchOpen(true)}
        aria-label="Search"
      >
        <Search className="size-5" />
      </Button>

      <div className="ms-auto flex items-center gap-1">
        <LanguageToggle showLabel={false} />
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

export default Topbar;
