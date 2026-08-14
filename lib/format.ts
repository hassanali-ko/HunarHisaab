export function pkr(value: number, opts?: { decimals?: boolean }): string {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: opts?.decimals ? 2 : 0,
    maximumFractionDigits: opts?.decimals ? 2 : 0,
  }).format(Math.round(n * 100) / 100);
}

export function pkrLabel(value: number): string {
  return `PKR ${pkr(value)}`;
}

export function shortDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}
