import Link from "next/link";
import { ButtonLink, Card, Notice } from "@/components/ui";
import { LangSwitcher } from "@/components/prefs";
import { Logo, Seam, Star } from "@/components/marks";
import { TryIt } from "@/components/landing/try-it";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";

const REPO = "https://github.com/hassanali-ko/HunarHisaab";

export default async function Landing() {
  const { locale } = await readPrefs();
  const t = getDict(locale);

  const pitches = [
    { title: t.pitchCostTitle, body: t.pitchCostBody },
    { title: t.pitchConfirmTitle, body: t.pitchConfirmBody },
    { title: t.pitchRecordTitle, body: t.pitchRecordBody },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <LangSwitcher />
            {/* A display utility on the button itself loses to the
                inline-flex in its own base class, so the wrapper does it. */}
            <span className="hidden sm:contents">
              <ButtonLink href="/login" variant="ghost" size="sm">
                {t.login}
              </ButtonLink>
            </span>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {/* ------------------------------------------------------------ hero */}
        <section className="mx-auto w-full max-w-5xl px-5 pb-12 pt-10 sm:pt-16">
          <div className="flex flex-wrap items-center gap-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-green-edge bg-green-wash px-3 py-1.5 text-[12px] font-medium text-green-deep">
              <Star size={11} className="text-marigold" />
              {t.heroKicker}
            </p>
            <p className="tape inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium">
              <Star size={11} className="text-marigold" />
              {t.award}
            </p>
          </div>

          <h1 className="mt-5 max-w-3xl text-[2.35rem] leading-[1.07] sm:text-[3.4rem]">
            {t.heroLine1}
            <br />
            <span className="text-green">{t.heroLine2}</span>
          </h1>

          <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-soft">
            {t.heroBody}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/login" size="lg">
              {t.heroCtaPrimary}
            </ButtonLink>
            <ButtonLink href="#try" variant="outline" size="lg">
              {t.heroCtaSecondary}
            </ButtonLink>
          </div>

          <p className="mt-6 text-[13px] italic text-faint">{t.nameMeaning}</p>
        </section>

        {/* ---------------------------------------------------------- try it */}
        <section id="try" className="mx-auto w-full max-w-5xl scroll-mt-20 px-5 pb-14">
          <div className="mb-4">
            <h2 className="text-2xl">{t.tryTitle}</h2>
            <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-soft">
              {t.tryBody}
            </p>
          </div>
          <TryIt />
        </section>

        <div className="mx-auto w-full max-w-5xl px-5">
          <Seam />
        </div>

        {/* --------------------------------------------------------- pitches */}
        <section className="mx-auto w-full max-w-5xl px-5 py-14">
          <div className="grid gap-4 sm:grid-cols-3">
            {pitches.map((p, i) => (
              <Card key={p.title} className="p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-wash">
                  <Star size={14} className="text-green" />
                </span>
                <h3 className="mt-3.5 text-[17px]">{p.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-soft">
                  {p.body}
                </p>
                <span className="sr-only">{i + 1}</span>
              </Card>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------- open source */}
        <section className="mx-auto w-full max-w-5xl px-5 pb-14">
          <Card stitched className="p-6 sm:p-8">
            <h2 className="text-2xl">{t.openSourceTitle}</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-soft">
              {t.openSourceBody}
            </p>
            <div className="mt-5">
              <ButtonLink
                href={REPO}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
              >
                {t.viewSource}
              </ButtonLink>
            </div>
          </Card>
        </section>

        {/* -------------------------------------------------------- honesty */}
        <section className="mx-auto w-full max-w-5xl px-5 pb-16">
          <Notice tone="info" className="max-w-2xl">
            <strong className="font-semibold text-ink">{t.honestTitle}.</strong>{" "}
            {t.honestBody}
          </Notice>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-7 text-[13px] text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>
            {t.appName}. {t.tagline}.
          </span>
          <nav className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-green">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-green">
              Terms
            </Link>
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green"
            >
              Source
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
