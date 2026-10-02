"use client";

import { useMemo, useState } from "react";
import { OrderRow } from "@/components/order-row";
import { Card, inputClass } from "@/components/ui";
import type { Dict } from "@/lib/i18n";
import { ORDER_STATUSES, statusLabel, type Order } from "@/lib/types";

/** Search and status filtering, kept on the client so it feels immediate. */
export function OrderFilters({
  orders,
  t,
  initialQuery = "",
}: {
  orders: Order[];
  t: Dict;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<string>("all");

  const present = useMemo(() => {
    const seen = new Set(orders.map((o) => o.status));
    return ORDER_STATUSES.filter((s) => seen.has(s));
  }, [orders]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (!q) return true;
      return (
        o.item.toLowerCase().includes(q) ||
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        (o.delivery_area ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, query, status]);

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.ordersSearch}
        aria-label={t.ordersSearch}
        className={inputClass}
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {["all", ...present].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              status === s
                ? "border-green bg-green text-on-green"
                : "border-rule bg-raised text-soft hover:bg-green-wash"
            }`}
          >
            {s === "all" ? t.ordersFilterAll : statusLabel(s, t)}
          </button>
        ))}
      </div>

      <Card className="mt-3 p-2">
        {shown.length === 0 ? (
          <p className="px-4 py-8 text-center text-[14px] text-faint">
            {t.ordersNone}
          </p>
        ) : (
          <div className="divide-y divide-rule">
            {shown.map((o) => (
              <OrderRow key={o.id} order={o} t={t} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
