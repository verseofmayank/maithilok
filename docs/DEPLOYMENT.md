# Deployment and operational handoff

Use a commercial-use-compatible Node hosting plan or a self-managed Linux server with a licensed provider suitable for business use. A temporary provider subdomain is sufficient. Verify current provider terms before choosing a plan. This project is not published automatically.

1. Provision PostgreSQL and persistent upload storage (or implement an S3-compatible adapter). Local `public/uploads` must survive restarts and deployments. Next.js serverless ephemeral filesystems are not suitable for this upload implementation.
2. Create a fresh PostgreSQL migration baseline using `prisma/postgresql/schema.prisma` and a disposable development database. Keep SQLite migration history separate. Generate the Prisma client with the PostgreSQL schema during deployment. Run its migrations against the target; seed only the intended catalogue.
3. Set server-only credentials in the hosting secret store. Never put payment secrets, SMTP passwords or a database URL in `NEXT_PUBLIC_*` variables. Set only the public site origin there.
4. Use HTTPS and an exact `NEXT_PUBLIC_SITE_URL` matching the canonical origin. POST origin checks require it. Terminate TLS at a trusted proxy and add a tested Content Security Policy compatible with Razorpay if enabling payments.
5. Build after the database is available: `npm run build`. Run the Node server with `npm start` or an equivalent process manager. Configure a health monitor and backups, and restore-test them.
6. Create the owner admin securely. Keep demo/test accounts restricted or remove only known generated test fixtures after backup. Do not use public credentials. Rotate credentials if exposed.
7. Configure signed Razorpay webhooks. Test capture reconciliation, retries, refunds and late callbacks. Add a reservation-expiration job for abandoned live checkout and an explicit partial-refund ledger before relying on those operational paths.
8. Add a transactional outbox/retry worker for business-critical emails, an account email-verification flow, durable uploads backed by object storage, and a multi-instance rate-limit policy if scaling across servers. Current database rate limits are durable across restarts; retention cleanup should be scheduled.
9. Review policy drafts, product disclosures and tax/invoice requirements with appropriate business advisers. The configuration gate does not certify regulatory compliance.
10. Re-run automated and manual launch tests using the deployed origin, mobile devices and actual provider test accounts before enabling commerce.

The local app keeps all money in paise. A quote is re-calculated inside the order transaction. Products and order item descriptions are snapshotted. Demo orders are excluded from revenue and do not decrement stock. Live orders reserve stock atomically. Order exports neutralize spreadsheet formula prefixes. Credentials, password hashes, session hashes and reset tokens are never returned by public account APIs.

Implementation references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Prisma data sources](https://docs.prisma.io/docs/orm/v6/prisma-schema/overview/data-sources), [Razorpay standard checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/), and [Razorpay webhook signature validation](https://razorpay.com/docs/webhooks/validate-test/). Recheck current documentation when configuring external providers.
