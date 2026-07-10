import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  FolderKanban,
  Network,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/app', key: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/projects', key: 'projects', icon: FolderKanban },
  { to: '/app/contracts', key: 'contracts', icon: Network },
  { to: '/app/tasks', key: 'myTasks', icon: ListChecks },
  { to: '/app/calendar', key: 'calendar', icon: CalendarDays },
  { to: '/app/suggestions', key: 'suggestions', icon: Lightbulb },
  { to: '/app/team', key: 'team', icon: Users },
  { to: '/app/insights', key: 'insights', icon: BarChart3 },
  { to: '/app/settings', key: 'settings', icon: Settings },
];

function NavItem({ item, label, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        )
      }
    >
      <Icon className="size-[18px] shrink-0" />
      {label}
    </NavLink>
  );
}

export function Sidebar({ mobileOpen, onClose }) {
  const { t } = useTranslation();
  const workspaces = useAuthStore((s) => s.workspaces);
  const activeWorkspaceId = useAuthStore((s) => s.activeWorkspaceId);
  const workspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const content = (
    <div className="bg-sidebar flex h-full flex-col border-e">
      <div className="flex items-center justify-between px-5 py-4">
        <Logo to="/app" />
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
          <X className="size-5" />
        </Button>
      </div>

      {workspace && (
        <div className="mx-3 mb-2 rounded-lg border bg-sidebar-accent/40 px-3 py-2">
          <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
            {t('nav.workspace')}
          </p>
          <p className="truncate text-sm font-semibold">{workspace.name}</p>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map((item) => (
          <NavItem key={item.to} item={item} label={t(`nav.${item.key}`)} onNavigate={onClose} />
        ))}
      </nav>

      <div className="text-muted-foreground px-5 py-4 text-xs">TaskControl v1.0</div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 lg:block">{content}</aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="absolute start-0 top-0 h-full w-64 animate-in fade-in">{content}</div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
