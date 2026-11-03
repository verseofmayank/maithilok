# Testing

Run `npm run setup` before tests. Use the demo database only, never a live customer database.

- `npm run lint`: Next.js and TypeScript lint rules.
- `npm run typecheck`: strict TypeScript compilation checks.
- `npm test`: exact seeded prices, paise arithmetic, invalid addresses and quantities, aggregate quantity validation, unavailable variants, future-product restrictions and live launch blocking.
- `npm run test:browser`: Playwright against an already running `http://localhost:3100`. Uses the installed `/usr/bin/chromium`; change `executablePath` for another environment. Covers desktop/tablet/mobile layouts, product variants, persistence, demo checkout and confirmation, enquiries, account creation, saved addresses, wishlist, unauthorized admin access, admin catalogue updates, request-origin rejection, price tampering and all public routes.

Browser tests create clearly named QA accounts, enquiries and demo orders. These remain identifiable local demo records, not real sales. The test admin is demoted and its sessions revoked after the edit test. Use a separate dedicated database for repeatable CI runs. The product-edit check restores its previous description.

Screenshots, failure traces and HTML report are saved inside the project (`test-results/`, `playwright-report/`). Credentials are generated in memory, never printed or committed.

Manual checks: keyboard navigation and focus in both drawers; 200% zoom; reduced-motion wordmark; image upload and replacement; configured SMTP delivery; stock changes and zero-stock error; coupon expiry and shipping boundary conditions; real gateway test-mode capture/webhook/reconciliation; deployment backup restoration. External-service checks cannot be claimed until credentials and test accounts are provided.
