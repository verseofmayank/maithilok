import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { db } from './db';

export const PUBLIC_CONTENT_TAG = 'storefront-content';

// Only public copy belongs here. Prices, stock, accounts and checkout stay uncached.
export const publicSetting = cache(
  unstable_cache(
    async (key: 'content' | 'policies'): Promise<Record<string, string>> => {
      const setting = await db.setting.findUnique({ where: { key } });
      return (setting?.value as Record<string, string>) || {};
    },
    ['public-storefront-copy-v1'],
    { revalidate: 300, tags: [PUBLIC_CONTENT_TAG] },
  ),
);
