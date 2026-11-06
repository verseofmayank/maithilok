import { cache } from 'react';
import { db } from './db';
import { cartSchema } from './validation';
import type { Prisma } from '@prisma/client';
export const requiredDisclosures = [
  'ingredients',
  'nutrition',
  'storage',
  'shelfLife',
  'manufacturer',
  'marketer',
  'fssai',
  'batch',
  'mrp',
  'netQuantity',
];
export async function readiness() {
  const store =
    ((await db.setting.findUnique({ where: { key: 'store' } }))?.value as Record<
      string,
      unknown
    >) || {};
  const products = await db.product.findMany({
    where: { status: 'ACTIVE' },
    include: { variants: true },
  });
  const missing: string[] = [];
  if (!store.fssai) missing.push('FSSAI registration');
  for (const key of ['legalReviewed', 'shippingReady', 'paymentsReady', 'commerceEnabled'])
    if (store[key] !== true) missing.push(key);
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET ||
    !process.env.RAZORPAY_WEBHOOK_SECRET
  )
    missing.push('Razorpay credentials and webhook secret');
  if (process.env.LIVE_COMMERCE_ENABLED !== 'true')
    missing.push('Live commerce environment switch');
  if (!process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://'))
    missing.push('HTTPS storefront URL');
  if (!(await db.shippingRule.count({ where: { active: true } })))
    missing.push('Configured shipping rules');
  for (const p of products) {
    const d = p.details as Record<string, unknown>;
    if (d.verified !== true || requiredDisclosures.some((k) => !d[k]))
      missing.push(`${p.name}: verified food disclosures`);
  }
  return { ready: missing.length === 0, missing };
}
export async function quote(raw: unknown, client: Prisma.TransactionClient = db) {
  const data = cartSchema.parse(raw);
  const counts = new Map<string, number>();
  for (const i of data.items) counts.set(i.variantId, (counts.get(i.variantId) || 0) + i.quantity);
  const variants = await client.variant.findMany({
    where: { id: { in: [...counts.keys()] } },
    include: { product: true },
  });
  if (variants.length !== counts.size) throw new Error('A product is no longer available');
  const items = variants.map((v) => {
    const quantity = counts.get(v.id)!;
    if (quantity > 20 || v.product.status !== 'ACTIVE' || v.stock < quantity)
      throw new Error(`${v.product.name} is unavailable in that quantity`);
    return {
      variantId: v.id,
      productId: v.productId,
      name: v.product.name,
      slug: v.product.slug,
      label: v.label,
      price: v.price,
      quantity,
      weight: v.weight,
      image: v.image || String((v.product.images as string[])[0]),
      total: v.price * quantity,
    };
  });
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const weight = items.reduce((s, i) => s + i.weight * i.quantity, 0);
  let discount = 0;
  const code = data.coupon.trim().toUpperCase();
  if (code) {
    const coupon = await client.coupon.findUnique({ where: { code } });
    if (
      !coupon ||
      !coupon.active ||
      (coupon.expiresAt && coupon.expiresAt < new Date()) ||
      subtotal < coupon.minimum
    )
      throw new Error('This coupon is invalid, expired, or its minimum has not been reached');
    discount = Math.floor((subtotal * coupon.percent) / 100);
  }
  const rules = await client.shippingRule.findMany({
    where: { active: true },
    orderBy: { id: 'asc' },
  });
  const rule = rules.find((r) => {
    const states = r.states as string[],
      pins = r.pincodes as string[];
    return (
      (!states.length || states.includes(data.state || '')) &&
      (!pins.length || pins.includes(data.pin || ''))
    );
  });
  let shipping = 0;
  let shippingLabel =
    data.mode === 'LIVE' ? 'Shipping calculated at checkout' : 'Preview mode · no shipping charged';
  if (rule) {
    shipping =
      rule.freeAbove !== null && subtotal - discount >= rule.freeAbove
        ? 0
        : rule.base + Math.ceil(weight / 1000) * rule.perKg;
    shippingLabel = rule.name;
  } else if (data.mode === 'LIVE' && (data.state || data.pin))
    throw new Error('Sorry, we do not deliver to this address yet');
  return {
    items,
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
    shippingLabel,
    coupon: code,
    mode: data.mode,
  };
}

export const launchState = cache(readiness);
export async function releaseStaleOrders(minutes = 30) {
  const cutoff = new Date(Date.now() - minutes * 60000);
  const stale = await db.order.findMany({
    where: { mode: 'LIVE', paymentStatus: 'PENDING', createdAt: { lt: cutoff } },
    take: 50,
  });
  let released = 0;
  for (const order of stale)
    await db.$transaction(async (tx) => {
      const changed = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: 'PENDING' },
        data: { paymentStatus: 'EXPIRED', status: 'CANCELLED' },
      });
      if (changed.count !== 1) return;
      released++;
      for (const item of order.items as { variantId: string; quantity: number }[])
        await tx.variant.updateMany({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
    });
  return released;
}
export async function markPaid(orderId: string, paymentId: string) {
  const first = await db.order.updateMany({
    where: { id: orderId, paymentStatus: { notIn: ['REFUNDED', 'PAID'] } },
    data: { paymentStatus: 'PAID', gatewayPaymentId: paymentId },
  });
  await db.order.updateMany({
    where: { id: orderId, paymentStatus: 'PAID', status: 'CANCELLED' },
    data: { status: 'REFUND_REQUESTED' },
  });
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  return { order, transitioned: first.count === 1 };
}
