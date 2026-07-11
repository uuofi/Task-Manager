import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Escapes text for Telegram's MarkdownV2 parse mode, where a long list of
 * characters are otherwise treated as formatting syntax.
 */
const escapeMarkdownV2 = (s) => String(s).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');

/**
 * Sends a message to the configured Telegram chat via the Bot API, or logs it
 * in development when no bot is configured — mirrors the email service's
 * dev-mode fallback so the contact form is testable without real credentials.
 */
export const sendTelegramMessage = async (text) => {
  const { botToken, chatId } = env.telegram;
  if (!botToken || !chatId) {
    logger.warn('[telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is empty — message NOT sent, logging instead.');
    logger.info(`[telegram:dev] ${text}`);
    return { delivered: false, preview: true };
  }

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'MarkdownV2' }),
  });

  const body = await res.json();
  if (!res.ok || !body.ok) {
    logger.error(`[telegram] send FAILED — status=${res.status} error="${body.description}"`);
    throw new Error(`Telegram send failed: ${body.description || res.status}`);
  }

  logger.info('[telegram] message sent OK');
  return { delivered: true };
};

/** Formats and sends a public contact-form submission to the Telegram chat. */
export const sendContactMessageToTelegram = async ({ name, email, subject, message }) => {
  const esc = escapeMarkdownV2;
  const text = [
    '📬 *New contact form message*',
    '',
    `*From:* ${esc(name)} \\(${esc(email)}\\)`,
    `*Subject:* ${esc(subject)}`,
    '',
    esc(message),
  ].join('\n');

  return sendTelegramMessage(text);
};

export default { sendTelegramMessage, sendContactMessageToTelegram };
