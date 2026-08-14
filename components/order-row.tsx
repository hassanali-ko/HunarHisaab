import { Fragment } from "react";
import Link from "next/link";
import { StatusBadge, statusLabel } from "./ui";
import { pkrLabel, shortDate } from "@/lib/format";
import { calculatePricing } from "@/lib/pricing";
import type { Translations } from "@/lib/i18n";
import type { Order } from "@/lib/types";

export function OrderRow({ order, t }: { order: Order; t: Translations }) {
  const p = calculatePricing(order);

  const meta = [
    order.customer_name || t.customerWord,
    order.deadline_text,
    order.payment_method,
    shortDate(order.created_at),
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-primary-soft/50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{order.item}</span>
          {order.quantity > 1 ? (
            <span className="shrink-0 text-sm tabular-nums text-muted">
              × {order.quantity}
            </span>
          ) : null}
        </div>
        {/* Separators are their own flex children so flexbox orders them,
            not the bidi algorithm, which strands them in RTL. */}
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted">
          {meta.map((m, i) => (
            <Fragment key={`${m}-${i}`}>
              {i > 0 ? <span aria-hidden="true">·</span> : null}
              <span>{m}</span>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="shrink-0 text-end">
        <div className="font-semibold tabular-nums">{pkrLabel(p.revenue)}</div>
        <div className="mt-1">
          <StatusBadge
            status={order.status}
            label={statusLabel(order.status, t)}
          />
        </div>
      </div>
    </Link>
  );
}
