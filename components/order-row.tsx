import Link from "next/link";
import { StatusPill } from "./ui";
import { Star } from "./marks";
import { daysUntil, rs, shortDate } from "@/lib/format";
import { calculatePricing } from "@/lib/pricing";
import type { Dict } from "@/lib/i18n";
import { AGREED, statusLabel, type Order } from "@/lib/types";

export function OrderRow({ order, t }: { order: Order; t: Dict }) {
  const p = calculatePricing(order);
  const due = daysUntil(order.deadline_date);
  const open = order.status !== "paid" && order.status !== "cancelled";
  const overdue = open && due !== null && due < 0;
  const soon = open && due !== null && due >= 0 && due <= 3;

  const meta = [
    order.customer_name,
    order.deadline_text,
    shortDate(order.created_at),
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-green-wash/50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-medium">{order.item}</span>
          {order.quantity > 1 ? (
            <span className="ledger shrink-0 text-[13px] text-faint">
              &times;{order.quantity}
            </span>
          ) : null}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-faint">
          {meta.map((m, i) => (
            <span key={`${m}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? (
                <Star size={5} className="shrink-0 text-rule-strong" />
              ) : null}
              {m}
            </span>
          ))}
          {overdue || soon ? (
            <span
              className={`ms-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-medium ${
                overdue
                  ? "bg-terracotta-wash text-terracotta"
                  : "bg-marigold-wash text-marigold-ink"
              }`}
            >
              {overdue ? t.dashOverdue : t.dashDueSoon}
            </span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 text-end">
        <div className="ledger text-[14.5px] font-semibold">{rs(p.revenue)}</div>
        {/* Nothing is owed on a draft; it only counts once she has a deal. */}
        {p.balanceDue > 0 && AGREED.includes(order.status) ? (
          <div className="ledger mt-0.5 text-[11px] text-marigold-ink">
            {rs(p.balanceDue)} {t.stillOwed.toLowerCase()}
          </div>
        ) : null}
        <div className="mt-1.5">
          <StatusPill status={order.status} label={statusLabel(order.status, t)} />
        </div>
      </div>
    </Link>
  );
}
