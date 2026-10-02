"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button, Field, inputClass, Notice } from "@/components/ui";
import { useT } from "@/components/prefs";
import { signIn, signUp, type AuthState } from "./actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const t = useT();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "in" ? signIn : signUp,
    undefined,
  );

  return (
    <div className="mt-7 flex flex-col gap-5">
      {!configured ? <Notice tone="warn">{t.setupNeeded}</Notice> : null}

      <div
        className="flex rounded-xl border border-rule bg-raised p-1 text-[13.5px] font-medium"
        role="tablist"
      >
        {(
          [
            ["in", t.login],
            ["up", t.signup],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={`flex-1 rounded-lg px-3 py-2 transition-colors ${
              mode === key ? "bg-green text-on-green" : "text-soft hover:bg-green-wash"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form action={action} className="flex flex-col gap-4">
        {mode === "up" ? (
          <>
            <Field label={t.yourName}>
              <input
                name="display_name"
                className={inputClass}
                autoComplete="name"
                maxLength={80}
              />
            </Field>
            <Field label={t.businessName} hint={t.optional}>
              <input name="business_name" className={inputClass} maxLength={120} />
            </Field>
            <Field label={t.city} hint={t.optional}>
              <input name="city" className={inputClass} maxLength={80} />
            </Field>
          </>
        ) : null}

        <Field label={t.email}>
          <input
            name="email"
            type="email"
            required
            dir="ltr"
            inputMode="email"
            autoComplete="email"
            className={`${inputClass} latin`}
          />
        </Field>

        <Field label={t.password} hint={mode === "up" ? t.passwordHint : undefined}>
          <input
            name="password"
            type="password"
            required
            dir="ltr"
            minLength={8}
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            className={`${inputClass} latin`}
          />
        </Field>

        {state?.error ? <Notice tone="bad">{state.error}</Notice> : null}

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t.loading : mode === "in" ? t.login : t.createAccount}
        </Button>
      </form>

      <p className="text-center text-[13px] text-faint">
        {mode === "in" ? t.noAccount : t.haveAccount}{" "}
        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="font-medium text-green underline underline-offset-4"
        >
          {mode === "in" ? t.signup : t.login}
        </button>
      </p>

      <p className="text-center text-[12.5px] text-faint">
        <Link href="/" className="hover:text-green">
          {t.back}
        </Link>
      </p>
    </div>
  );
}
