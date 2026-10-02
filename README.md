<div align="center">
  <img src="public/mark.png" alt="" width="104">
  <h1>HunarHisaab</h1>
  <p><strong>Price your work properly. Keep a record your customer confirmed.</strong></p>
  <p>
    <a href="https://hunar-hisaab.vercel.app">hunar-hisaab.vercel.app</a>
  </p>
  <p>
    <img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-0e6b3a">
    <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-111">
    <img alt="No AI key required" src="https://img.shields.io/badge/AI%20key-not%20required-e0a228">
  </p>
</div>

---

Millions of women in Pakistan run real businesses from home. Stitching,
baking, mehndi, tuition, crochet, frozen food. The work is skilled, the income
is real, and almost none of it gets written down anywhere.

I kept noticing the same thing when I looked at how those orders actually
work. A message arrives on WhatsApp. A price gets guessed, usually from what
the cloth cost. The hours never enter the calculation at all. The job gets
done, the money comes in cash or Easypaisa, and then there is nothing left to
show it happened.

So two separate problems, and the second one is the one everybody talks about
while the first one is the one that costs money.

HunarHisaab is my attempt at both.

## The bit that convinced me to build it

Here is a real order, with real numbers.

> Assalam o alaikum baji, 3 green embroidered suits chahiye 23rd tak. 4200
> each theek hain? delivery DHA Lahore. advance easypaisa kar doon?

Paste that in and the app pulls out the item, the quantity, the offered price,
the deadline, the area and the payment method. Then you add what it costs you:
2,200 of cloth per suit, six hours of work, 120 of packing, 350 of delivery.
Your own hour is set at 200.

```
Costs you, each                 Rs 3,520
  your time in that             Rs 1,200
Costs you, in total             Rs 10,910
Never go below                  Rs 3,637

They offered                    Rs 4,200
You keep                        Rs 1,690   (13% margin)
                                Rs 294 an hour for you
```

Thirteen percent. Not the forty she had in her head, because six hours of her
own labour were never in the sum. That single screen is the whole product. The
record keeping is what brings people back, but the pricing is what changes
something.

## It does not need an AI key

This is the part I am most pleased with, and the part most people assume is
impossible.

The parser is rules, not a model. It reads Roman Urdu, Urdu script and English,
and it handles the way people actually quote money here rather than the way a
textbook would:

| You type | It reads |
| --- | --- |
| `4200` | 4,200 |
| `42 sau` | 4,200 |
| `char hazaar do sau` | 4,200 |
| `sarhay char hazaar` | 4,500 |
| `dhai hazaar` | 2,500 |
| `۴۲۰۰ روپے` | 4,200 |

It also knows that `23 tareekh` and `26 ko` and `juma tak` are deadlines, that
DHA and Gulberg and F-10 are places, that `ek dozen` is twelve, and that
`total 12000` across four frocks means 3,000 each. It keeps the deadline in
the words she was given, because `23 tareekh` is what was agreed and silently
turning that into a date is how you deliver in the wrong month.

Because it is plain TypeScript with no network calls, **it runs in the
browser**. Instant, free, works on a bad connection, and the message never
leaves the device to be read. Try it on the landing page without signing up.

You can add your own Gemini, OpenAI or Anthropic key in Settings if you want a
second pass on genuinely strange messages. It is encrypted before it is stored
and never sent back to the browser. Nothing in the app requires it, and
nothing stops working if you never add one.

## What else is in it

- **Price book.** The work you do repeatedly, with its costs saved, so the
  second cake is not priced from scratch.
- **Customer confirmation.** A link or a QR code. They tap once. No account, no
  app, no signup on their side.
- **Payments.** Advance received, balance outstanding, who still owes you what.
- **Due soon.** What is due this week, with overdue flagged.
- **Income record.** Confirmed work, month by month, exportable as CSV or
  printable.
- **Customers.** Built automatically from orders, so there is no second list to
  maintain.
- **Three languages.** Roman Urdu, اردو with full right to left, and English.
- **Dark mode**, because most of this gets used late at night.

## Running it yourself

You need a Supabase project. That is the only external service.

```bash
git clone https://github.com/hassanali-ko/HunarHisaab.git
cd HunarHisaab
npm install
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
Project Settings, API.

Paste `supabase/schema.sql` into the Supabase SQL editor and run it. It is
idempotent, so running it again later is fine.

In Supabase, under Authentication, Sign In and Providers, enable Email and
turn **off** Confirm email. If you skip this, sign up appears to work and
then sign in fails, which took me longer to diagnose than I would like to
admit.

```bash
npm run dev
```

Deploying to Vercel is the usual import, with the same two variables set. Add
`APP_ENCRYPTION_KEY` as well if you want people to be able to save AI keys:

```bash
openssl rand -base64 32
```

There is no service role key anywhere in this project, and the app does not
want one.

## Security

Worth reading [SECURITY.md](SECURITY.md) if you plan to host this for anyone
other than yourself. Short version:

Row level security on every table, scoped to the signed in user. The broad
grants Supabase hands out by default are revoked and re-granted narrowly, and
the `anon` role holds no table privileges at all. The one public page reaches
the database through two `security definer` functions that take a single
token, so a leaked link exposes one order summary and nothing else.

`supabase/security-tests.sql` asserts all of that against a throwaway
database, including that a second seller sees nothing of the first, that an
anonymous visitor cannot read any table, and that expired or cancelled links
cannot be confirmed. CI runs it on every push.

## What this is not

It builds a **confirmed order history**. It is not a bank statement, not a
credit score, and not verified income. I have been careful that no screen in
the app claims otherwise, and I would rather it stayed that way.

There is no marketplace, because a marketplace needs supply and demand and
moderation and trust before it helps anybody. There is no payment gateway,
because the payment method is worth recording and the money is not mine to
touch.

## Tests

```bash
npm test          # parser, pricing, translations
npm run lint
npm run build
```

The pricing tests pin the worked example above, so if someone changes the
arithmetic the numbers in this README stop matching and CI says so.

## Built with

Next.js 16, TypeScript, Tailwind v4, Supabase for auth and Postgres, Vercel.
Fraunces and Inter for type, Noto Nastaliq Urdu for اردو.

The look is meant to feel like the register a small business already keeps:
ruled paper, a running stitch where two things join, and a block print star
doing the job a bullet point would do elsewhere. All of it comes out of the
logo.

## Licence

MIT. See [LICENSE](LICENSE). Do what you like with it.

If you run this for a community of women somewhere and it helps, I would
genuinely love to hear about it.
