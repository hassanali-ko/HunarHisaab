# Security

## Reporting something

If you find a vulnerability, please do not open a public issue. Use GitHub's
private advisory form on this repository, under Security, Report a
vulnerability. I will reply as quickly as I can manage.

Please include what you did, what happened, and what you expected. A proof of
concept helps a lot. Do not test against anyone else's deployment, and do not
touch data that is not yours.

## How the app is put together

Some of this is unusual, so it is worth writing down.

### There is no service role key at runtime

Most Supabase apps keep a service role key around for the paths that have no
signed in user. This one does not have one at all. Hosting it needs the project
URL and the anon key, nothing more.

The customer facing confirmation page is the only unauthenticated surface, and
it reaches the database through two `security definer` functions that take a
single token. The `anon` role holds no table privileges whatsoever, so that
path cannot read an order even if the function were removed.

### Row level security, and narrowed grants

Every table has RLS on, scoped to `auth.uid()`. On top of that the schema
revokes the broad table grants Supabase hands out by default and re-grants
only what each role actually uses. `anon` gets nothing.

`tests/database.test.ts` asserts all of this against the real schema, run
inside PGlite (Postgres compiled to WASM), so it needs no Docker and runs on
every `npm test`. It checks that a second seller sees none of the first
seller's rows, that a cross tenant write is refused, that an anonymous
visitor cannot read any table, that an unknown token returns nothing, that
expired and cancelled links cannot be confirmed, that the rate limiter stops
the fourth call, and that deleting an account takes everything with it.

### The confirmation cannot be faked

This is the product's central claim, so the database defends it rather than
trusting the application to.

- `confirmed_at` can only be set inside `confirm_public_order`, which is the
  customer tapping the link. A seller cannot set it on insert or update, even
  by calling the API directly with her own session.
- A signed in seller opening her own link is turned away, so she cannot
  confirm her own order by accident while testing, or on purpose.
- Once confirmed, the item, quantity and price the customer agreed to are
  frozen. Her private cost figures can still change.
- The event log only accepts `actor = 'seller'` from a seller, so she cannot
  write an entry in the customer's name.

None of this stops someone determined from opening the link in a private
window and tapping it themselves. What it does is make the record mean what
it says for everyone acting in good faith, and make tampering a deliberate
act rather than a button.

### What a leaked confirmation link exposes

One order summary: item, quantity, price, due date, delivery area, payment
method, status, and the seller's business name. No contact details, no cost
breakdown, no row identifiers, and nothing about any other order. Links can be
switched off from the order at any time.

### Messages are read locally

The built in parser is plain TypeScript with no network calls. It runs in the
browser. A pasted WhatsApp message is not transmitted anywhere in order to be
read.

The optional AI pass is the exception, and it is opt in per account. It only
runs when someone has saved their own provider key, and only when the rule
based pass left something unresolved.

### Provider keys

Encrypted with AES-256-GCM using `APP_ENCRYPTION_KEY` before they are written,
and never selected back to the browser. Settings shows a masked hint. If
`APP_ENCRYPTION_KEY` is not set, the app refuses to store keys rather than
storing them in the clear.

### Rate limiting

Counters live in Postgres, not in process memory, because this is expected to
run as several short lived instances where an in memory counter protects
nothing. Identifiers are keyed with an HMAC before storage, so no raw IP
address is kept and nobody can compute another person's bucket to lock them
out. The counting function rejects oversized buckets and clears out stale
rows on its own.
The limiter fails open: if the database cannot be reached, requests are not
blocked, since the real protections are elsewhere.

### Headers

A strict Content Security Policy with no third party script origins, plus
HSTS, `frame-ancestors 'none'`, `nosniff`, a restrictive Permissions Policy,
and `no-store` on confirmation pages. Image optimisation is turned off, which
removes the remote fetch and transform surface entirely.

### Things that are deliberately not here

No analytics, no third party scripts, no advertising pixels, no payment
processing, and no handling of card or bank credentials anywhere in the
codebase.

## Running the checks

```bash
npm audit --omit=dev     # no known vulnerable dependencies
npm test                 # parser, pricing and translation tests
```

The database suite is part of `npm test`. It loads
`supabase/testing/supabase-stub.sql` (stand ins for the parts Supabase
provides) and then `supabase/schema.sql`, twice, to prove the schema is safe
to re-run.
