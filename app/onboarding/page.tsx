import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./form";
import { Logo, Seam } from "@/components/marks";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { requireProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Set up" };

export default async function OnboardingPage() {
  const { profile } = await requireProfile();
  if (profile?.onboarded_at) redirect("/dashboard");

  const { locale } = await readPrefs();
  const t = getDict(locale);

  return (
    <>
      <header className="mx-auto flex w-full max-w-md items-center px-5 py-5">
        <Logo />
      </header>
      <main id="main" className="mx-auto w-full max-w-md flex-1 px-5 pb-16">
        <h1 className="text-[1.9rem] leading-tight">{t.onbTitle}</h1>
        <p className="mt-1.5 text-[15px] text-soft">{t.onbSub}</p>
        <Seam className="mt-5" />
        <OnboardingForm profile={profile} />
      </main>
    </>
  );
}
