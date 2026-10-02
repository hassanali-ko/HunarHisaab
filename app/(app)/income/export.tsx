"use client";

import { Button } from "@/components/ui";

type Row = {
  date: string;
  item: string;
  customer: string;
  quantity: number;
  unit_price: number;
  total: number;
  cost: number;
  profit: number;
  hours: number;
  status: string;
};

/** Escapes a value for CSV, including the leading quote trick spreadsheets
 *  use to run formulas from imported text. */
function csvCell(value: string | number): string {
  const s = String(value ?? "");
  const risky = /^[=+\-@\t\r]/.test(s);
  const safe = risky ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function ExportButtons({
  orders,
  labels,
  businessName,
}: {
  orders: Row[];
  labels: { csv: string; print: string };
  businessName: string;
}) {
  const download = () => {
    const header = [
      "Date", "Item", "Customer", "Quantity", "Price each",
      "Total", "Cost", "Profit", "Hours", "Status",
    ];
    const lines = [
      header.map(csvCell).join(","),
      ...orders.map((o) =>
        [
          o.date, o.item, o.customer, o.quantity, o.unit_price,
          o.total, o.cost, o.profit, o.hours, o.status,
        ]
          .map(csvCell)
          .join(","),
      ),
    ];
    // The BOM makes Excel open Urdu and Roman Urdu correctly.
    const blob = new Blob(["﻿" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${businessName.replace(/[^\w-]+/g, "-").toLowerCase()}-income.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="no-print flex gap-2">
      <Button type="button" variant="outline" size="sm" onClick={download}>
        {labels.csv}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => window.print()}
      >
        {labels.print}
      </Button>
    </div>
  );
}
