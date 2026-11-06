import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

const db = new PrismaClient();
test.afterAll(async () => db.$disconnect());

test('cached About copy refreshes after an authorized content update', async ({
  page,
  request,
}) => {
  test.setTimeout(90000);
  const original = (await db.setting.findUniqueOrThrow({ where: { key: 'content' } })).value;
  const password = randomBytes(18).toString('base64url');
  const email = `cache-test-${Date.now()}@example.test`;
  const admin = await db.user.create({
    data: {
      name: 'Cache Test',
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'ADMIN',
    },
  });
  try {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1, name: /Ghee from Darbhanga/ })).toBeVisible();
    const unauthorized = await request.post('/api/admin/settings', {
      data: { key: 'content', value: { story: 'Unauthorized edit' } },
    });
    expect(unauthorized.status()).toBe(401);
    const login = await request.post('/api/auth/login', { data: { email, password, admin: true } });
    expect(login.ok()).toBe(true);
    const story = `Updated story for cache verification ${Date.now()}.`;
    const update = await request.post('/api/admin/settings', {
      data: { key: 'content', value: { ...(original as object), story } },
    });
    expect(update.ok()).toBe(true);
    await page.reload();
    await expect(page.locator('.about-hero:visible')).toContainText(story);
  } finally {
    const restored = await request
      .post('/api/admin/settings', {
        data: { key: 'content', value: original },
      })
      .catch(() => null);
    // Preserve the local content even when an earlier authentication assertion failed.
    if (!restored?.ok())
      await db.setting.update({ where: { key: 'content' }, data: { value: original! } });
    await db.user.update({ where: { id: admin.id }, data: { role: 'CUSTOMER' } });
    await db.session.deleteMany({ where: { userId: admin.id } });
  }
});

test('About navigation and contact render at mobile and desktop sizes', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1, name: /Ghee from Darbhanga/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    await page.locator('.about-hero').getByRole('link', { name: 'Talk to us' }).click();
    await expect(page).toHaveURL('/contact');
    await expect(page.getByLabel('Your message', { exact: true })).toBeVisible();
  }
});
