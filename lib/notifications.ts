import { after } from 'next/server';
import { logActivity } from './activity';
import { sendMail } from './mail';
import { site } from './site';
export type OrderLike = {
  number: string;
  email: string;
  total: number;
  items: unknown;
  address: unknown;
  mode: string;
};
export const rupees = (paise: number) => `Rs. ${(paise / 100).toLocaleString('en-IN')}`;
export function orderText(o: OrderLike) {
  const a = o.address as Record<string, string>;
  const lines = (o.items as { name: string; label: string; quantity: number; total: number }[])
    .map((i) => `- ${i.name} ${i.label} x ${i.quantity}: ${rupees(i.total)}`)
    .join('\n');
  return `Order ${o.number}${o.mode === 'DEMO' ? ' (preview, unpaid)' : ''}

${lines}

Total: ${rupees(o.total)}

Deliver to:
${a.name}, ${a.phone}
${a.house}, ${a.street}${a.landmark ? `, ${a.landmark}` : ''}
${a.city}, ${a.state} ${a.pin}`;
}
export async function paymentNotifications(order: OrderLike & { status: string }, ip = '') {
  const refundNeeded = order.status === 'REFUND_REQUESTED';
  await logActivity(
    'PAYMENT_CAPTURED',
    `Payment received for ${order.number}${refundNeeded ? ' (order was cancelled: refund needed)' : ''}`,
    {
      email: order.email,
      ip,
      meta: { order: order.number, total: order.total },
      notify: {
        subject: `${refundNeeded ? 'REFUND NEEDED' : 'New paid order'} ${order.number} · ${rupees(order.total)}`,
        text: orderText(order),
      },
    },
  );
  if (!refundNeeded)
    after(async () => {
      try {
        await sendMail(
          order.email,
          `Order confirmed: ${order.number}`,
          `Namaste ${(order.address as Record<string, string>).name},\n\nThank you for shopping with Maithilok! Your payment is confirmed.\n\n${orderText(order)}\n\nWe pack every order in Darbhanga and will email you the courier tracking details once it ships.\n\nTeam Maithilok\n${site.phone}`,
        );
      } catch (error) {
        console.error('Customer confirmation email failed', error);
      }
    });
}
