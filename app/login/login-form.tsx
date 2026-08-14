"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { useT } from "@/components/lang";
import { demoLogin, signIn, signUp, type AuthState } from "./actions";

export function LoginForm({ autoDemo = false }: { autoDemo?: boolean }) {
  const t = useT();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );

  const [demoPending, startDemo] = useTransition();
  const [demoError, setDemoError] = useState<string | null>(null);

  const runDemo = () =>
    startDemo(async () => {
      const result = await demoLogin();
      if (result?.error) setDemoError(result.error);
    });

  useEffect(() => {
    if (autoDemo) runDemo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDemo]);

  const error = demoError ?? state?.error;

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div>
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="w-full"
          onClick={runDemo}
          disabled={demoPending}
        >
          {demoPending ? t.demoLoading : t.demoBtn}
        </Button>
        <p className="mt-2 text-center text-xs text-muted">{t.demoHint}</p>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        {t.orOwnAccount}
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="flex rounded-xl border border-border bg-card p-1 text-sm font-medium">
        {(
          [
            ["signin", t.signInTab],
            ["signup", t.signUpTab],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg px-3 py-2 transition-colors ${
              mode === m
                ? "bg-primary text-white"
                : "text-muted hover:bg-primary-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {mode === "signup" ? (
          <>
            <Field label={t.yourName}>
              <input
                name="display_name"
                className={inputClass}
                placeholder="Ayesha Tariq"
                autoComplete="name"
              />
            </Field>
            <Field label={t.businessName} hint={t.optional}>
              <input
                name="business_name"
                className={inputClass}
                placeholder="Ayesha Stitching Studio"
              />
            </Field>
            <Field label={t.city} hint={t.optional}>
              <input name="city" className={inputClass} placeholder="Lahore" />
            </Field>
          </>
        ) : null}

        <Field label={t.email}>
          <input
            name="email"
            type="email"
            required
            dir="ltr"
            className={inputClass}
            placeholder="aap@example.com"
            autoComplete="email"
          />
        </Field>

        <Field
          label={t.password}
          hint={mode === "signup" ? t.passwordHint : undefined}
        >
          <input
            name="password"
            type="password"
            required
            dir="ltr"
            className={inputClass}
            placeholder="••••••••"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </Field>

        {error ? (
          <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={pending}>
          {pending
            ? t.oneMoment
            : mode === "signin"
              ? t.signInTab
              : t.createAccount}
        </Button>
      </form>
    </div>
  );
}
