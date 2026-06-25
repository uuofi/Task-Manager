import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuthActions } from '@/contexts/AuthContext';
import { loginSchema } from '@/lib/validations';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuthActions();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const redirectTo = from
    ? `${from.pathname}${from.search || ''}${from.hash || ''}`
    : '/app';

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

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t('auth.welcomeBack')}</h1>
        <p className="text-muted-foreground text-sm">{t('auth.signInSubtitle')}</p>
      </header>

      <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Link
              to="/forgot-password"
              className="text-primary text-xs font-medium hover:underline"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          {t('common.signIn')}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        {t('auth.noAccount')}{' '}
        <Link to="/register" state={location.state} className="text-primary font-medium hover:underline">
          {t('auth.createOne')}
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
