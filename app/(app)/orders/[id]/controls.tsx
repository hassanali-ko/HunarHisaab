"use client";

import { useState, useTransition } from "react";
import { Button, Field, Notice, numberClass } from "@/components/ui";
import { useT } from "@/components/prefs";
import { rs } from "@/lib/format";
import { NEXT_BY_SELLER, statusLabel, type OrderStatus } from "@/lib/types";
import {
  deleteOrder,
  recordPayment,
  revokeShareLink,
  setStatus,
} from "../actions";

export function StatusControls({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const t = useT();
  const [pending, start] = useTransition();
  const next = NEXT_BY_SELLER[status] ?? null;

  if (status === "cancelled") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {next ? (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => start(() => void setStatus(orderId, next))}
        >
          {t.moveStatus}: {statusLabel(next, t)}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => start(() => void setStatus(orderId, "cancelled"))}
      >
        {t.statusCancelled}
      </Button>
    </div>
  );
}

export function PaymentPanel({
  orderId,
  total,
  paid,
}: {
  orderId: string;
  total: number;
  paid: number;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const due = Math.max(0, total - paid);

  return (
    <div>
      <dl className="divide-y divide-rule/70">
        <div className="flex items-baseline justify-between gap-4 py-1.5">
          <dt className="text-[13.5px] text-soft">{t.paidSoFar}</dt>
          <dd className="ledger text-[14px] font-medium">{rs(paid)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-1.5">
          <dt className="text-[13.5px] text-soft">{t.stillOwed}</dt>
          <dd
            className={`ledger text-[14px] font-semibold ${
              due > 0 ? "text-marigold-ink" : "text-green"
            }`}
          >
            {due > 0 ? rs(due) : t.fullyPaid}
          </dd>
        </div>
      </dl>

      {due > 0 ? (
        open ? (
          <form
            action={(fd) => start(() => void recordPayment(orderId, fd))}
            className="mt-3 flex items-end gap-2"
          >
            <Field label={t.amountReceived} className="flex-1">
              <input
                name="amount"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                defaultValue={due}
                className={numberClass}
                autoFocus
              />
            </Field>
            <Button type="submit" disabled={pending}>
              {t.save}
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setOpen(true)}
          >
            {t.recordPayment}
          </Button>
        )
      ) : null}
    </div>
  );
}

export function DangerZone({
  orderId,
  canRevoke,
}: {
  orderId: string;
  canRevoke: boolean;
}) {
  const t = useT();
  const [pending, start] = useTransition();
  const [revoked, setRevoked] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canRevoke ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending || revoked}
          onClick={() =>
            start(async () => {
              await revokeShareLink(orderId);
              setRevoked(true);
            })
          }
        >
          {revoked ? t.revokeLinkDone : t.revokeLink}
        </Button>
      ) : null}

      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (window.confirm(t.deleteConfirm)) {
            start(() => void deleteOrder(orderId));
          }
        }}
      >
        {t.deleteOrder}
      </Button>
    </div>
  );
}

export function SavedBanner({ message }: { message: string }) {
  return <Notice tone="good">{message}</Notice>;
}
