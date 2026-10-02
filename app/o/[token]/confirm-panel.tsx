"use client";

import { useActionState } from "react";
import { Button, Notice } from "@/components/ui";
import { Star } from "@/components/marks";
import { useT } from "@/components/prefs";
import { confirmOrder, type ConfirmState } from "./actions";

export function ConfirmPanel({
  token,
  alreadyConfirmed,
  expired,
  isOwner,
}: {
  token: string;
  alreadyConfirmed: boolean;
  expired: boolean;
  isOwner: boolean;
}) {
  const t = useT();
  const [state, action, pending] = useActionState<ConfirmState, FormData>(
    confirmOrder,
    undefined,
  );

  const done = alreadyConfirmed || (state?.ok ?? false);

  if (expired && !done) return <Notice tone="warn">{t.pubExpired}</Notice>;

  if (isOwner && !done) return <Notice tone="info">{t.ownOrderNotice}</Notice>;

  if (done) {
    return (
      <div className="rounded-2xl border border-green-edge bg-green-wash p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green text-on-green">
          <svg viewBox="0 0 16 16" className="h-6 w-6" aria-hidden="true">
            <path
              fill="currentColor"
              d="M6.2 11.8 3 8.6l1.1-1.1 2.1 2.1 5.7-5.7L13 5z"
            />
          </svg>
        </span>
        <p className="mt-3.5 text-[17px] font-semibold text-green-deep">
          {t.pubDone}
        </p>
        <p className="mt-1.5 text-[13.5px] text-green-deep/80">
          {alreadyConfirmed && state?.reason !== "confirmed"
            ? t.pubAlready
            : t.pubDoneBody}
        </p>
        <Star size={14} className="mx-auto mt-4 text-marigold" />
      </div>
    );
  }

  const failure =
    state && !state.ok
      ? state.reason === "expired"
        ? t.pubExpired
        : state.reason === "own_order"
          ? t.ownOrderNotice
          : state.reason === "rate_limited"
          ? t.somethingWentWrong
          : state.reason === "not_found" || state.reason === "cancelled"
            ? t.pubNotFound
            : t.somethingWentWrong
      : null;

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t.pubConfirming : t.pubConfirm}
      </Button>
      {failure ? <Notice tone="bad">{failure}</Notice> : null}
    </form>
  );
}
