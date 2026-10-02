import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/marks";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <>
      <header className="mx-auto w-full max-w-2xl px-5 py-5">
        <Link href="/">
          <Logo />
        </Link>
      </header>
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16">
        <h1 className="text-[2rem] leading-tight">Terms</h1>

        <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-soft">
          <section>
            <h2 className="text-[18px] text-ink">What this is</h2>
            <p className="mt-2">
              A tool for recording your own work and pricing it. You keep your
              records; the software only helps you keep them.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">What it is not</h2>
            <p className="mt-2">
              It is not a bank, a lender, a payment service, or an accountant.
              The income record it produces is a history of orders your
              customers confirmed. It is not a bank statement, a credit score,
              or verified income, and it should not be presented as one.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">Money</h2>
            <p className="mt-2">
              No payment ever passes through this app. Recording a payment here
              records that you were paid. It does not move money, and it is not
              a receipt either party can rely on in a dispute.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">The numbers</h2>
            <p className="mt-2">
              Prices are arithmetic on the figures you enter. If a cost is wrong
              going in, the price is wrong coming out. Check the work before you
              quote it.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">Your account</h2>
            <p className="mt-2">
              Keep your password to yourself. Anyone who can sign in can read
              and change your records. You can delete everything at any time
              from Settings.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] text-ink">No warranty</h2>
            <p className="mt-2">
              The software is provided as is, under the MIT licence, with no
              warranty of any kind. Keep your own copy of anything that matters.
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
