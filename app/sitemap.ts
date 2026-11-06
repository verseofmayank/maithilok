import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100';
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: { status: { in: ['ACTIVE', 'COMING_SOON'] } } }),
    db.category.findMany(),
  ]);
  return [
    ...['', '/shop', '/categories', '/about', '/contact', '/faq', '/journal', '/coming-soon'].map(
      (p) => ({ url: base + p }),
    ),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt })),
    ...categories.map((c) => ({ url: `${base}/categories/${c.slug}` })),
  ];
}
