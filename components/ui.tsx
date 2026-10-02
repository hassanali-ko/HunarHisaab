import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ---------------------------------------------------------------- surfaces */

export function Card({
  children,
  className = "",
  stitched = false,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Adds the running stitch inset, for the one card that matters most. */
  stitched?: boolean;
  as?: "div" | "section" | "article";
}) {
  return (
    <As className={`paper-card ${stitched ? "stitch" : ""} ${className}`}>
      {children}
    </As>
  );
}

export function Sheet({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {title ? (
        <header className="mb-2 flex items-center justify-between gap-3 px-1">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ figures */

export function Stat({
  label,
  value,
  sub,
  tone = "plain",
  className = "",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "plain" | "green" | "marigold" | "terracotta";
  className?: string;
}) {
  const toneClass = {
    plain: "text-ink",
    green: "text-green",
    marigold: "text-marigold-ink",
    terracotta: "text-terracotta",
  }[tone];

  return (
    <div className={`paper-card flex flex-col gap-1 p-4 ${className}`}>
      <span className="text-[12.5px] font-medium leading-snug text-soft">
        {label}
      </span>
      <span
        className={`ledger text-[22px] font-semibold leading-none sm:text-[26px] ${toneClass}`}
      >
        {value}
      </span>
      {sub ? (
        <span className="text-[11.5px] leading-snug text-faint">{sub}</span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ status */

const STATUS_TONE: Record<string, string> = {
  draft: "bg-sunk text-soft border-rule",
  sent: "bg-marigold-wash text-marigold-ink border-marigold-edge",
  confirmed: "bg-green-wash text-green border-green-edge",
  in_progress: "bg-indigo-wash text-indigo border-indigo/25",
  delivered: "bg-green-wash text-green border-green-edge",
  paid: "bg-green text-on-green border-green",
  cancelled: "bg-sunk text-faint border-rule line-through",
};

export function StatusPill({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-medium ${
        STATUS_TONE[status] ?? STATUS_TONE.draft
      }`}
    >
      {status === "confirmed" || status === "paid" || status === "delivered" ? (
        <svg viewBox="0 0 16 16" className="h-3 w-3 shrink-0" aria-hidden="true">
          <path fill="currentColor" d="M6.2 11.8 3 8.6l1.1-1.1 2.1 2.1 5.7-5.7L13 5z" />
        </svg>
      ) : null}
      {label}
    </span>
  );
}

/* ----------------------------------------------------------------- buttons */

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,border-color,color,transform] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55";

const variants: Record<string, string> = {
  primary: "bg-green text-on-green hover:bg-green-deep",
  marigold: "bg-marigold text-[#3a2a06] hover:brightness-[0.97]",
  outline: "border border-rule-strong bg-raised text-ink hover:bg-green-wash",
  ghost: "text-green hover:bg-green-wash",
  danger: "border border-terracotta-edge bg-terracotta-wash text-terracotta hover:brightness-[0.98]",
  whatsapp: "bg-[#25D366] text-[#04300f] hover:brightness-[0.97]",
};

const sizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3.5 text-[15px]",
};

type Look = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: Look & ComponentProps<"button">) {
  return (
    <button
      {...rest}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: Look & ComponentProps<typeof Link>) {
  return (
    <Link
      {...rest}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    />
  );
}

/* ------------------------------------------------------------------- forms */

export const inputClass =
  "w-full rounded-xl border border-rule bg-raised px-3.5 py-2.5 text-[15px] text-ink outline-none transition-colors placeholder:text-faint/80 focus:border-green focus:ring-[3px] focus:ring-green-wash";

export const numberClass = `${inputClass} ledger`;

export function Field({
  label,
  hint,
  error,
  flag,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string | null;
  /** Shown when the parser was unsure, so she knows where to look. */
  flag?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
        {label}
        {flag ? (
          <span className="tape rounded-full px-1.5 py-0.5 text-[10.5px] font-medium">
            {flag}
          </span>
        ) : null}
      </span>
      {children}
      {error ? (
        <span className="text-[12px] text-terracotta">{error}</span>
      ) : hint ? (
        <span className="text-[12px] text-faint">{hint}</span>
      ) : null}
    </label>
  );
}

/* ------------------------------------------------------------------ notices */

export function Notice({
  tone = "info",
  children,
  className = "",
}: {
  tone?: "info" | "good" | "warn" | "bad";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "bg-sunk border-rule text-soft",
    good: "bg-green-wash border-green-edge text-green-deep",
    warn: "bg-marigold-wash border-marigold-edge text-marigold-ink",
    bad: "bg-terracotta-wash border-terracotta-edge text-terracotta",
  }[tone];
  return (
    <div className={`rounded-xl border px-3.5 py-2.5 text-[13.5px] leading-relaxed ${tones} ${className}`}>
      {children}
    </div>
  );
}

/** A labelled figure in a list of figures. */
export function Line({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "green" | "terracotta";
}) {
  const toneClass =
    tone === "green" ? "text-green" : tone === "terracotta" ? "text-terracotta" : "";
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className="text-[13.5px] text-soft">{label}</dt>
      <dd
        className={`ledger text-end text-[14px] ${
          strong ? "font-semibold" : "font-medium"
        } ${toneClass}`}
      >
        {value}
      </dd>
    </div>
  );
}
