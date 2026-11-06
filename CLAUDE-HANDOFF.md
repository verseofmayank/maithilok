# Maithilok handoff

## Current project

- Source: https://github.com/verseofmayank/maithilok, branch `main`.
- Existing deployment: https://maithilok.vercel.app, Vercel project `maithilok`.
- Local project: Downloads/maithilok. Local server: http://localhost:3100.
- Next.js 16.4.5, React 19, Prisma/client 6.19.3, Node 22.
- Production: Neon PostgreSQL. Local: separate SQLite `prisma/dev.db`.
- Do not reset/drop/recreate either database or overwrite owner files/secrets.
- Do not enable live payments. Production environment remains demo-only.

## Completed in this update

- About and Contact prerendered with 5-minute revalidation; public copy cache is
  invalidated after authorized content edits. Other pages no longer fetch the full
  catalogue unnecessarily. Price/stock/cart/checkout validation remains uncached.
- Manrope typography, refined product cards, inline 500g/1kg selector, responsive
  purchase controls. Fixed mobile hero overflow caused by the old nowrap rule.
- Each ghee product has four gallery images, including two new AI concept photos.
  Original generated PNGs stay in ignored `.local/image-originals`; optimized WebP
  files are tracked. Prompts: `docs/image-prompts.md`. These are NOT final labels.
- Editable leaf/grain brand artwork for About, header/footer and matching app icons.
  English: Maithilok. Hindi: मैथिल लोक. Preserve these spellings.
- Real review submission/moderation: delivered paid LIVE orders only, one review per
  product/customer, pending until admin approval, first name only in public responses.
  No fake reviews or ratings are seeded. Additive Review migrations in both schemas.
- Admin `/admin/integrations`: honest payment/email configuration status and guide.
- Activity time/type/search filters, refresh and CSV export of loaded records
  (latest 300). CSV formula injection is neutralized.
- Source ZIP excludes `.env`, `.git`, local databases, dependency folders and caches.

## Validation

Production builds and TypeScript checks passed during implementation. Seven commerce
tests and two CSV tests passed. Browser checks passed for demo checkout, accounts,
wishlist, contact storage, admin protection/product edits, gallery/variants, review
eligibility/moderation, CSV downloads, content cache invalidation and responsive views.
The final handoff response records the last build/test result and deployment URL.

Two full-suite assertions needed follow-up: mobile Home heading overflow (fixed in
`app/polish.css`) and assuming exactly one noindex tag on a streamed Next.js 404.
The latter now checks that at least one noindex tag exists and the branded 404 renders.
Next.js may return 200 after streaming starts; don't remove the noindex/404 checks.

Useful commands:

```sh
npm install
npm run setup
npm run build
npm run start
npm run test:browser
```

Only run mutation/browser tests against local SQLite, never production Neon. The tests
create temporary users/orders to exercise permissions; they are not real transactions.
There is an existing lint warning for the orders CSV download's window.location.assign
and another React Hook Form compiler warning. Do not report a clean security audit.

## Required before commercial launch (not completed)

1. **Security dependencies:** Prisma/client were patched from 6.19.0 to 6.19.3.
   `npm audit --omit=dev` still reports three HIGH entries in the single
   deepmerge-ts → @prisma/config → prisma chain (GHSA-ggr8-5vv4-36mx).
   The suggested fix requires a breaking Prisma major upgrade. Assess and migrate
   deliberately; no force-upgrade or blind overrides were applied.
2. **Razorpay:** Production variables currently have no Razorpay credentials.
   API order creation/signature checking/capture verification/webhooks exist, but
   have NOT been exercised against Razorpay. Configure onboarding, live keys and
   webhook secret only through secure environment settings. The app's DEMO flow
   never calls Razorpay. A dedicated isolated gateway Test Mode flow is still needed;
   the production launch guard intentionally rejects `rzp_test_` keys. Test duplicates,
   failure, abandonment, late capture, currency/amount mismatch and refunds.
3. **Business/legal:** FSSAI, verified disclosures, stock, shipping zones/charges,
   privacy/terms/returns/shipping policy review. Existing imported copy includes
   manufacturing/packaging statements and estimated delivery/refund times; the owner
   must verify or replace them. Don't treat those drafts as established facts.
4. **Email:** No Gmail/SMTP credentials were listed in production. Configure Gmail
   app-password or SMTP and test delivery. Presence of credentials is not authentication
   or delivery proof. Enquiries still save to the DB without email.
5. **Uploads:** Local admin uploads work. Vercel uploads are intentionally blocked
   because its filesystem isn't durable. Add object storage for real admin uploads,
   or keep assets in Git and redeploy. No storage credentials were invented.
6. **Orders:** Add scheduled abandoned-order reconciliation/reservation expiry.
   Admin refund requests do not transfer money; refunds currently happen in Razorpay.
   Full refund webhook updates exist; partial refunds need an accounting workflow.
7. **Operations:** Production admin provisioning must target Neon with the PostgreSQL
   client. `npm run admin:create` with the default .env creates only a local admin.
   No public admin password is seeded. Confirm backups, recovery and log retention.
8. **Hosting:** Vercel Git linking failed with “You need to add a Login Connection to
   your GitHub account first.” Owner must connect GitHub in Vercel account settings,
   then project Settings → Git → `verseofmayank/maithilok`, production branch `main`.
   CLI deploy works meanwhile. Do not claim automatic GitHub deployment is connected.
   GitHub Pages cannot host this Node/Prisma backend. Vercel Hobby is non-commercial;
   choose a business-compatible plan/host before operating a real store. A free
   subdomain does not change the hosting plan's commercial-use restrictions.

## Deployment

Existing `npm run vercel-build` generates the PostgreSQL client, runs additive
`prisma migrate deploy`, seeds missing/default data, and builds Next.js. Never run
`migrate reset`, `db push --force-reset`, DROP or destructive seed changes.
The gallery seed upgrades only the original two-image defaults and preserves custom
owner galleries. New migration: `0003_product_reviews` (table/indexes/FKs only).

Preserve existing environment values. Required: DATABASE_URL, DATABASE_URL_UNPOOLED,
NEXT_PUBLIC_SITE_URL=https://maithilok.vercel.app, LIVE_COMMERCE_ENABLED=false,
NEXT_PUBLIC_ADDRESS_PIN=846004. Never commit/publish environment files or credentials.

## Guides and skills used

- `docs/OWNER-GUIDE.md`: admin routes, logs, payment/email setup and hosting explanation.
- `docs/performance.md`: caching boundaries and invalidation tests.
- `docs/image-prompts.md`: actual image-generation prompts and illustrative-asset caveat.
- User requested unslop and elayadesign/ai-design-skills. Applied targeted copy checks
  and the relevant typography/spacing/state/mobile guidance while preserving brand
  requirements and Lucide. No global skill installation or private uploads were needed.
