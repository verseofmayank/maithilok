import nodemailer, { type Transporter } from 'nodemailer';
import { site } from './site';

let transporter: Transporter | null = null;

function config() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (gmailUser && gmailPass)
    return {
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass },
      },
      from: process.env.SMTP_FROM || `Maithilok <${gmailUser}>`,
    };
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM
  )
    return {
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_PORT === '465',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      },
      from: process.env.SMTP_FROM,
    };
  return null;
}

export function mailConfigured() {
  return config() !== null;
}

export const ownerEmail = () => process.env.OWNER_NOTIFY_EMAIL || site.email;

const clean = (s: string) => s.replace(/[\r\n]+/g, ' ').slice(0, 200);

export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

function wrap(text: string) {
  const body = escapeHtml(text).replace(/\n/g, '<br>');
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#273c32"><div style="background:#173f35;color:#fbf9f3;padding:18px 24px;font-family:Georgia,serif;font-size:22px">Maithilok</div><div style="padding:24px;background:#fbf9f3;line-height:1.6;font-size:14px">${body}</div><div style="padding:12px 24px;font-size:11px;color:#74786f">Maithilok · ${escapeHtml(site.address.city)}, ${escapeHtml(site.address.state)} · ${escapeHtml(site.phone)}</div></div>`;
}

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  options: { replyTo?: string } = {},
) {
  const c = config();
  if (!c) return false;
  transporter ??= nodemailer.createTransport(c.transport);
  await transporter.sendMail({
    from: c.from,
    to,
    subject: clean(subject),
    text,
    html: wrap(text),
    ...(options.replyTo ? { replyTo: clean(options.replyTo) } : {}),
  });
  return true;
}

export async function notifyOwner(subject: string, text: string, replyTo?: string) {
  try {
    return await sendMail(ownerEmail(), `[Maithilok] ${subject}`, text, { replyTo });
  } catch (error) {
    console.error('Owner notification failed', error);
    return false;
  }
}
