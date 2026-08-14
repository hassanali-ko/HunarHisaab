# HunarHisaab

**WhatsApp orders ko business records mein badlein.**

Turns messy WhatsApp orders from Pakistani home-based women workers into fair
prices, organised records, and a customer-confirmed order history.

Built for Pakistan @79.

---

## The one step left: apply the database schema

Everything else is wired up. The app cannot read or write orders until the
tables exist.

1. Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/clmxsnvlslghxvwvkybv/sql/new).
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Press **Run**.

Then confirm that **Authentication → Sign In / Providers → Email → Confirm
email** is switched **off**. Without it, sign-up and the demo account cannot log
in.

Restart the dev server and click **Demo account kholein**.

```bash
npm run dev
```

---

## Deploying to Vercel

The GitHub repo `hunarhisaab` already exists, so push to it and import the repo
at [vercel.com](https://vercel.com).

Add these four environment variables in the Vercel project settings, copied from
your local `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
```

Leave `NEXT_PUBLIC_SITE_URL` unset. Share links are built from the request host,
so they work on localhost and on the deployed domain without extra config.

---

## How it works

| Piece | Where |
| --- | --- |
| Order extraction (Gemini structured output) | [`app/api/extract/route.ts`](app/api/extract/route.ts) |
| Pricing math (deterministic, no AI) | [`lib/pricing.ts`](lib/pricing.ts) |
| Language dictionaries | [`lib/i18n.ts`](lib/i18n.ts) |
| Dashboard and income record | [`app/dashboard/page.tsx`](app/dashboard/page.tsx) |
| Add order and live calculator | [`app/orders/new/order-form.tsx`](app/orders/new/order-form.tsx) |
| Share card (QR and WhatsApp) | [`components/share-card.tsx`](components/share-card.tsx) |
| Public confirmation | [`app/o/[token]/page.tsx`](app/o/[token]/page.tsx) |
| Schema and RLS | [`supabase/schema.sql`](supabase/schema.sql) |

### Languages

Three languages ship: Roman Urdu (default), اردو, and English. The switcher sits
in every header. The choice is stored in a cookie and read on the server, so
pages render in the right language on first paint with no flash.

Urdu switches the document to RTL and to the Noto Nastaliq face. Numbers,
currency, emails, and share URLs stay left-to-right in a Latin face so amounts
stay readable.

### Extraction model

`gemini-3.7-flash`, falling back through 3.6, 3.5, and 2.5 Flash if a model is
unavailable. Temperature is 0 and the response is constrained by a JSON schema.

If extraction fails for any reason, the form shows a short message and every
field stays editable. Manual entry always works, and "Khud likhein" is a full
second tab.

### Cost model

Material, labour, and packaging are entered **per unit**. Delivery and other
costs apply **once per order**.

```
cost per unit   = material + (hours × hourly value) + packaging
total cost      = cost per unit × quantity + delivery + other
break-even      = total cost ÷ quantity
suggested price = break-even × (1 + desired profit %)
profit          = (chosen price × quantity) − total cost
```

### Security

Row-level security means an authenticated user can only read and write their own
rows. There is **no public RLS policy on `orders`**.

The customer confirmation page is the single public surface. It runs server-side
with the service-role key, scoped to one `public_token`, and selects only item,
quantity, price, deadline, area, payment method, and status. It never exposes
customer contact details, the cost breakdown, or row ids.

---

## Demo script (60 seconds)

1. "In Pakistan, a huge share of women's work happens from home, and her time is
   priced at zero."
2. Dashboard on a phone, then **Naya order**.
3. Paste the Roman Urdu message, or tap **Sample message**, then **Order
   banayein**. The fields fill themselves.
4. Enter material cost and hours. **"Aapka waqt bhi cost hai"** appears with the
   break-even and profit, live.
5. **Order save karein**. The dashboard updates.
6. Open the order, show the QR, and let a judge scan it and tap **Confirm order**
   on their own phone.
7. The dashboard flips to Confirmed on its own, because it polls every 3 seconds.
8. Tap اردو in the header to show the whole product in Urdu.
9. "Confirmed, evidence-backed work history. Invisible work, made visible."

---

## Scope note

HunarHisaab produces a **confirmed order history**. It is not a bank statement,
a credit score, or legally verified income, and the UI never claims otherwise.
There is no marketplace and no payment gateway. Payment method is recorded, not
processed.
