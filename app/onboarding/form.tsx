"use client";

import { useActionState } from "react";
import { Button, Field, inputClass, numberClass, Notice } from "@/components/ui";
import { useT } from "@/components/prefs";
import { finishOnboarding, skipOnboarding, type OnboardState } from "./actions";
import type { Profile } from "@/lib/types";

const CRAFTS = [
  "Stitching",
  "Embroidery",
  "Home food",
  "Baking",
  "Mehndi",
  "Beauty",
  "Handicraft",
  "Tuition",
  "Something else",
];

export function OnboardingForm({ profile }: { profile: Profile | null }) {
  const t = useT();
  const [state, action, pending] = useActionState<OnboardState, FormData>(
    finishOnboarding,
    undefined,
  );

  return (
    <form action={action} className="mt-7 flex flex-col gap-5">
      <Field label={t.onbNameLabel}>
        <input
          name="display_name"
          defaultValue={profile?.display_name ?? ""}
          className={inputClass}
          autoComplete="name"
          maxLength={80}
          required
        />
      </Field>

      <Field label={t.onbBusinessLabel} hint={t.onbBusinessHint}>
        <input
          name="business_name"
          defaultValue={profile?.business_name ?? ""}
          className={inputClass}
          maxLength={120}
        />
      </Field>

      <Field label={t.onbCraftLabel}>
        <select name="craft" defaultValue={profile?.craft ?? ""} className={inputClass}>
          <option value="">{t.fPaymentSelect}</option>
          {CRAFTS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t.city} hint={t.optional}>
        <input
          name="city"
          defaultValue={profile?.city ?? ""}
          className={inputClass}
          maxLength={80}
        />
      </Field>

      <div className="paper-card stitch p-5">
        <Field label={t.onbRateLabel} hint={t.onbRateHint}>
          <div className="flex items-center gap-2">
            <span className="ledger text-[15px] text-soft">Rs</span>
            <input
              name="default_hourly_rate"
              type="number"
              min="0"
              step="10"
              inputMode="numeric"
              defaultValue={profile?.default_hourly_rate || 250}
              className={numberClass}
              required
            />
            <span className="whitespace-nowrap text-[14px] text-soft">/ hr</span>
          </div>
        </Field>
        <p className="mt-2.5 text-[12.5px] text-faint">{t.onbRateSuggest}</p>
      </div>

      {state?.error ? <Notice tone="bad">{state.error}</Notice> : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t.saving : t.onbFinish}
      </Button>

      <button
        type="button"
        onClick={() => void skipOnboarding()}
        className="text-center text-[13px] text-faint underline underline-offset-4 hover:text-green"
      >
        {t.onbSkip}
      </button>
    </form>
  );
}
