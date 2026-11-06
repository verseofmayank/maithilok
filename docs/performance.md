# Storefront response time

`/about` and `/contact` are prerendered with a five-minute revalidation interval.
Their HTML can be served from the deployment cache without fetching the catalogue
or checking every product's launch disclosures on each visit.

Only the public `content` and `policies` settings use the shared data cache.
Authorized admin edits expire its tag immediately, including dependent About and
Contact pages. Other storefront routes query only the data needed by that page.
Prices, stock, customer data, cart quotes and checkout validation remain uncached.
When the live-commerce environment switch is off, display-only launch checks
return false immediately; checkout and admin readiness retain the full checks.

Run `npm run build`, then `npm run start`, then
`npm run test:browser -- tests/browser/content-cache.spec.ts` against the local
development database. This checks protected content updates, cache invalidation
and mobile/desktop navigation. Do not run mutation tests against production.

Compare several requests before and after deployment; a single timing includes
network variability and is not a guaranteed customer load time. On Vercel, inspect
`x-vercel-cache` as well as time to first byte and total response time. Dynamic
catalogue requests still depend on the database and server startup latency.
