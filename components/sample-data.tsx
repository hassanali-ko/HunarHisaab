"use client";

import { useTransition } from "react";
import { Button } from "./ui";
import { loadSampleData } from "@/app/(app)/data-actions";

/** Fills an empty register so someone can see the shape of the thing. */
export function SampleDataButton({
  label,
  variant = "ghost",
}: {
  label: string;
  variant?: "ghost" | "outline";
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={pending}
      onClick={() => start(() => void loadSampleData())}
    >
      {label}
    </Button>
  );
}
