import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import { LanguageToggle } from '@/components/common/LanguageToggle';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

const highlights = [
  'Realtime collaboration with live presence',
  'Built-in time tracking and overdue detection',
  'Beautiful dashboards your team will love',
];

/**
 * Two-column layout for auth pages: a branded marketing panel on the left
 * (hidden on small screens) and the form outlet on the right.
 */
export function AuthLayout() {
  return (
    <div className="bg-background min-h-dvh lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="bg-primary text-primary-foreground relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%)]"
        />
        <Logo asLink className="relative text-primary-foreground" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative space-y-6"
        >
          <h2 className="max-w-md text-3xl font-bold leading-tight text-balance">
            Where high-performing teams plan, track and ship their work.
          </h2>
          <ul className="space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="size-5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <p className="relative text-sm opacity-80">
          © {new Date().getFullYear()} TaskControl
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex min-h-dvh flex-col">
        <div className="flex items-center justify-between p-6 lg:justify-end">
          <Logo className="lg:hidden" />
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
