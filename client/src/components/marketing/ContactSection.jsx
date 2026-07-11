import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MailCheck, MessageCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { getErrorMessage } from '@/api/axiosClient';
import { contactApi } from '@/api/misc.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { contactSchema } from '@/lib/validations';

const EASE = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/**
 * "Contact" section — lives inline in the landing page's scroll order
 * (id="contact", right after Contribute, linked from SiteHeader) rather than
 * as a standalone route, matching the other public sections.
 */
export function ContactSection() {
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
    <section id="contact" className="relative z-10 mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
        >
          <span className="border-border bg-card/60 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm backdrop-blur-sm">
            <MessageCircle className="text-primary size-3.5" />
            {t('contact.eyebrow')}
          </span>

          <h2 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{t('contact.title')}</h2>

          <p className="text-muted-foreground mt-4 max-w-md text-lg leading-relaxed text-pretty">
            {t('contact.subtitle')}
          </p>
        </motion.div>

        {/* Card wrapper — isolated from the tilt/float transforms below so the
            fade-in-on-scroll entrance and the perpetual floating animation
            don't fight over the same `animate` prop. */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="relative mx-auto w-full max-w-md"
        >
          {/* Glow shadow — blurred and animated independently so it reads as
              light pooling under the card as it drifts, not a static blob. */}
          <motion.div
            aria-hidden
            className="absolute inset-x-8 -bottom-6 h-20 rounded-full blur-2xl"
            style={{ backgroundImage: 'linear-gradient(105deg, #5A3BFF 0%, #2D7CFF 60%, #00C2A8 100%)' }}
            animate={{ opacity: [0.25, 0.45, 0.25], scale: [0.92, 1.05, 0.92], x: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            className="border-border bg-card/85 relative rounded-2xl border p-6 shadow-[0_30px_60px_-20px_rgba(90,59,255,0.35)] backdrop-blur-sm sm:p-8 dark:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]"
            animate={{ y: [0, -10, 0], rotate: [-2.5, -1, -2.5] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {mutation.isSuccess ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="bg-primary/10 text-primary grid size-12 place-items-center rounded-full">
                  <MailCheck className="size-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{t('contact.successTitle')}</h3>
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
                    <Label htmlFor="contact-name">{t('contact.name')}</Label>
                    <Input
                      id="contact-name"
                      autoComplete="name"
                      aria-invalid={!!errors.name}
                      {...register('name')}
                    />
                    {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">{t('auth.email')}</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      {...register('email')}
                    />
                    {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-subject">{t('contact.subject')}</Label>
                  <Input id="contact-subject" aria-invalid={!!errors.subject} {...register('subject')} />
                  {errors.subject && <p className="text-destructive text-xs">{errors.subject.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-message">{t('contact.message')}</Label>
                  <Textarea id="contact-message" rows={5} aria-invalid={!!errors.message} {...register('message')} />
                  {errors.message && <p className="text-destructive text-xs">{errors.message.message}</p>}
                </div>

                {/* Honeypot — hidden from real users via CSS, catches simple bots. */}
                <div className="absolute -left-[9999px]" aria-hidden="true">
                  <label htmlFor="contact-company">Company</label>
                  <input id="contact-company" type="text" tabIndex={-1} autoComplete="off" {...register('company')} />
                </div>

                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending && <Spinner />}
                  {t('contact.send')}
                </Button>
              </form>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default ContactSection;
