import { LangSwitcher } from "@/components/lang";
import { ButtonLink, Card, Logo } from "@/components/ui";
import { SAMPLE_WHATSAPP_MESSAGE } from "@/lib/demo";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export default async function Home() {
  const locale = await getLocale();
  const t = getDict(locale);

  const steps = [
    { title: t.step1Title, body: t.step1Body },
    { title: t.step2Title, body: t.step2Body },
    { title: t.step3Title, body: t.step3Body },
  ];

  const extracted: [string, string][] = [
    [t.itemLabel, "Embroidered suit"],
    [t.qtyLabel, "3"],
    [t.priceLabel, "PKR 4,200"],
    [t.deadlineLabel, "23rd"],
    [t.areaLabel, "DHA, Lahore"],
    [t.paymentLabel, "Easypaisa"],
  ];

  return (
    <main className="flex-1">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <LangSwitcher />
          <ButtonLink
            href="/login"
            variant="ghost"
            className="hidden whitespace-nowrap text-sm sm:inline-flex"
          >
            {t.login}
          </ButtonLink>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-5 pb-14 pt-6 sm:pt-12">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary-deep">
          {t.heroBadge}
        </p>

        <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          {t.heroPre} <span className="text-primary">{t.heroMark}</span>{" "}
          {t.heroPost}
        </h1>

        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
          {t.heroSub}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/login" size="lg">
            {t.ctaPrimary}
          </ButtonLink>
          <ButtonLink href="/login?demo=1" variant="secondary" size="lg">
            {t.ctaSecondary}
          </ButtonLink>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Card className="bg-[#dcf8c6]/40">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t.waCardLabel}
            </p>
            <p
              dir="ltr"
              className="mt-3 rounded-2xl rounded-tl-sm bg-[#dcf8c6] p-4 text-start text-[15px] leading-relaxed text-[#1d2521]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {SAMPLE_WHATSAPP_MESSAGE}
            </p>
          </Card>

          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t.appCardLabel}
            </p>
            <dl className="mt-3 space-y-2.5 text-sm">
              {extracted.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
              {t.timeIsCost}
            </p>
          </Card>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <Card key={step.title}>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-sm font-semibold tabular-nums text-primary-deep">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </Card>
          ))}
        </div>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted">
          {t.landingDisclaimer}
        </p>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-5 py-6 text-sm text-muted">
          {t.footerLine}
        </div>
      </footer>
    </main>
  );
}
