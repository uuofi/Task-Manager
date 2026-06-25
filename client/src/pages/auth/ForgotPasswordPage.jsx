import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useAuthActions } from '@/contexts/AuthContext';
import { forgotPasswordSchema } from '@/lib/validations';

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuthActions();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const mutation = useMutation({
    mutationFn: ({ email }) => forgotPassword(email),
    onError: (error) => toast.error(getErrorMessage(error, 'Something went wrong')),
  });

  if (mutation.isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="bg-primary/10 text-primary mx-auto grid size-12 place-items-center rounded-full">
          <MailCheck className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground text-sm">
            If an account exists for <span className="text-foreground font-medium">{getValues('email')}</span>,
            we&apos;ve sent a link to reset your password.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </header>

      <form noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
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

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Send reset link
        </Button>
      </form>

      <Button asChild variant="ghost" className="w-full">
        <Link to="/login">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </Button>
    </div>
  );
}

export default ForgotPasswordPage;
