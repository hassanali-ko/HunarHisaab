<div align="center">

<img src="public/mark.png" alt="HunarHisaab" width="120" />

# HunarHisaab

**WhatsApp orders ko business records mein badlein.**

Turning invisible work into a record that counts.

[**hunar-hisaab.vercel.app**](https://hunar-hisaab.vercel.app)

Built for Pakistan @79

</div>

---

## The problem

Millions of women in Pakistan run real businesses from home. Stitching,
baking, mehndi, tuition, crochet, frozen food. The work is skilled and the
income is real, but almost none of it is written down.

An order arrives as a WhatsApp message. The price is guessed. Material cost
lives in someone's memory. The hours spent are never counted at all. Payment
comes as cash, Easypaisa or JazzCash, and when the job is done, nothing remains
to show it ever happened.

So two things go wrong at once. She routinely underprices her work, because her
own time is treated as free. And she ends up with no evidence of the work she
has completed.

**HunarHisaab fixes both, one order at a time.**

## What it does

Paste the WhatsApp message exactly as the customer sent it, in Roman Urdu, Urdu
or English:

> Assalam o alaikum baji, 3 green embroidered suits chahiye 23rd tak. 4200 each
> theek hain? delivery DHA Lahore. advance easypaisa kar doon?

The app reads it and fills in the item, quantity, offered price, deadline,
delivery area and payment method. Every field stays editable, because she stays
in control.

Then she adds what it actually costs her: material, hours, packaging, delivery.
The app answers the question nobody was asking:

```
Ek unit ki lagat                    PKR 3,520
Aapke waqt ki qeemat (per unit)     PKR 1,200
Kul lagat                           PKR 10,910
Break-even (is se kam nahi lena)    PKR 3,637

Suggested price                     PKR 4,550
Is order ka munafa                  PKR 1,690   (13% margin)
```

The customer offered 4,200 a suit. Her break-even is 3,637. She is making 13%,
not the 40% she assumed, because six hours of her own labour were never in the
sum. That is the moment the product earns its place.

She saves the order and shares a link, or shows a QR code. The customer opens
it, sees a clean summary, and taps **Confirm order**. No account, no signup, no
app to install.

Her dashboard updates on its own, and the order becomes part of a **confirmed
order history**: work that a real customer has attested to.

## Features

- **Order extraction** from messy Roman Urdu, Urdu or English WhatsApp text
- **Fair price calculator** that counts her time as a cost, and warns loudly when
  a price falls below break-even
- **Customer confirmation** through a tokenized public link and QR code, with no
  account required from the buyer
- **Share on WhatsApp** with the message pre-written, so the product lives inside
  the workflow it serves
- **Live dashboard** that updates by itself the moment a customer confirms
- **Three languages**, Roman Urdu, اردو and English, switchable from any screen
- **Built for phones**, because that is where this work actually happens
- **Demo account** with realistic sample orders, one click from the login screen

## How it works

| Piece | Where |
| --- | --- |
| Order extraction | [`app/api/extract/route.ts`](app/api/extract/route.ts) |
| Pricing math | [`lib/pricing.ts`](lib/pricing.ts) |
| Language dictionaries | [`lib/i18n.ts`](lib/i18n.ts) |
| Dashboard and income record | [`app/dashboard/page.tsx`](app/dashboard/page.tsx) |
| Add order and live calculator | [`app/orders/new/order-form.tsx`](app/orders/new/order-form.tsx) |
| Share card, QR and WhatsApp | [`components/share-card.tsx`](components/share-card.tsx) |
| Public confirmation page | [`app/o/[token]/page.tsx`](app/o/[token]/page.tsx) |
| Database schema and RLS | [`supabase/schema.sql`](supabase/schema.sql) |

### The pricing is math, not AI

AI reads messy human language, which is what it is good at. It never decides
what anything is worth. Every number on screen comes from arithmetic you can
check by hand.

Material, labour and packaging are entered **per unit**. Delivery and other
costs apply **once per order**.

```
cost per unit   = material + (hours × hourly value) + packaging
total cost      = cost per unit × quantity + delivery + other
break-even      = total cost ÷ quantity
suggested price = break-even × (1 + desired profit %)
profit          = (chosen price × quantity) − total cost
```

### Extraction never blocks the work

Extraction runs on Gemini 3.7 Flash at temperature 0, constrained by a JSON
schema, falling back through older Flash models if one is unavailable. Fields it
is unsure about come back empty rather than guessed, and deadlines are kept as
written, so "23rd" and "18 tareekh" survive intact instead of being forced into
a calendar date.

If it fails for any reason, the form says so plainly and every field stays
editable. Manual entry is a full first-class tab, not a fallback bolted on.

### Languages and script

The chosen language is stored in a cookie and read on the server, so pages
render correctly on first paint with no flash of the wrong language. Urdu
switches the whole document to right-to-left and to a Nastaliq face. Amounts,
dates and share links stay left-to-right in a Latin face, so numbers remain
readable.

### Privacy by construction

Row-level security means a seller can only ever read and write her own rows.
There is no public read policy on orders at all.

The customer confirmation page is the single public surface. It runs on the
server, scoped to one unguessable token, and returns only the item, quantity,
price, deadline, area, payment method and status. The buyer never sees the cost
breakdown, the seller's other orders, contact details or internal ids.

## Built with

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Auth,
Postgres, RLS) · Gemini · Vercel

## What this is not

HunarHisaab produces a **confirmed order history**. It is not a bank statement,
a credit score, or legally verified income, and nothing in the interface
suggests otherwise.

There is no marketplace, because a marketplace needs supply, demand, moderation
and trust before it helps anyone. There is no payment gateway, because the
payment method is worth recording and the money is not ours to touch.

Every feature that exists is one a woman running a home business would open the
app to use.

---

<div align="center">

**"At Pakistan @79, we wanted to make invisible work visible, one order at a time."**

</div>
