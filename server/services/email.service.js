import nodemailer from 'nodemailer';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Lazily-created Nodemailer transport. When SMTP credentials are absent (dev),
 * emails are logged to the console instead of being sent — so flows like
 * password reset are fully testable without an SMTP server.
 */
let transporter = null;

const getTransporter = () => {
  logger.info(`[email] config — host="${env.smtp.host}" port=${env.smtp.port} user="${env.smtp.user}" from="${env.smtp.from}"`);
  if (!env.smtp.host || !env.smtp.user) {
    logger.warn('[email] SMTP_HOST or SMTP_USER is empty — emails will only be logged, NOT sent. Check your .env file.');
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
    logger.info('[email] SMTP transporter created');
  }
  return transporter;
};

/**
 * Sends an email, or logs it in development when no transport is configured.
 *
 * @param {{ to: string, subject: string, html: string, text?: string }} message
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const tx = getTransporter();
  if (!tx) {
    logger.warn(`[email:dev] SMTP not configured — email NOT sent. To: ${to} | Subject: ${subject}`);
    return { delivered: false, preview: true };
  }
  try {
    const info = await tx.sendMail({ from: env.smtp.from, to, subject, html, text });
    logger.info(`[email] sent OK — to=${to} subject="${subject}" messageId=${info.messageId}`);
    return { delivered: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`[email] SMTP send FAILED — to=${to} error="${err.message}" code=${err.code}`);
    throw err;
  }
};

/** Sends a password-reset email containing the reset link. */
export const sendPasswordResetEmail = async (user, resetUrl) => {
  const subject = 'Reset your TaskControl password';
  const text = `Hi ${user.name},

We received a request to reset your password. Use the link below (valid for ${env.jwt.resetTokenExpiresMin} minutes):

${resetUrl}

If you didn't request this, you can safely ignore this email.`;

  const html = `
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:480px;margin:auto;color:#0D1321">
      <h2 style="color:#5A3BFF">Reset your password</h2>
      <p>Hi ${user.name},</p>
      <p>We received a request to reset your password. This link is valid for
         <strong>${env.jwt.resetTokenExpiresMin} minutes</strong>.</p>
      <p style="margin:28px 0">
        <a href="${resetUrl}"
           style="background:#2D7CFF;color:#fff;padding:12px 24px;border-radius:8px;
                  text-decoration:none;font-weight:600;display:inline-block">
          Reset password
        </a>
      </p>
      <p style="color:#64748b;font-size:13px">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>`;

  return sendEmail({ to: user.email, subject, html, text });
};

/** Sends a project membership invitation email to an existing workspace member. */
export const sendProjectInvitationEmail = async ({
  to,
  inviterName,
  projectName,
  workspaceName,
  role,
  acceptUrl,
}) => {
  const subject = `${inviterName} invited you to join the ${projectName} project`;

  const text = `${inviterName} has invited you to join the "${projectName}" project in ${workspaceName} as ${role}.

Accept the invitation:
${acceptUrl}

This invitation expires in 7 days. If you weren't expecting this, you can ignore this email.`;

  const html = `
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:480px;margin:auto;color:#0D1321">
      <h2 style="color:#5A3BFF">Project invitation</h2>
      <p>
        <strong>${inviterName}</strong> invited you to join the
        <strong>${projectName}</strong> project in <strong>${workspaceName}</strong>
        as <strong>${role}</strong>.
      </p>
      <p style="margin:28px 0">
        <a href="${acceptUrl}"
           style="background:#2D7CFF;color:#fff;padding:12px 24px;border-radius:8px;
                  text-decoration:none;font-weight:600;display:inline-block">
          Join project
        </a>
      </p>
      <p style="color:#64748b;font-size:13px">
        This invitation expires in 7 days. If you weren't expecting this, you can ignore this email.
      </p>
    </div>`;

  return sendEmail({ to, subject, html, text });
};

/** Sends a task-created notification email to all project members. */
export const sendTaskCreatedEmail = async ({ recipients, task, projectName, createdByName }) => {
  if (!recipients || recipients.length === 0) return;

  const priorityColors = {
    urgent: '#DC2626',
    high: '#EA580C',
    medium: '#D97706',
    low: '#16A34A',
  };
  const priorityColor = priorityColors[task.priority] || '#94a3b8';
  const priorityLabel = task.priority
    ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
    : 'None';

  const fmt = (date) =>
    date
      ? new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Not set';

  const taskUrl = `${env.clientUrl}/app/tasks/${task.id}`;
  const subject = `[${task.key}] New task in ${projectName}: ${task.title}`;

  const html = `
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:560px;margin:auto;color:#0D1321">
      <h2 style="color:#5A3BFF;margin-bottom:4px">New task created</h2>
      <p style="color:#64748b;margin-top:0">
        <strong>${createdByName}</strong> created a new task in <strong>${projectName}</strong>
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin:20px 0">
        <p style="font-size:12px;color:#94a3b8;margin:0 0 4px 0;font-weight:600;letter-spacing:0.05em">
          ${task.key}
        </p>
        <h3 style="margin:0 0 20px 0;font-size:18px;color:#0f172a">${task.title}</h3>

        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b;width:110px">Priority</td>
            <td style="padding:6px 0">
              <span style="background:${priorityColor};color:#fff;padding:2px 10px;
                           border-radius:20px;font-size:12px;font-weight:600">
                ${priorityLabel}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b">Created</td>
            <td style="padding:6px 0;font-size:14px">${fmt(task.createdAt)}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b">Due date</td>
            <td style="padding:6px 0;font-size:14px;${!task.dueDate ? 'color:#94a3b8' : ''}">${fmt(task.dueDate)}</td>
          </tr>
          ${
            task.description
              ? `<tr>
            <td style="padding:6px 0;font-size:13px;color:#64748b;vertical-align:top">Description</td>
            <td style="padding:6px 0;font-size:14px;line-height:1.5">${task.description}</td>
          </tr>`
              : ''
          }
        </table>
      </div>

      <p style="margin:24px 0">
        <a href="${taskUrl}"
           style="background:#2D7CFF;color:#fff;padding:12px 24px;border-radius:8px;
                  text-decoration:none;font-weight:600;display:inline-block">
          View task
        </a>
      </p>
      <p style="color:#94a3b8;font-size:12px">
        You are receiving this because you are a member of the <strong>${projectName}</strong> project on TaskControl.
      </p>
    </div>`;

  const text = `New task in ${projectName}
[${task.key}] ${task.title}

Created by: ${createdByName}
Priority:   ${priorityLabel}
Created:    ${fmt(task.createdAt)}
Due date:   ${fmt(task.dueDate)}
${task.description ? `Description: ${task.description}\n` : ''}
View task: ${taskUrl}`;

  await Promise.all(recipients.map((email) => sendEmail({ to: email, subject, html, text })));
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendProjectInvitationEmail,
  sendTaskCreatedEmail,
};
