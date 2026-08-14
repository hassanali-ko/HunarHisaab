import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(29,37,33,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "primary" | "accent";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "accent"
        ? "text-accent"
        : "text-foreground";
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <span
        className={`text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl ${toneClass}`}
      >
        {value}
      </span>
      {sub ? <span className="text-xs text-muted">{sub}</span> : null}
    </Card>
  );
}

const badgeStyles: Record<string, string> = {
  confirmed: "bg-primary-soft text-primary-deep",
  pending: "bg-[#fdf3e0] text-[#8a6316]",
  draft: "bg-[#f0efeb] text-muted",
  completed: "bg-primary-soft text-primary-deep",
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        badgeStyles[status] ?? badgeStyles.draft
      }`}
    >
      {status === "confirmed" ? (
        <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6.2 11.8 3 8.6l1.1-1.1 2.1 2.1 5.7-5.7L13 5z"
          />
        </svg>
      ) : null}
      {label}
    </span>
  );
}

export function statusLabel(
  status: string,
  t: {
    statusConfirmed: string;
    statusPending: string;
    statusDraft: string;
    statusCompleted: string;
  },
): string {
  const map: Record<string, string> = {
    confirmed: t.statusConfirmed,
    pending: t.statusPending,
    draft: t.statusDraft,
    completed: t.statusCompleted,
  };
  return map[status] ?? status;
}

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "accent";
  size?: "md" | "lg";
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const buttonVariants: Record<string, string> = {
  primary: "bg-primary text-white hover:bg-primary-deep",
  accent: "bg-accent text-white hover:brightness-95",
  secondary: "border border-border bg-card text-foreground hover:bg-primary-soft",
  ghost: "text-primary hover:bg-primary-soft",
};

const buttonSizes: Record<string, string> = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps & ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps & ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={`${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary-soft";

export function Logo({
  className = "",
  compact = false,
}: {
  className?: string;
  /** Hides the wordmark on narrow screens where header space is tight. */
  compact?: boolean;
}) {
  return (
    <span
      className={`flex shrink-0 items-center gap-2 font-semibold ${className}`}
    >
      <Image
        src="/mark.png"
        alt="HunarHisaab"
        width={72}
        height={72}
        priority
        className="h-9 w-9 shrink-0 object-contain"
      />
      <span
        className={`whitespace-nowrap text-[17px] tracking-tight ${
          compact ? "hidden sm:inline" : ""
        }`}
        style={{ fontFamily: "var(--font-sans)" }}
      >
        Hunar<span className="text-primary">Hisaab</span>
      </span>
    </span>
  );
}
