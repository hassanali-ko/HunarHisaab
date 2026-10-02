import Link from "next/link";
import { DesktopNav, MobileNav } from "@/components/app-nav";
import { LangSwitcher } from "@/components/prefs";
import { Logo, Star } from "@/components/marks";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { locale } = await readPrefs();
  const t = getDict(locale);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/dashboard" aria-label={t.appName}>
            <Logo compact />
          </Link>
          <DesktopNav />
          <div className="flex items-center gap-2">
            <LangSwitcher />
            <Link
              href="/orders/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-green px-3 py-2 text-[13px] font-semibold text-on-green transition-colors hover:bg-green-deep"
            >
              <Star size={11} className="text-marigold" />
              <span className="hidden sm:inline">{t.navNewOrder}</span>
              <span className="sm:hidden">+</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 pb-28 pt-5 md:pb-14">
        {children}
      </main>

      <MobileNav />
    </>
  );
}
