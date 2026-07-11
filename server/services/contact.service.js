import { sendContactMessageToTelegram } from './telegram.service.js';

/** Forwards a public contact-form submission to the Telegram contact chat. */
export const submit = async ({ name, email, subject, message }) => {
  await sendContactMessageToTelegram({ name, email, subject, message });
  return { received: true };
};

export const contactService = { submit };

export default contactService;
