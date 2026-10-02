import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { LangSwitcher } from "@/components/prefs";
import { Logo } from "@/components/marks";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { isConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  if (isConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  }

  const { locale } = await readPrefs();
  const t = getDict(locale);

  return (
    <>
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-5">
        <Link href="/" aria-label={t.appName}>
          <Logo />
        </Link>
        <LangSwitcher />
      </header>

      <main id="main" className="mx-auto w-full max-w-md flex-1 px-5 pb-16">
        <h1 className="text-[1.9rem] leading-tight">{t.welcomeBack}</h1>
        <p className="mt-1.5 text-[15px] text-soft">{t.welcomeBackSub}</p>
        <LoginForm configured={isConfigured} />
      </main>
    </>
  );
}
