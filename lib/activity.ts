import { after } from 'next/server';
import { db } from './db';
import { notifyOwner } from './mail';

export type ActivityType =
  | 'SIGNUP'
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'ADMIN_LOGIN'
  | 'PASSWORD_RESET'
  | 'ORDER_PLACED'
  | 'PAYMENT_CAPTURED'
  | 'PAYMENT_FAILED'
  | 'REFUND'
  | 'ENQUIRY'
  | 'NEWSLETTER'
  | 'ORDER_EXPIRED';

export async function logActivity(
  type: ActivityType,
  message: string,
  options: {
    email?: string;
    ip?: string;
    meta?: Record<string, string | number | boolean | null>;
    notify?: { subject: string; text: string; replyTo?: string };
  } = {},
) {
  try {
    await db.activityLog.create({
      data: {
        type,
        message: message.slice(0, 500),
        email: (options.email || '').slice(0, 254),
        ip: (options.ip || '').slice(0, 64),
        meta: options.meta || {},
      },
    });
  } catch (error) {
    console.error('Activity log failed', error);
  }
  if (options.notify) {
    const { subject, text, replyTo } = options.notify;
    after(async () => {
      await notifyOwner(subject, text, replyTo);
    });
  }
}
