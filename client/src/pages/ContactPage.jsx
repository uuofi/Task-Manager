import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { MailCheck, MessageCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { contactApi } from '@/api/misc.api';
import { getErrorMessage } from '@/api/axiosClient';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { contactSchema } from '@/lib/validations';

export function ContactPage() {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '', company: '' },
  });

  const mutation = useMutation({
    mutationFn: (payload) => contactApi.submit(payload),
    onError: (error) => toast.error(getErrorMessage(error, t('contact.error'))),
  });

  const onSubmit = (values) => mutation.mutate(values, { onSuccess: () => reset() });

  return (
    <div className="bg-background text-foreground relative min-h-screen">
      <SiteHeader />

      <main className="relative z-10 mx-auto grid max-w-5xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <span className="border-border bg-card/60 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm backdrop-blur-sm">
            <MessageCircle className="text-primary size-3.5" />
            {t('contact.eyebrow')}
          </span>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('contact.title')}</h1>
          <p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed">{t('contact.subtitle')}</p>
        </div>

        <div className="border-border bg-card/60 rounded-2xl border p-6 backdrop-blur-sm sm:p-8">
          {mutation.isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="bg-primary/10 text-primary grid size-12 place-items-center rounded-full">
                <MailCheck className="size-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">{t('contact.successTitle')}</h2>
                <p className="text-muted-foreground text-sm">{t('contact.successDesc')}</p>
              </div>
              <Button variant="outline" onClick={() => mutation.reset()}>
                {t('contact.sendAnother')}
              </Button>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('contact.name')}</Label>
                  <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register('name')} />
                  {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    {...register('email')}
                  />
                  {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">{t('contact.subject')}</Label>
                <Input id="subject" aria-invalid={!!errors.subject} {...register('subject')} />
                {errors.subject && <p className="text-destructive text-xs">{errors.subject.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t('contact.message')}</Label>
                <Textarea
                  id="message"
                  rows={6}
                  aria-invalid={!!errors.message}
                  {...register('message')}
                />
                {errors.message && <p className="text-destructive text-xs">{errors.message.message}</p>}
              </div>

              {/* Honeypot — hidden from real users via CSS, catches simple bots. */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register('company')} />
              </div>

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner />}
                {t('contact.send')}
              </Button>
            </form>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default ContactPage;
