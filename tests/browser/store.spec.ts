import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
const db = new PrismaClient();
const run = Date.now().toString(36),
  email = `qa-${run}@example.test`,
  password = randomBytes(18).toString('base64url');
test.afterAll(async () => db.$disconnect());
test('storefront, variants, persistent bag and demo checkout', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero h1')).toBeVisible();
  await page.locator('.hero').getByRole('link', { name: 'Shop Ghee' }).click();
  await page.getByRole('heading', { name: 'Cow Ghee', exact: true }).click();
  await page.getByRole('button', { name: '1kg ₹1,499' }).click();
  await expect(page.locator('.detail-price')).toContainText('₹1,499');
  await page.locator('.purchase-row').getByRole('button', { name: 'Add to bag' }).click();
  await expect(page.getByRole('dialog')).toContainText('Cow Ghee');
  await page.getByRole('button', { name: 'Close bag' }).click();
  await page.reload();
  await page.goto('/cart');
  await expect(page.locator('.cart-line')).toContainText('1kg');
  await expect(page.locator('.grand-total')).toContainText('₹1,499');
  await page.getByRole('link', { name: 'Proceed to checkout' }).click();
  await page.getByLabel('Full name', { exact: true }).fill('QA Demo Customer');
  await page.getByLabel('Mobile number', { exact: true }).fill('9876543210');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('House / building', { exact: true }).fill('Demo building');
  await page.getByLabel('Street / locality', { exact: true }).fill('Demo street');
  await page.getByLabel('City', { exact: true }).fill('Patna');
  await page.getByLabel('PIN code', { exact: true }).fill('800001');
  await page.getByRole('checkbox', { name: /I agree to the/ }).check();
  await page.getByRole('button', { name: 'Place preview order' }).click();
  await expect(page).toHaveURL(/order-confirmation/);
  await expect(page.getByText('PREVIEW ORDER · NO PAYMENT TAKEN')).toBeVisible();
  await expect(page.getByText('DEMO_SIMULATED', { exact: true })).toBeVisible();
  const response = await page.request.get('/api/orders/track?number=invalid');
  expect(response.status()).toBe(404);
});
test('contact form stores enquiry and rejects invalid input', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Full name', { exact: true }).fill('QA Enquiry');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Subject', { exact: true }).fill(`QA enquiry ${run}`);
  await page
    .getByLabel('Your message', { exact: true })
    .fill('This is a local automated test enquiry. No email needs to be sent.');
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Your message has reached us' }),
  ).toBeVisible();
  expect(await db.enquiry.count({ where: { subject: `QA enquiry ${run}` } })).toBe(1);
});
test('customer account, wishlist and private admin protection', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Full name', { exact: true }).fill('QA Account');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password (12+ characters)', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page).toHaveURL('/account');
  await expect(page.getByRole('heading', { name: 'Hello, QA.' })).toBeVisible();
  expect((await page.request.get('/api/admin/customers')).status()).toBe(401);
  await page.goto('/admin');
  await expect(page).toHaveURL('/admin/login');
  await page.goto('/products/cow-ghee');
  await page.getByRole('button', { name: 'Save to wishlist', exact: true }).click();
  await page.goto('/wishlist');
  await expect(page.getByRole('heading', { name: 'Cow Ghee', exact: true })).toBeVisible();
  await page.goto('/account/addresses');
  await page.getByRole('button', { name: 'Add address', exact: true }).click();
  await page.getByLabel('Mobile number', { exact: true }).fill('9876543210');
  await page.getByLabel('House / building', { exact: true }).fill('QA address');
  await page.getByLabel('Street / locality', { exact: true }).fill('QA street');
  await page.getByLabel('City', { exact: true }).fill('Patna');
  await page.getByLabel('PIN code', { exact: true }).fill('800001');
  await page.getByRole('button', { name: 'Save address', exact: true }).click();
  await expect(page.locator('.address-grid')).toContainText('QA address');
});
test('coming soon cannot be purchased and server blocks tampering', async ({ page }) => {
  await page.goto('/products/makhana');
  await expect(page.getByRole('heading', { name: 'Makhana', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to bag', exact: true })).toHaveCount(0);
  const catalog = await (await page.request.get('/api/catalog')).json();
  const cow = catalog.products.find((p: any) => p.slug === 'cow-ghee');
  const response = await page.request.post('/api/cart/quote', {
    data: { items: [{ variantId: cow.variants[0].id, quantity: 1, price: 1 }], subtotal: 1 },
  });
  const quote = await response.json();
  expect(quote.subtotal).toBe(cow.variants[0].price);
  const live = await page.request.post('/api/checkout', {
    data: {
      mode: 'LIVE',
      items: [{ variantId: cow.variants[0].id, quantity: 1 }],
      idempotencyKey: crypto.randomUUID(),
      address: {
        name: 'QA User',
        email,
        phone: '9876543210',
        house: 'QA building',
        street: 'QA street',
        city: 'Patna',
        state: 'Bihar',
        pin: '800001',
      },
    },
  });
  expect(live.status()).toBe(400);
  expect((await live.json()).error).toContain('Online ordering is not open yet');
  const cross = await page.request.post('/api/enquiries', {
    headers: { Origin: 'https://untrusted.example' },
    data: {},
  });
  expect(cross.status()).toBe(400);
});
test('authorized admin can update product and storefront reflects changes', async ({ page }) => {
  const adminEmail = `qa-admin-${run}@example.test`;
  await db.user.create({
    data: {
      name: 'QA Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'ADMIN',
    },
  });
  await page.goto('/admin/login');
  await page.getByLabel('Email address', { exact: true }).fill(adminEmail);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL('/admin');
  await expect(page.getByRole('heading', { name: 'Launch readiness' })).toBeVisible();
  await page.goto('/admin/products');
  const row = page.getByRole('row').filter({ hasText: 'Cow Ghee' }).first();
  await row.getByRole('button', { name: 'Edit product' }).click();
  const original = await page.getByLabel('Short Description', { exact: true }).inputValue();
  await page
    .getByLabel('Short Description', { exact: true })
    .fill('QA updated description for a reversible browser test.');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/products/cow-ghee');
  await expect(
    page.getByText('QA updated description for a reversible browser test.', { exact: true }),
  ).toBeVisible();
  await db.product.update({ where: { slug: 'cow-ghee' }, data: { shortDescription: original } });
  await db.user.update({ where: { email: adminEmail }, data: { role: 'CUSTOMER' } });
  await db.session.deleteMany({ where: { user: { email: adminEmail } } });
});
for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
])
  test(`responsive pages at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const path of ['/', '/shop', '/products/cow-ghee', '/contact', '/categories', '/login']) {
      await page.goto(path);
      await expect(page.locator('main')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow, `Horizontal overflow at ${path}`).toBe(false);
    }
    await page.goto('/');
    await page.screenshot({ path: `test-results/home-${viewport.width}.png`, fullPage: true });
  });
test('all public destinations return successful pages', async ({ page }) => {
  for (const path of [
    '/categories/ghee',
    '/search?q=ghee',
    '/wishlist',
    '/cart',
    '/checkout',
    '/order-confirmation',
    '/track-order',
    '/account',
    '/account/orders',
    '/account/addresses',
    '/about',
    '/faq',
    '/shipping-policy',
    '/return-refund-policy',
    '/privacy-policy',
    '/terms-and-conditions',
    '/journal',
    '/journal/a-place-at-the-table',
    '/coming-soon',
    '/forgot-password',
    '/reset-password',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
  }
  // Next.js can send 200 once streaming has started, then render its noindex 404 boundary.
  expect([200, 404]).toContain((await page.goto('/does-not-exist'))?.status());
  await expect(page.getByRole('heading', { name: 'This page isn’t on the menu.' })).toBeVisible();
  expect(await page.locator('meta[name="robots"][content*="noindex"]').count()).toBeGreaterThan(0);
});
