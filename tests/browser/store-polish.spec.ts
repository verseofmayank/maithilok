import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
const db = new PrismaClient();
test.afterAll(() => db.$disconnect());

test('card variants, four gallery images, reviews and brand artwork work on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/shop');
  const card = page
    .locator('.product-card')
    .filter({ has: page.getByRole('heading', { name: 'Cow Ghee', exact: true }) });
  await card.getByRole('button', { name: '1kg', exact: true }).click();
  await expect(card.locator('.product-card-price')).toContainText('₹1,499');
  await card
    .locator('.card-actions')
    .getByRole('button', { name: 'Add Cow Ghee 1kg to bag' })
    .click();
  await expect(page.getByRole('dialog')).toContainText('1kg');
  await page.getByRole('button', { name: 'Close bag' }).click();
  await page.goto('/products/cow-ghee');
  await expect(page.locator('.thumbnails button')).toHaveCount(4);
  await page.getByRole('button', { name: 'View Cow Ghee image 4' }).click();
  await expect(page.locator('.detail-image img')).toHaveAttribute('src', /cow-ghee-overhead/);
  await expect(page.getByRole('heading', { name: 'Customer reviews', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No reviews yet', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
  await page.screenshot({ path: '.local/previews/product-mobile.png', fullPage: true });
  await page.goto('/about');
  await expect(page.locator('.about-hero-image img')).toHaveAttribute(
    'src',
    '/branding/brand-lockup.svg',
  );
  await page.screenshot({ path: '.local/previews/about-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.screenshot({ path: '.local/previews/home-polished.png', fullPage: true });
});

test('review eligibility, moderation, private diagnostics and CSV export', async ({
  page,
  request,
  baseURL,
}) => {
  test.setTimeout(90000);
  expect(baseURL).toBe('http://localhost:3100');
  expect(process.env.DATABASE_URL?.startsWith('file:')).toBe(true);
  const password = randomBytes(18).toString('base64url');
  const suffix = Date.now();
  const customer = await db.user.create({
    data: {
      name: 'Test Buyer',
      email: `review-buyer-${suffix}@example.test`,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  const admin = await db.user.create({
    data: {
      name: 'Test Owner',
      email: `review-admin-${suffix}@example.test`,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'ADMIN',
    },
  });
  const product = await db.product.findUniqueOrThrow({ where: { slug: 'cow-ghee' } });
  const body = {
    productId: product.id,
    rating: 4,
    title: 'Test purchase review',
    body: 'Local automated test of the review moderation flow.',
  };
  let orderId: string | undefined;
  try {
    expect((await request.get('/api/admin/overview')).status()).toBe(401);
    expect((await request.post('/api/reviews', { data: body })).status()).toBe(401);
    await request.post('/api/auth/login', { data: { email: customer.email, password } });
    expect((await request.post('/api/reviews', { data: body })).status()).toBe(403);
    const order = await db.order.create({
      data: {
        number: `REVIEW-TEST-${suffix}`,
        userId: customer.id,
        email: customer.email,
        address: {},
        items: [{ productId: product.id }],
        subtotal: 79900,
        total: 79900,
        mode: 'DEMO',
        status: 'DELIVERED',
        accessHash: randomUUID(),
        idempotencyKey: randomUUID(),
      },
    });
    orderId = order.id;
    expect((await request.post('/api/reviews', { data: body })).status()).toBe(403);
    await db.order.update({
      where: { id: order.id },
      data: { mode: 'LIVE', paymentStatus: 'PAID' },
    });
    expect((await request.post('/api/reviews', { data: { ...body, rating: 6 } })).status()).toBe(
      400,
    );
    expect((await request.post('/api/reviews', { data: body })).ok()).toBe(true);
    let publicReviews = await (await request.get(`/api/reviews?productId=${product.id}`)).json();
    expect(publicReviews.reviews.some((r: { title: string }) => r.title === body.title)).toBe(
      false,
    );
    const review = await db.review.findUniqueOrThrow({
      where: { productId_userId: { productId: product.id, userId: customer.id } },
    });
    expect(
      (
        await request.post('/api/admin/reviews', { data: { id: review.id, status: 'APPROVED' } })
      ).status(),
    ).toBe(401);
    await request.post('/api/auth/login', { data: { email: admin.email, password, admin: true } });
    expect(
      (
        await request.post('/api/admin/reviews', { data: { id: review.id, status: 'APPROVED' } })
      ).ok(),
    ).toBe(true);
    publicReviews = await (await request.get(`/api/reviews?productId=${product.id}`)).json();
    expect(publicReviews.reviews.some((r: { title: string }) => r.title === body.title)).toBe(true);
    expect(JSON.stringify(publicReviews)).not.toContain(customer.email);
    await page.goto('/admin/login');
    await page.getByLabel('Email address', { exact: true }).fill(admin.email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL('/admin');
    await page.goto('/admin/integrations');
    await expect(
      page.getByRole('heading', { name: 'Check your store configuration.' }),
    ).toBeVisible();
    await expect(page.getByText('Off · demo checkout only', { exact: true })).toBeVisible();
    await page.screenshot({ path: '.local/previews/admin-integrations.png', fullPage: true });
    await page.goto('/admin/activity');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download filtered CSV' }).click();
    expect((await download).suggestedFilename()).toMatch(/^maithilok-activity-/);
  } finally {
    await db.review.deleteMany({ where: { userId: customer.id } });
    if (orderId) await db.order.delete({ where: { id: orderId } });
    await db.session.deleteMany({ where: { userId: { in: [customer.id, admin.id] } } });
    await db.user.update({ where: { id: admin.id }, data: { role: 'CUSTOMER' } });
  }
});
