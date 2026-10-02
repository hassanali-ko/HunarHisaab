"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Button,
  Card,
  Field,
  inputClass,
  Notice,
  numberClass,
  Sheet,
} from "@/components/ui";
import { LangSwitcher, ThemeSwitcher, useT } from "@/components/prefs";
import { SampleDataButton } from "@/components/sample-data";
import { clearAllData } from "@/app/(app)/data-actions";
import { signOut } from "@/app/login/actions";
import {
  exportEverything,
  removeAiKey,
  saveAiKey,
  saveProfile,
  type SettingsState,
} from "./actions";
import type { AiCredential, Profile } from "@/lib/types";

type ProviderMeta = {
  id: string;
  label: string;
  keyUrl: string;
  defaultModel: string;
  models: string[];
};

export function ProfilePanel({ profile }: { profile: Profile }) {
  const t = useT();
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveProfile,
    undefined,
  );

  return (
    <Sheet title={t.setProfile}>
      <Card className="flex flex-col gap-4 p-4">
        <form action={action} className="flex flex-col gap-4">
          <Field label={t.yourName}>
            <input
              name="display_name"
              defaultValue={profile.display_name ?? ""}
              className={inputClass}
              maxLength={80}
            />
          </Field>
          <Field label={t.businessName} hint={t.onbBusinessHint}>
            <input
              name="business_name"
              defaultValue={profile.business_name ?? ""}
              className={inputClass}
              maxLength={120}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.onbCraftLabel}>
              <input
                name="craft"
                defaultValue={profile.craft ?? ""}
                className={inputClass}
                maxLength={80}
              />
            </Field>
            <Field label={t.city}>
              <input
                name="city"
                defaultValue={profile.city ?? ""}
                className={inputClass}
                maxLength={80}
              />
            </Field>
          </div>
          <Field label={t.fPhone} hint={t.optional}>
            <input
              name="whatsapp"
              defaultValue={profile.whatsapp ?? ""}
              dir="ltr"
              inputMode="tel"
              className={`${inputClass} latin`}
              maxLength={32}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.fRate} hint="PKR / hr">
              <input
                name="default_hourly_rate"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                defaultValue={profile.default_hourly_rate}
                className={numberClass}
              />
            </Field>
            <Field label={t.fProfit} hint={t.fProfitHint}>
              <input
                name="default_profit_percent"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                defaultValue={profile.default_profit_percent}
                className={numberClass}
              />
            </Field>
          </div>

          {state?.error ? <Notice tone="bad">{state.error}</Notice> : null}
          {state?.ok ? <Notice tone="good">{t.saved}</Notice> : null}

          <Button type="submit" disabled={pending} className="self-start">
            {pending ? t.saving : t.save}
          </Button>
        </form>
      </Card>
    </Sheet>
  );
}

export function AppearancePanel() {
  const t = useT();
  return (
    <Sheet title={t.setTheme}>
      <Card className="flex flex-col gap-4 p-4">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium">
            {t.setLanguage}
          </span>
          <LangSwitcher />
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] font-medium">{t.setTheme}</span>
          <ThemeSwitcher labels={[t.themeSystem, t.themeLight, t.themeDark]} />
        </div>
      </Card>
    </Sheet>
  );
}

export function AiPanel({
  providers,
  credential,
  encryptionReady,
}: {
  providers: ProviderMeta[];
  credential: AiCredential | null;
  encryptionReady: boolean;
}) {
  const t = useT();
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveAiKey,
    undefined,
  );
  const [provider, setProvider] = useState(
    credential?.provider ?? providers[0].id,
  );
  const [removing, startRemove] = useTransition();

  const current = providers.find((p) => p.id === provider) ?? providers[0];

  return (
    <Sheet title={t.setAi}>
      <Card className="flex flex-col gap-4 p-4">
        <p className="text-[13.5px] leading-relaxed text-soft">{t.setAiSub}</p>

        {!encryptionReady ? (
          <Notice tone="warn">{t.setAiDisabled}</Notice>
        ) : credential ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-edge bg-green-wash p-3">
            <div>
              <p className="text-[13.5px] font-medium text-green-deep">
                {t.setAiKeyStored}
              </p>
              <p className="latin ledger mt-0.5 text-[12px] text-green-deep/80">
                {credential.provider} &middot; {credential.key_hint}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={removing}
              onClick={() => startRemove(() => void removeAiKey())}
            >
              {t.setAiRemove}
            </Button>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-3">
            <Field label={t.setAiProvider}>
              <select
                name="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className={inputClass}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Model">
              <select
                name="model"
                defaultValue={current.defaultModel}
                key={current.id}
                className={`${inputClass} latin`}
              >
                {current.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t.setAiKey} hint={t.setAiNever}>
              <input
                name="api_key"
                type="password"
                dir="ltr"
                autoComplete="off"
                spellCheck={false}
                className={`${inputClass} latin`}
                placeholder="sk-..."
              />
            </Field>

            {state?.error ? <Notice tone="bad">{state.error}</Notice> : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? t.saving : t.save}
              </Button>
              <a
                href={current.keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-green underline underline-offset-4"
              >
                {t.setAiGetKey}
              </a>
            </div>
          </form>
        )}
      </Card>
    </Sheet>
  );
}

export function DataPanel({ hasData }: { hasData: boolean }) {
  const t = useT();
  const [busy, start] = useTransition();
  const [confirmText, setConfirmText] = useState("");

  const doExport = () =>
    start(async () => {
      const json = await exportEverything();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hunarhisaab-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

  return (
    <Sheet title={t.setData}>
      <Card className="flex flex-col gap-5 p-4">
        <div>
          <p className="text-[14px] font-medium">{t.setExport}</p>
          <p className="mt-0.5 text-[13px] text-soft">{t.setExportSub}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2.5"
            onClick={doExport}
            disabled={busy}
          >
            {t.setExport}
          </Button>
        </div>

        {!hasData ? (
          <div>
            <p className="text-[14px] font-medium">{t.setSampleLoad}</p>
            <p className="mt-0.5 text-[13px] text-soft">{t.setSampleSub}</p>
            <div className="mt-2.5">
              <SampleDataButton label={t.setSampleLoad} variant="outline" />
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-terracotta-edge bg-terracotta-wash p-3.5">
          <p className="text-[14px] font-medium text-terracotta">{t.setClear}</p>
          <p className="mt-0.5 text-[13px] text-terracotta/85">{t.setClearSub}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t.setClearConfirm}
              aria-label={t.setClearConfirm}
              className={`${inputClass} latin max-w-[190px]`}
            />
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={confirmText !== "DELETE" || busy}
              onClick={() =>
                start(async () => {
                  await clearAllData();
                  setConfirmText("");
                })
              }
            >
              {t.delete}
            </Button>
          </div>
        </div>

        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            {t.logout}
          </Button>
        </form>
      </Card>
    </Sheet>
  );
}
