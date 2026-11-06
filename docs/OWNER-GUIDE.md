# Maithilok owner guide

The current site is a working commerce preview. Product management, customer accounts,
cart calculations, demo orders and contact storage work. Real payments remain disabled.
This is not yet a completed commercial launch or a security certification.

## Where everything lives

| What you need | Where to open it |
| --- | --- |
| Products, variants, prices, stock | `/admin/products` and `/admin/inventory` |
| Orders and fulfillment | `/admin/orders` |
| Customer registrations | `/admin/customers` |
| Signups, logins, enquiries, payments | `/admin/activity` (time/type/search filters and CSV) |
| Review moderation | `/admin/reviews` |
| Payment/email configuration and log guide | `/admin/integrations` |
| Messages | `/admin/messages` and `/admin/enquiries` |
| Production database | Neon console, the project's production database |
| Runtime errors | Vercel project → Logs |
| Build failures | Vercel project → Deployments → select deployment → build logs |
| Local errors | Terminal running `npm run dev` / `npm run start`, and browser developer tools |

Admin pages require an ADMIN account. Normal registration creates a CUSTOMER account.
The database has `User`, `Order`, `Enquiry`, `ActivityLog`, `AuditLog` and `Review` tables.
Passwords are hashes. Do not publish database connections or session data.

Local default data is in `prisma/dev.db` (SQLite), separate from Neon production.
`npm run admin:create` uses the database selected by the current local environment;
it does not automatically create a production admin. Use the matching PostgreSQL
Prisma client and a securely configured production connection for owner provisioning.
Never run local test fixtures or seed fake sales/reviews against production.

Activity filters/export cover the latest 300 loaded records. Export timestamps are UTC.
Vercel log retention depends on the hosting plan; database activity records persist
until deliberately removed by an authorized maintenance process.

## Payments

Demo checkout creates `DEMO` / `DEMO_SIMULATED` orders. No money is charged or shipped.
It is not a Razorpay Test Mode payment. Gateway API credentials are not required for demo.

The integration implements server-side order creation, payment signature checks,
captured-payment reconciliation and signed webhooks. Live gateway behavior has not
been verified with real credentials. A successful local demo does not prove payment onboarding.

Before launch:

1. Complete Razorpay business onboarding, bank and website verification.
2. Test the gateway in an isolated staging environment with a separate database.
   The public demo switch does not enable gateway Test Mode. Production readiness
   rejects test keys; do not remove that check or mark test payments as real revenue.
3. Set production secrets in Vercel: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `RAZORPAY_WEBHOOK_SECRET`. Keep them out of GitHub and client code.
4. Configure `https://maithilok.vercel.app/api/payments/webhook` in Razorpay for
   `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`.
   Use the same webhook secret on both sides. Verify captured amounts, duplicates,
   failed/abandoned payments, late capture and refunds before accepting money.
5. Complete FSSAI, verified product disclosures, shipping rules and policy review.
   Approve the corresponding store settings. Only then enable
   `LIVE_COMMERCE_ENABLED=true` and redeploy with live keys.

Refund requests are tracked in admin; actual refunds are processed in Razorpay.
Partial refunds need a fuller accounting workflow. Pending-stock expiry needs scheduled
reconciliation before live commerce. These are launch tasks, not completed integrations.

## Email and images

For Gmail use `GMAIL_USER`, `GMAIL_APP_PASSWORD` and optionally `OWNER_NOTIFY_EMAIL`.
An app password requires the relevant Google account security setup. Alternatively
configure the SMTP variables in `.env.example`. Configuration is not proof of successful
delivery. Enquiries remain saved even when mail is unconfigured or fails.

Production environment-name inspection on 6 November 2026 found no Razorpay or
Gmail/SMTP credential variables. No existing production secrets were changed.

Each active ghee gallery has two jar-size views and two new illustrative concept photos.
Prompts and asset details are in [image-prompts.md](image-prompts.md).
The brand artwork is `public/branding/brand-lockup.svg`; its editable leaf/grain emblem
is `symbol-v2.svg`. Product images are replaceable, not verified commercial labels.
Review draft manufacturing/quality statements and final packaging before launch.

Local admin uploads work. Vercel's filesystem is not permanent upload storage; the app
blocks such uploads there. For production use repository assets and redeploy, or add
durable object storage. This remains a production-readiness item.

## Reviews

Only signed-in customers with a delivered, paid LIVE order containing the product
can submit a review. Demo orders are not eligible. New/edited reviews are pending
until approved at `/admin/reviews`. Public responses contain the reviewer's first name,
rating and text, not their email. No reviews or ratings are seeded.

## GitHub, hosting and domain

GitHub stores the source. GitHub Pages is static hosting and cannot run this app's
Next.js backend, Prisma, authentication or payment APIs. Keep a Node-compatible host.
A custom domain is optional; `https://maithilok.vercel.app` is the current subdomain.

The attempt to link GitHub automatically returned: “You need to add a Login Connection
to your GitHub account first.” Complete the GitHub connection in Vercel account settings,
then link `verseofmayank/maithilok` in project Settings → Git, with `main` as production.
After that, pushes can trigger deployments. CLI deployment remains available meanwhile.

Vercel Hobby is restricted to personal/non-commercial use. A real business store needs
a commercial-use-compatible plan/host, even if its domain is a free subdomain.
No paid plan or domain has been purchased by this work.

Sources: [Vercel Git](https://vercel.com/docs/git),
[runtime logs](https://vercel.com/docs/logs/runtime),
[Hobby terms](https://vercel.com/docs/plans/hobby),
[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site),
[Razorpay test versus live](https://razorpay.com/blog/instant-payment-gateway-activation-india/).

## Design and checks

Used [unslop](https://github.com/theclaymethod/unslop/blob/main/SKILL.md) for targeted
copy review and [AI Design Skills](https://github.com/elayadesign/ai-design-skills/blob/main/skills/landing-page-design/SKILL.md)
for typography, spacing, component states and responsive checks. Existing brand colors
and Lucide icons were retained per the project's requirements. The primary tagline
remains static. Unslop's short-copy readability/diff heuristics flagged the small sample;
those are not a quality score. Preservation, phrase, structure and silhouette checks passed.

Run `npm run build`, `npm run start`, then `npm run test:browser`. Browser tests use
the local SQLite database and include demo checkout, accounts, product editing, review
eligibility/moderation, CSV export, cache refresh and mobile/desktop layouts.

The production dependency audit identified Prisma tooling advisories; Prisma and its client were pinned together to the compatible 6.19.3 patch. A dependency audit does not replace payment/security testing.

After that patch, `npm audit --omit=dev` still reports three high-severity entries in the deepmerge-ts → @prisma/config → prisma dependency chain. The suggested automatic fix requires a breaking Prisma major upgrade; it was not force-applied. Review and resolve these remaining advisories before commercial launch.
