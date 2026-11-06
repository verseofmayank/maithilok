# Maithilok · मैथिल लोक

Production storefront for Maithilok, a ghee brand from **Darbhanga, Bihar**. **Launch steps: see [LAUNCH.md](LAUNCH.md).**

Built with Next.js App Router, TypeScript, Tailwind CSS, Radix accessible dialogs, Lucide, Motion, Prisma, Zod and React Hook Form.

**From Mithila, To Your Home**  
**मिथिला की परंपरा, आपके घर तक**

## Live demo

**https://maithilok.vercel.app**

Deployed on Vercel (Node 22) against a Neon PostgreSQL database. The store runs in preview mode until the launch checklist passes, then switches to Razorpay checkout automatically. Gmail (app password) powers contact-form delivery, customer confirmations and owner alerts; every sign-up, sign-in, order, payment and message is recorded in Admin → Activity log. The catalogue is seeded from `prisma/seed.ts`, and no admin account is created in production — use `npm run admin:create` if you need one.

Production builds run `npm run vercel-build`: PostgreSQL client generation, `prisma migrate deploy`, the idempotent seed (which also upgrades old copy and image paths) and `next build`. Required environment variables: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEXT_PUBLIC_SITE_URL`, `LIVE_COMMERCE_ENABLED=false`.

## Quick start

Requirements: Node.js 22 LTS (or a supported version for the installed Next.js release), npm, and a modern browser.

```bash
cd /mnt/c/Users/mayank/Downloads/Maithilok
npm install --cache .npm-cache
# First setup only: copy .env.example to .env if .env does not already exist.
npm run setup
npm run dev
```

Preview: **http://localhost:3100**. Development listens on port 3100. No paid domain, hosted database, payment account, or email account is needed for demo shopping. On this Windows/WSL environment the folder is Downloads/Maithilok. Do not replace an existing `.env` containing your settings.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm start` and `npm run dev` use the same port; run one at a time. The build uses the local seeded database. For a fresh checkout, run setup before building.

## Admin setup

No admin password is seeded, exposed in the storefront, or committed. Create your own authorized account:

```bash
npm run admin:create
```

The interactive command asks for an email and a new password of at least 12 characters. Input is visible in the local terminal, so use it in a private terminal. For automation, provide `ADMIN_EMAIL` and `ADMIN_PASSWORD` through a secure environment, never source files or shell history. The script refuses to overwrite an existing account.

Sign in at **http://localhost:3100/admin/login**. Admin sessions are random, stored hashed in the database, and delivered through HTTP-only SameSite cookies. Use HTTPS in production; cookie security follows the configured site URL.

Admin features: dashboard and readiness checks; product, variant, price, stock and image editors; category/subcategory hierarchy; orders, fulfillment, courier tracking and CSV export; customers; enquiries and response drafts; coupons; state/PIN/weight shipping rules; hero, story and announcement editing; policy drafts; business settings; live-only sales analytics. Product removal is reversible unpublishing/archiving, preserving records and assets.

## Catalogue and storefront

- Cow Ghee: 500g ₹799; 1kg ₹1,499.
- Buffalo Ghee: 500g ₹699; 1kg ₹1,399.
- All prices are integer paise in the database; the server calculates every quote and order.
- Future products have `COMING_SOON` status and no purchasable variants, prices or stock.
- Initial ghee stock is **demo fixture stock**, not a claim about actual inventory. Demo orders do not decrement it.
- Search, suggestions, category/subcategory and price filters, sorting, variant selection, quantity control, persistent bag, accessible bag drawer, wishlist, related and recently viewed products.
- Accounts, profile, saved addresses, order history, registration, login/logout, password reset; guest checkout and private token-based order tracking.
- Newsletter consent and enquiries are persisted even without email delivery.
- Public story, journal, FAQ, contact and clearly labelled policy drafts.
- Metadata, canonical URLs, Open Graph, sitemap, robots, semantic HTML, responsive images, reduced motion and mobile layouts.

## Demo versus real payments

Demo checkout is fully functional locally. It creates an order marked `DEMO` and `DEMO_SIMULATED`. The UI explicitly states that no payment or shipment occurs. Demo revenue is excluded from live analytics. With no shipping rules, the demo uses a clearly labelled ₹0 simulated shipping fee; this is not a commercial shipping offer.

Live checkout is disabled by default and requires all of:

1. `LIVE_COMMERCE_ENABLED=true` in the server environment.
2. An HTTPS `NEXT_PUBLIC_SITE_URL`.
3. Store settings with FSSAI information and owner approvals for legal, shipping, payments and commerce activation.
4. Active shipping rules matching the delivery address.
5. All active products with verified ingredients, nutrition, storage, shelf life, manufacturer, marketer, FSSAI, batch, MRP and net quantity disclosures.
6. Razorpay key ID, secret, and webhook secret.

Server payment order creation, HMAC signature verification, captured-payment reconciliation and signed webhook handling are implemented. Amount, currency and gateway order must match. A client callback alone never marks an order paid. Configure `/api/payments/webhook` for `payment.captured` and `refund.processed`. The webhook updates full refunds only after a signed processed event; partial refunds need a future ledger extension. Refund requests in admin are requests, not completed refunds. Process actual refunds through Razorpay until a dedicated refund workflow is approved and tested.

Live gateway calls have **not** been exercised without credentials. Test them in Razorpay test mode, including duplicate webhooks, abandonment, failed capture, late capture after cancellation and refunds, before accepting payments. Review inventory reservations and add scheduled reconciliation/expiration for abandoned pending orders before launch.

## Email

Optional SMTP variables are in `.env.example`. Gmail requires correctly configured application credentials or an approved OAuth transport; this project provides SMTP, not a completed Gmail OAuth connection. No Gmail account is connected by default. Enquiries remain stored if notifications fail. Admin replies are not reported as sent without a successful configured send.

For local development only, `ALLOW_LOCAL_RESET_PREVIEW=true` makes a password-reset URL available in the response when SMTP is absent. The code additionally requires `NODE_ENV=development`. Disable this variable outside local development. Production reset responses never expose tokens.

## Database and migration

SQLite via Prisma is the zero-service development database. `prisma/schema.prisma`, SQL migrations and the idempotent seed live in the repo. The schema uses portable string statuses, integer money, relational identifiers and JSON; a PostgreSQL provider variant is in `prisma/postgresql/schema.prisma`.

SQLite migration SQL is not PostgreSQL SQL. To use a hosted PostgreSQL database, create a **new PostgreSQL migration baseline** from that schema, generate its client, deploy the baseline to an empty target, and explicitly migrate/export reviewed data. Do not apply SQLite migration files to PostgreSQL. Back up the original local database and verify counts and order totals before switching. See [deployment notes](docs/DEPLOYMENT.md).

## Project structure

```text
app/                        App Router public/admin pages, metadata, API handlers
  [[...slug]]/              Public page routing and server catalogue reads
  admin/[[...slug]]/        Role-protected administration
  api/[...path]/           Validated storefront and admin APIs
  api/payments/webhook/     Signed Razorpay reconciliation
components/                 Storefront, accessible UI, checkout, account, admin
lib/                        Prisma, authentication, validation, commerce, email
prisma/                     Schema, local migrations, idempotent seed
  postgresql/               PostgreSQL-compatible provider schema
public/
  branding/                 Editable SVG symbol and bilingual wordmarks
  products/                 Four illustrative product concepts and SVG slots
  categories/               Future food concepts and SVG slots
  banners/                  Hero concept
  illustrations/            Reserved for future owned artwork
  icons/                    SVG favicon
  uploads/                  Admin uploads (ignored; persistent storage required)
scripts/                    Admin creation and original SVG asset generator
tests/                      Commerce validation and browser journeys
docs/                       Deployment, testing, assets and launch notes
```

## Before commercial launch

Complete FSSAI and business onboarding; verify all food and packaging disclosures; finalize tax/invoice handling with the business adviser; replace/approve concept images; set real stock; finalize shipping zones, serviceability and costs; approve legal drafts and operational contact details; complete payment onboarding and gateway tests; configure SMTP; move to production PostgreSQL and persistent image/object storage; configure TLS, domain, backups, monitoring and distributed abuse controls; arrange regular dependency/security reviews. Validate refunds, inventory reconciliation and recovery procedures with real operational staff.

The application can use a temporary hosting subdomain and later a custom domain. No domain availability or ownership is assumed. Nothing is published by this setup.
