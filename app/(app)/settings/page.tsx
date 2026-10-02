import type { Metadata } from "next";
import { AiPanel, AppearancePanel, DataPanel, ProfilePanel } from "./panels";
import { Seam } from "@/components/marks";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { requireOnboarded } from "@/lib/data";
import { encryptionAvailable } from "@/lib/ai/crypto";
import { PROVIDERS } from "@/lib/ai/providers";
import type { AiCredential } from "@/lib/types";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase, user, profile } = await requireOnboarded();
  const { locale } = await readPrefs();
  const t = getDict(locale);

  const [{ data: cred }, { count }] = await Promise.all([
    supabase
      .from("ai_credentials")
      .select("user_id, provider, model, key_hint, last_used_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  // Only the public half of the provider list crosses to the client. Patterns
  // are regexes and do not serialise, so they stay on the server.
  const providers = Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    label: p.label,
    keyUrl: p.keyUrl,
    defaultModel: p.defaultModel,
    models: [...p.models],
  }));

  return (
    <>
      <h1 className="text-[1.6rem] leading-tight">{t.settingsTitle}</h1>

      <div className="mt-5 flex flex-col gap-6">
        <ProfilePanel profile={profile} />
        <Seam />
        <AppearancePanel />
        <Seam />
        <AiPanel
          providers={providers}
          credential={(cred as AiCredential | null) ?? null}
          encryptionReady={encryptionAvailable()}
        />
        <Seam />
        <DataPanel hasData={(count ?? 0) > 0} />
      </div>

      <p className="mt-10 text-center text-[11.5px] text-faint">
        {t.appName} &middot;{" "}
        <a
          href="https://github.com/hassanali-ko/HunarHisaab"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-green"
        >
          {t.viewSource}
        </a>
      </p>
    </>
  );
}
