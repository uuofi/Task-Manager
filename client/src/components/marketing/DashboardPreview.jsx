import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Network,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import logoMark from '@/assets/logo.png';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/format';

// Mirrors the real sidebar's nav icon order (client/src/components/layout/Sidebar.jsx).
const RAIL_ICONS = [LayoutDashboard, FolderKanban, Network, ListTodo, CalendarDays, Users, BarChart3, Settings];

// Tone classes copied from the real StatCard (client/src/pages/app/DashboardPage.jsx)
// so this preview stays visually identical to the actual dashboard.
const STAT_TONE = {
  primary: 'text-primary bg-primary/10',
  warning: 'text-amber-600 bg-amber-500/10',
  destructive: 'text-destructive bg-destructive/10',
  success: 'text-emerald-600 bg-emerald-500/10',
};

function MiniStat({ icon: Icon, value, label, tone }) {
  return (
    <div className="border-border bg-card rounded-xl border p-2.5">
      <div className={`mb-2 grid size-7 place-items-center rounded-lg ${STAT_TONE[tone]}`}>
        <Icon className="size-3.5" />
      </div>
      <p className="text-base font-bold leading-none">{value}</p>
      <p className="text-muted-foreground mt-1 truncate text-[10px] leading-tight">{label}</p>
    </div>
  );
}

function MiniTask({ dot, title, tag, progress }) {
  return (
    <div className="flex items-center gap-2 rounded-lg py-1">
      <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{title}</span>
      <Badge variant="secondary" className="hidden shrink-0 text-[9px] sm:inline-flex">
        {tag}
      </Badge>
      <div className="hidden w-12 shrink-0 items-center gap-1 md:flex">
        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
          <div className="bg-primary h-full rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-muted-foreground text-[9px]">{progress}%</span>
      </div>
    </div>
  );
}

function MiniActivity({ name, message, time }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar className="size-6 shrink-0">
        <AvatarFallback className="text-[9px]">{initials(name)}</AvatarFallback>
      </Avatar>
      <p className="min-w-0 flex-1 text-[11px] leading-snug">
        <span className="font-medium">{name}</span>{' '}
        <span className="text-muted-foreground">{message}</span>
      </p>
      <span className="text-muted-foreground shrink-0 text-[9px]">{time}</span>
    </div>
  );
}

/**
 * A static, presentational replica of the real authenticated dashboard
 * (icon rail from Sidebar.jsx, topbar from Topbar.jsx, stat cards + task
 * list + activity feed from DashboardPage.jsx) used to preview the product
 * on the marketing home page. Copy is pulled from the same i18n keys the
 * real dashboard uses so it never drifts from the actual app.
 */
export function DashboardPreview() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const tasks = [
    { dot: 'bg-emerald-500', title: t('landing.task1'), tag: t('landing.task1Tag'), progress: 80 },
    { dot: 'bg-amber-500', title: t('landing.task2'), tag: t('landing.task2Tag'), progress: 60 },
    { dot: 'bg-blue-500', title: t('landing.task3'), tag: t('landing.task3Tag'), progress: 40 },
  ];

  const activity = [
    { name: t('landing.activityUser1'), message: t('landing.activity1'), time: '2h ago' },
    { name: t('landing.activityUser2'), message: t('landing.activity2'), time: '4h ago' },
    { name: t('landing.activityUser3'), message: t('landing.activity3'), time: '9h ago' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className="mx-auto w-full max-w-lg"
    >
      {/* Tilted 3D card — perpetual float loop conveys weightlessness. */}
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -16, 0] }}
        transition={
          reduceMotion ? undefined : { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ rotateX: 8, rotateY: -12, transformPerspective: 1400 }}
        role="img"
        aria-label={t('landing.previewAlt')}
        className="border-border bg-card/90 rounded-3xl border p-4 shadow-[0_50px_100px_-30px_rgba(45,30,140,0.45)] backdrop-blur-xl sm:p-5"
      >
        <div aria-hidden="true" className="flex gap-3">
          {/* Icon rail — mirrors the real sidebar */}
          <div className="border-border hidden flex-col items-center gap-2 border-e pe-3 sm:flex">
            <img src={logoMark} alt="" className="mb-1 size-7 rounded-lg" width={28} height={28} />
            {RAIL_ICONS.map((Icon, i) => (
              <span
                key={i}
                className={`grid size-8 place-items-center rounded-lg ${
                  i === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon className="size-4" />
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            {/* Topbar — mirrors the real greeting + search + bell + avatar */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {t('dashboard.greeting', { name: t('landing.previewName') })}
                </p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {t('dashboard.subtitle')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-muted-foreground border-border hidden h-7 items-center gap-1.5 rounded-md border px-2 text-[10px] md:flex">
                  <Search className="size-3" />
                  {t('common.search')}
                </span>
                <span className="text-muted-foreground border-border grid size-7 place-items-center rounded-md border">
                  <Bell className="size-3.5" />
                </span>
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px]">
                    {initials(t('landing.previewName'))}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Stat cards — same icons, labels and tones as the real dashboard */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniStat icon={CalendarClock} value="5" label={t('dashboard.dueToday')} tone="primary" />
              <MiniStat
                icon={AlertTriangle}
                value="2"
                label={t('dashboard.overdue')}
                tone="destructive"
              />
              <MiniStat
                icon={ListTodo}
                value="12"
                label={t('dashboard.assignedToMe')}
                tone="warning"
              />
              <MiniStat
                icon={CheckCircle2}
                value="24"
                label={t('dashboard.completedThisWeek')}
                tone="success"
              />
            </div>

            {/* Tasks + activity — same structure as the real dashboard panels */}
            <div className="grid gap-3 sm:grid-cols-5">
              <div className="border-border rounded-xl border p-3 sm:col-span-3">
                <p className="mb-2 text-[11px] font-semibold">{t('dashboard.todaysTasks')}</p>
                <div className="space-y-1">
                  {tasks.map((task) => (
                    <MiniTask key={task.title} {...task} />
                  ))}
                </div>
              </div>
              <div className="border-border rounded-xl border p-3 sm:col-span-2">
                <p className="mb-2 text-[11px] font-semibold">{t('dashboard.recentActivity')}</p>
                <div className="space-y-2.5">
                  {activity.map((item) => (
                    <MiniActivity key={item.name} {...item} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Soft contact shadow beneath the card sells the floating illusion. */}
      <div
        aria-hidden="true"
        className="mx-auto mt-6 h-8 w-3/4 rounded-full bg-black/20 blur-2xl dark:bg-black/50"
      />
    </motion.div>
  );
}

export default DashboardPreview;
