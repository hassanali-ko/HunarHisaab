"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { useT } from "@/components/lang";
import { confirmOrder, type ConfirmState } from "./actions";

export function ConfirmPanel({
  token,
  alreadyConfirmed,
}: {
  token: string;
  alreadyConfirmed: boolean;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<ConfirmState, FormData>(
    confirmOrder,
    undefined,
  );

  const done = alreadyConfirmed || state?.confirmed;

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/25 bg-primary-soft p-5 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-primary text-white">
          <svg viewBox="0 0 16 16" className="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M6.2 11.8 3 8.6l1.1-1.1 2.1 2.1 5.7-5.7L13 5z"
            />
          </svg>
        </div>
        <p className="mt-3 font-semibold text-primary-deep">
          {t.pubConfirmedTitle}
        </p>
        <p className="mt-1 text-sm text-primary-deep/80">{t.pubConfirmedBody}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t.pubConfirming : t.pubConfirm}
      </Button>
      {state?.error ? (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-center text-sm text-accent">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
