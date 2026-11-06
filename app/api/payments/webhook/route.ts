import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { markPaid } from '@/lib/commerce';
import { logActivity } from '@/lib/activity';
import { paymentNotifications } from '@/lib/notifications';
export const runtime = 'nodejs';
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status });
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return reply({ error: 'Webhook not configured' }, 503);
  const raw = await request.text();
  if (raw.length > 100000) return reply({ error: 'Payload too large' }, 413);
  const signature = request.headers.get('x-razorpay-signature') || '';
  if (!/^[a-f0-9]{64}$/.test(signature)) return reply({ error: 'Invalid signature' }, 401);
  const expected = createHmac('sha256', secret).update(raw).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex')))
    return reply({ error: 'Invalid signature' }, 401);
  try {
    const event = JSON.parse(raw);
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      if (!payment?.order_id) return reply({ error: 'Missing payment order' }, 400);
      const order = await db.order.findUnique({ where: { gatewayOrderId: payment.order_id } });
      if (!order) return reply({ received: true, ignored: 'unknown order' });
      if (
        order.mode !== 'LIVE' ||
        payment.status !== 'captured' ||
        payment.amount !== order.total ||
        payment.currency !== 'INR'
      ) {
        await logActivity('PAYMENT_FAILED', `Payment mismatch on ${order.number}`, {
          email: order.email,
          meta: { paymentId: String(payment.id), amount: Number(payment.amount) },
          notify: {
            subject: `Payment mismatch ${order.number}`,
            text: `Razorpay reported payment ${payment.id} of ${payment.amount} paise (${payment.status}) for order ${order.number} with total ${order.total} paise. Check the Razorpay dashboard.`,
          },
        });
        return reply({ received: true, ignored: 'mismatch' });
      }
      const { order: paid, transitioned } = await markPaid(order.id, String(payment.id));
      if (transitioned) await paymentNotifications(paid);
    }
    if (event.event === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      const order = payment?.order_id
        ? await db.order.findUnique({ where: { gatewayOrderId: payment.order_id } })
        : null;
      if (order)
        await logActivity('PAYMENT_FAILED', `Payment attempt failed for ${order.number}`, {
          email: order.email,
          meta: { reason: String(payment.error_description || '').slice(0, 200) },
        });
    }
    if (event.event === 'refund.processed') {
      const refund = event.payload?.refund?.entity;
      if (refund?.payment_id) {
        const order = await db.order.findUnique({ where: { gatewayPaymentId: refund.payment_id } });
        if (order && order.mode === 'LIVE' && refund.status === 'processed') {
          if (refund.amount === order.total)
            await db.order.update({
              where: { id: order.id },
              data: { paymentStatus: 'REFUNDED', status: 'CANCELLED' },
            });
          await logActivity('REFUND', `Refund of ${refund.amount} paise for ${order.number}`, {
            email: order.email,
            meta: { full: refund.amount === order.total },
          });
        }
      }
    }
    return reply({ received: true });
  } catch (error) {
    console.error('Webhook processing failed', error);
    return reply({ error: 'Unable to process event' }, 500);
  }
}
