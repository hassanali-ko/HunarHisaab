"use client";

import { useTransition } from "react";
import { deletePriceBookEntry } from "../orders/actions";

export function RemoveEntry({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void deletePriceBookEntry(id))}
      className="text-[12px] font-medium text-faint underline underline-offset-4 hover:text-terracotta disabled:opacity-50"
    >
      {label}
    </button>
  );
}
