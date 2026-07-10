import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowRight,
  ChevronDown,
  CircleCheck,
  Eye,
  EyeOff,
  LineChart,
  Lock,
  Mail,
  Moon,
  Sun,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import logoMark from '@/assets/logo.png';
import { Spinner } from '@/components/ui/spinner';
import { useAuthActions } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { loginSchema } from '@/lib/validations';

const BRAND_GRADIENT = 'linear-gradient(105deg, #5A3BFF 0%, #2D7CFF 48%, #00C2A8 100%)';

function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-4">
      <div className="border-border bg-foreground/[0.04] text-primary grid size-11 shrink-0 place-items-center rounded-xl border dark:bg-white/5">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-muted-foreground text-sm">{desc}</p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuthActions();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const from = location.state?.from;
  const redirectTo = from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/app';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Unable to sign in')),
  });

  const fieldClass =
    'border-border bg-foreground/[0.03] focus:border-primary focus:ring-primary/25 h-12 w-full rounded-xl border ps-11 pe-4 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 dark:bg-white/5';

  return (
    <div className="bg-background text-foreground relative min-h-dvh overflow-hidden">
      {/* Ambient gradient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-[#5A3BFF]/25 blur-[130px]" />
        <div className="absolute -bottom-48 left-1/4 size-[34rem] rounded-full bg-[#00C2A8]/20 blur-[130px]" />
        <div className="absolute -right-32 top-1/3 size-[26rem] rounded-full bg-[#2D7CFF]/10 blur-[130px]" />
      </div>

      {/* Theme toggle pill (top-end) */}
      <button
        type="button"
        onClick={toggleTheme}
        className="border-border bg-card/60 hover:bg-card absolute end-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-md transition"
      >
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        {isDark ? t('settings.dark') : t('settings.light')}
        <ChevronDown className="size-4 opacity-60" />
      </button>

      <div className="relative z-10 mx-auto grid min-h-dvh max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:gap-8 lg:px-8">
        {/* ── Hero (left) ── */}
        <section className="hidden lg:block">
          <span className="border-border bg-card/50 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm backdrop-blur-sm">
            <Users className="text-primary size-4" />
            {t('auth.badge')}
          </span>

          <h1 className="mt-8 text-6xl font-extrabold leading-[1.05] tracking-tight">
            {t('auth.heroLead')}
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: BRAND_GRADIENT }}
            >
              {t('auth.heroAccent')}
            </span>
          </h1>

          <p className="text-muted-foreground mt-6 max-w-md text-lg leading-relaxed">
            {t('auth.heroDesc')}
          </p>

          <div className="mt-10 space-y-6">
            <Feature icon={Users} title={t('auth.feat1Title')} desc={t('auth.feat1Desc')} />
            <Feature icon={CircleCheck} title={t('auth.feat2Title')} desc={t('auth.feat2Desc')} />
            <Feature icon={LineChart} title={t('auth.feat3Title')} desc={t('auth.feat3Desc')} />
          </div>

          {/* Dotted decoration */}
          <div
            aria-hidden
            className="text-primary/40 mt-12 h-24 w-36"
            style={{
              backgroundImage: 'radial-gradient(currentColor 1.6px, transparent 1.6px)',
              backgroundSize: '20px 20px',
            }}
          />
        </section>

        {/* ── Auth card (right) ── */}
        <section className="mx-auto w-full max-w-md">
          <div className="border-border bg-card/70 rounded-3xl border p-8 shadow-2xl backdrop-blur-xl sm:p-10">
            {/* Logo mark with glow */}
            <div className="relative mx-auto w-fit">
              <div
                aria-hidden
                className="absolute inset-0 rounded-2xl opacity-60 blur-xl"
                style={{ backgroundImage: BRAND_GRADIENT }}
              />
              <img
                src={logoMark}
                alt="TaskControl"
                className="relative size-16 rounded-2xl"
                width={64}
                height={64}
              />
            </div>

            <h2 className="mt-6 text-center text-2xl font-bold tracking-tight">
              {t('auth.welcomeBack')}
            </h2>
            <p className="text-muted-foreground mt-1.5 text-center text-sm">
              {t('auth.continueAccount')}
            </p>

            <form
              noValidate
              onSubmit={handleSubmit((v) => mutation.mutate(v))}
              className="mt-8 space-y-5"
            >
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="text-muted-foreground pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    aria-invalid={!!errors.email}
                    className={fieldClass}
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    {t('auth.password')}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-primary text-xs font-medium hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="text-muted-foreground pointer-events-none absolute start-3.5 top-1/2 size-[18px] -translate-y-1/2" />
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    className={`${fieldClass} pe-11`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 end-0 flex w-11 items-center justify-center transition-colors"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={mutation.isPending}
                className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold text-white shadow-lg shadow-[#5A3BFF]/25 transition hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundImage: BRAND_GRADIENT }}
              >
                {mutation.isPending && <Spinner />}
                {t('common.signIn')}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </button>
            </form>

            <p className="text-muted-foreground mt-8 text-center text-sm">
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                state={location.state}
                className="text-primary font-semibold hover:underline"
              >
                {t('auth.createOne')}
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
