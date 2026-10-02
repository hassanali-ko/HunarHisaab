# Contributing

Thanks for looking. Pull requests are welcome.

## Getting it running

```bash
npm install
cp .env.example .env.local     # fill in the two Supabase values
npm run dev
```

You also need the schema. Paste `supabase/schema.sql` into the Supabase SQL
editor and run it. It is safe to run more than once.

In Supabase, under Authentication, Sign In and Providers, enable Email and
turn off Confirm email. Without that, sign up completes but sign in does not.

## Before you open a PR

```bash
npm test
npm run lint
npm run build
```

If you touched the schema, also run the security tests described in
`SECURITY.md`. A failing line there is a blocker.

## Things worth knowing

**The parser is the heart of this.** `lib/parser/` reads Roman Urdu, Urdu and
English with rules, not a model. If you are adding support for a phrase, add a
test to `tests/parser.test.ts` with a real message first. Messages people
actually send are far messier than invented ones, and the tests are more
useful when they look like the real thing.

**Pricing is arithmetic and stays that way.** Nothing in `lib/pricing.ts`
should ever call out to anything. If a number on screen cannot be reproduced
on paper, that is a bug.

**No AI key may become required.** The optional provider pass is a convenience.
If you make a feature that only works with a key, it needs a path that works
without one.

**Three languages, always.** `tests/i18n.test.ts` fails if a key is missing
from any of them, so adding copy means adding it in all three. Roman Urdu is
the default because that is what most people type.

**No em dashes in anything a user reads.** There is a test for this.

## Translations

`lib/i18n/en.ts` is the source of truth for the key set and carries a short
house style note at the top. Read it before translating. The voice matters
more than literal accuracy: the app should sound like a capable older sister
talking about money, not like a bank.
