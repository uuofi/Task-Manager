import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import logoMark from '@/assets/logo.png';
import { Spinner } from '@/components/ui/spinner';
import { useAuthActions } from '@/contexts/AuthContext';
import { loginSchema } from '@/lib/validations';

import { AuthPageShell, BRAND_GRADIENT, fadeUpItem, staggerContainer } from './AuthPageShell';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);

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
    <AuthPageShell>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="border-border bg-card/70 rounded-3xl border p-8 shadow-2xl backdrop-blur-xl sm:p-10"
      >
        {/* Logo mark with glow */}
        <motion.div variants={fadeUpItem} className="relative mx-auto w-fit">
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
        </motion.div>

        <motion.h2
          variants={fadeUpItem}
          className="mt-6 text-center text-2xl font-bold tracking-tight"
        >
          {t('auth.welcomeBack')}
        </motion.h2>
        <motion.p
          variants={fadeUpItem}
          className="text-muted-foreground mt-1.5 text-center text-sm"
        >
          {t('auth.continueAccount')}
        </motion.p>

        <motion.form
          variants={fadeUpItem}
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
        </motion.form>

        <motion.p
          variants={fadeUpItem}
          className="text-muted-foreground mt-8 text-center text-sm"
        >
          {t('auth.noAccount')}{' '}
          <Link
            to="/register"
            state={location.state}
            className="text-primary font-semibold hover:underline"
          >
            {t('auth.createOne')}
          </Link>
        </motion.p>
      </motion.div>
    </AuthPageShell>
  );
}

export default LoginPage;
