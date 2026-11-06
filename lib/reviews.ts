import { db } from './db';

export async function canReview(userId: string, productId: string) {
  const orders = await db.order.findMany({
    where: { userId, mode: 'LIVE', paymentStatus: 'PAID', status: 'DELIVERED' },
    select: { items: true },
  });
  return orders.some(
    (order) =>
      Array.isArray(order.items) &&
      order.items.some(
        (item) =>
          item && typeof item === 'object' && !Array.isArray(item) && item.productId === productId,
      ),
  );
}
