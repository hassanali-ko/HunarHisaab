/** Money and date formatting. Amounts always read as figures, never prose. */

export function pkr(value: number, decimals = false): string {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(Math.round(n * 100) / 100);
}

export const rs = (value: number): string => `Rs ${pkr(value)}`;

/** Compact form for tight spaces: Rs 1.2L, Rs 48k. */
export function rsShort(value: number): string {
  const n = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (n >= 100000) return `${sign}Rs ${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L`;
  if (n >= 10000) return `${sign}Rs ${Math.round(n / 1000)}k`;
  return `${sign}Rs ${pkr(n)}`;
}

export function shortDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

export function longDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Whole days from today. Negative means the date has passed. */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  const a = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86400000);
}
