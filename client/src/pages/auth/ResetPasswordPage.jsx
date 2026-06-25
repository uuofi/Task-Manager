import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuthActions } from '@/contexts/AuthContext';
import { resetPasswordSchema } from '@/lib/validations';

export function ResetPasswordPage() {
  const { resetPassword } = useAuthActions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: ({ password }) => resetPassword({ token, password }),
    onSuccess: () => {
      toast.success('Password reset. Please sign in.');
      navigate('/login', { replace: true });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Unable to reset password')),
  });

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Invalid reset link</h1>
        <p className="text-muted-foreground text-sm">
          This password reset link is missing or malformed. Please request a new one.
        </p>
        <Button asChild className="w-full">
          <Link to="/forgot-password">Request new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-muted-foreground text-sm">Choose a strong password you&apos;ll remember.</p>
      </header>

      <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-destructive text-xs">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Reset password
        </Button>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
