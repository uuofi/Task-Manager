import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { PasswordInput } from '@/components/common/PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuthActions } from '@/contexts/AuthContext';
import { registerSchema } from '@/lib/validations';

export function RegisterPage() {
  const { register: registerUser } = useAuthActions();
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
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: ({ name, email, password }) => registerUser({ name, email, password }),
    onSuccess: (user) => {
      toast.success(`Welcome to TaskControl, ${user.name.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Unable to create account')),
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground text-sm">
          Start managing your team&apos;s work in minutes.
        </p>
      </header>

      <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="password">Password</Label>
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
          <Label htmlFor="confirmPassword">Confirm password</Label>
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
          Create account
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
