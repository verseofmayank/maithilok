# Maithilok — Launch Guide (Step by step)

Site abhi **Preview mode** me chalegi (order ho sakta hai, paisa nahi katega). Neeche ke steps poore karte hi site apne aap **LIVE** ho jayegi — Razorpay se real payment, Gmail pe alerts.

---

## Step 1 — Code GitHub pe daalo

```bash
cd maithilok
git add -A
git commit -m "Production ready: payments, Gmail alerts, activity logs, Darbhanga branding"
git push origin main
```

## Step 2 — Vercel ko GitHub se connect karo (auto deploy)

1. vercel.com → apna project **maithilok** → Settings → Git → **Connect GitHub repo** `verseofmayank/maithilok`.
2. Ab har `git push` pe site khud deploy hogi. Build command `vercel.json` me already set hai (migrations + seed + build).

## Step 3 — Environment variables (Vercel → Settings → Environment Variables)

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled URL (already set) |
| `DATABASE_URL_UNPOOLED` | Neon direct URL (already set) |
| `NEXT_PUBLIC_SITE_URL` | `https://maithilok.vercel.app` (domain lene ke baad `https://maithilok.in` jaisa) |
| `NEXT_PUBLIC_ADDRESS_LINE1` | Shop/godown ka pura pata, e.g. `Ward 12, Laheriasarai, Darbhanga` |
| `NEXT_PUBLIC_ADDRESS_PIN` | `846004` (apna sahi PIN) |
| `GMAIL_USER` | `karnmayank07@gmail.com` |
| `GMAIL_APP_PASSWORD` | Step 4 wala 16-letter password |
| `OWNER_NOTIFY_EMAIL` | jis email pe alerts chahiye (khali chhodo to GMAIL_USER) |
| `RAZORPAY_KEY_ID` | Step 5 |
| `RAZORPAY_KEY_SECRET` | Step 5 |
| `RAZORPAY_WEBHOOK_SECRET` | Step 5 |
| `LIVE_COMMERCE_ENABLED` | `true` (sab ready hone ke baad) |

Variable badalne ke baad: Deployments → latest → **Redeploy**.

## Step 4 — Gmail connect (Contact form + alerts)

1. myaccount.google.com → **Security** → **2-Step Verification ON** karo.
2. Wahi pe search karo **App passwords** → naam `Maithilok` → **Create**.
3. Jo 16 letter ka password mile, `GMAIL_APP_PASSWORD` me daalo (spaces chalega).
4. Redeploy → Contact page se test message bhejo → inbox me aana chahiye. Customer ko auto-reply bhi jayega.

Ab in sab pe tumhe email aayega: **naya sign-up, admin login, naya paid order, contact message, payment mismatch/refund needed**.

## Step 5 — Razorpay (Payment gateway)

1. dashboard.razorpay.com pe account banao → **KYC poora karo** (PAN, bank account, business details — Darbhanga address). Website URL me apni site daalo.
2. Pehle **Test Mode** me: Settings → API Keys → Generate → `rzp_test_...` key aur secret Vercel me daalo.
3. Settings → **Webhooks** → Add:
   - URL: `https://<tumhari-site>/api/payments/webhook`
   - Secret: koi bhi strong random string (wahi `RAZORPAY_WEBHOOK_SECRET` me)
   - Events: `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`
4. Test payment karo (Razorpay test UPI `success@razorpay` ya test card). Admin → Orders me **PAID** dikhna chahiye, aur Activity log me `PAYMENT CAPTURED`.
5. Sab sahi → KYC approve hone ke baad **Live Mode** keys (`rzp_live_...`) se replace karo + live mode me webhook dobara banao.

## Step 6 — Admin account

```bash
# Local machine pe, Neon DATABASE_URL ke saath (ek baar)
DATABASE_URL="<neon pooled url>" npx prisma generate --schema prisma/postgresql/schema.prisma
DATABASE_URL="<neon pooled url>" npm run admin:create
```
Login: `https://<site>/admin/login`

## Step 7 — Admin panel me launch checklist poora karo

Admin → Dashboard pe **Launch readiness** list dikhegi. Ek-ek karke:

1. **Store settings** → FSSAI licence number, GSTIN (agar hai), address; `legalReviewed`, `shippingReady`, `paymentsReady`, `commerceEnabled` ON.
2. **Products** → Cow Ghee & Buffalo Ghee me ingredients, nutrition, storage, shelf life, manufacturer, marketer, FSSAI, batch, MRP, net quantity bharo → **verified** tick karo. (Ye jar ke label se exactly match hona chahiye — FSSAI ka rule.)
3. **Inventory** → asli stock daalo.
4. **Shipping settings** → ek rule banao: Name `All India`, states khali, PIN khali, Base charge `6000` (= ₹60), Free-shipping subtotal `99900` (= ₹999). **Admin me saare amounts paise me hain: ₹1 = 100.**
5. **Promotions** → discount coupon banao (e.g. `MITHILA10` = 10%).
6. **Website content** → `marquee` me `|` se alag karke offers likho — ye homepage pe left-right chalte hain:
   `Diwali sale coming soon | 10% off with MITHILA10 | Free shipping above ₹999`
7. Discount dikhana ho to product variant me **Compare-at** (MRP, paise me — e.g. ₹1,699 = `169900`) daalo → card pe `% off` aur kati hui price dikhegi.

Sab ✅ hote hi checkout apne aap **"Pay ₹X securely"** (Razorpay) ho jayega.

## Step 8 — Domain (optional, recommended)

1. GoDaddy/Hostinger/BigRock se `maithilok.in` jaisa domain lo.
2. Vercel → Settings → Domains → add → jo DNS records bataye wo domain panel me daalo.
3. `NEXT_PUBLIC_SITE_URL` ko naye domain pe set karo, `ALLOWED_ORIGINS` me `https://www.maithilok.in` daalo, Razorpay webhook URL update karo → Redeploy.

## Step 9 — Launch se pehle final test (phone + laptop)

- [ ] Homepage, About, Shop, product page sahi dikhe
- [ ] Buy now → checkout → Razorpay test payment → confirmation page
- [ ] Order confirmation email customer ko aaya
- [ ] Owner ko "New paid order" email aaya
- [ ] Admin → Activity log me sign-up, order, payment dikhe
- [ ] Admin me order **SHIPPED** + tracking daala → customer ko shipping email gaya
- [ ] Contact form → inbox me message + reply-to customer ka email
- [ ] Google Search Console me `https://<site>/sitemap.xml` submit

---

### Product photos
Abhi ke jar photos AI-generated hain (WebP me compress, 2MB → ~90KB). Asli jar ka photo lo (white/cream background, daylight), 1000×1000 WebP banao aur `public/products/` me same naam se replace karo — `cow-ghee-500g.webp` etc. Push karte hi update.

> Vercel pe admin se image upload permanent nahi hota (serverless). Images repo me `public/` folder se hi daalo.
