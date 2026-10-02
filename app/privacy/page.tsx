import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/marks";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <header className="mx-auto w-full max-w-2xl px-5 py-5">
        <Link href="/">
          <Logo />
        </Link>
      </header>
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16">
        <h1 className="text-[2rem] leading-tight">Privacy</h1>
        <p className="mt-2 text-[14px] text-faint">
          Plain language, because a privacy page nobody can read protects nobody.
        </p>

        <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-soft">
          <section>
            <h2 className="text-[18px] text-ink">What is stored</h2>
            <p className="mt-2">
              Your email address, the orders you enter, the customers those
              orders belong to, and the saved prices in your price book. That is
              the whole list.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">Who can read it</h2>
            <p className="mt-2">
              You. The database enforces this with row level security, so one
              account cannot read another account&rsquo;s rows even if the
              application has a bug. There is no public read access to any table.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">
              What your customer sees on a confirmation link
            </h2>
            <p className="mt-2">
              Only the item, quantity, price, due date, delivery area, payment
              method and status for that one order, plus your business name.
              Never your other orders, never a cost breakdown, never anyone&rsquo;s
              contact details. You can switch a link off at any time from the
              order.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">Reading WhatsApp messages</h2>
            <p className="mt-2">
              The built in parser runs in your own browser. A message you paste
              is not sent anywhere to be read. If you choose to add your own AI
              key, and only then, the message text is sent to that provider
              under your own account with them.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">AI keys</h2>
            <p className="mt-2">
              If you add one, it is encrypted with AES-256-GCM before it is
              stored and is never sent back to your browser. You can remove it
              at any time in Settings.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">Tracking</h2>
            <p className="mt-2">
              There is none. No analytics, no advertising pixels, no third party
              scripts. The only cookies are the one that keeps you signed in and
              two that remember your language and appearance.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">Taking your data with you</h2>
            <p className="mt-2">
              Settings has a button that downloads everything as JSON, and
              another that deletes all of it. Neither asks you to email anybody.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">Self hosting</h2>
            <p className="mt-2">
              This app is open source. If you run your own copy, your data sits
              in your own database and this page describes only what the
              software does, not a promise from anyone else.
            </p>
          </section>
        </div>

        <p className="mt-10 text-[13px]">
          <Link href="/" className="text-green hover:underline">
            Back
          </Link>
        </p>
      </main>
    </>
  );
}
