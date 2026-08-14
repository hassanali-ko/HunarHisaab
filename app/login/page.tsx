import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { LangSwitcher } from "@/components/lang";
import { Logo } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  }

  const params = await searchParams;
  const autoDemo = params?.demo === "1";
  const t = getDict(await getLocale());

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-5">
        <Link href="/">
          <Logo />
        </Link>
        <LangSwitcher />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-5 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t.welcome}</h1>
        <p className="mt-1.5 text-sm text-muted">{t.welcomeSub}</p>

        {!isSupabaseConfigured ? (
          <div className="mt-5 rounded-xl border border-accent/30 bg-accent-soft p-4 text-sm text-accent">
            {t.keysMissing}
          </div>
        ) : null}

        <LoginForm autoDemo={autoDemo} />
      </div>
    </main>
  );
}
