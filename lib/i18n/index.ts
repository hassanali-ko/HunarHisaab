import { en, type Dict } from "./en";
import { roman } from "./roman";
import { urdu } from "./urdu";

export type Locale = "roman" | "urdu" | "en";
export type { Dict };

export const LOCALES: {
  code: Locale;
  label: string;
  short: string;
  dir: "ltr" | "rtl";
  htmlLang: string;
}[] = [
  { code: "roman", label: "Roman Urdu", short: "Roman", dir: "ltr", htmlLang: "ur-Latn" },
  { code: "urdu", label: "اردو", short: "اردو", dir: "rtl", htmlLang: "ur" },
  { code: "en", label: "English", short: "Eng", dir: "ltr", htmlLang: "en" },
];

export const LOCALE_COOKIE = "hh_lang";
export const THEME_COOKIE = "hh_theme";
export const DEFAULT_LOCALE: Locale = "roman";

export type Theme = "system" | "light" | "dark";

export const isLocale = (v: unknown): v is Locale =>
  v === "roman" || v === "urdu" || v === "en";

export const isTheme = (v: unknown): v is Theme =>
  v === "system" || v === "light" || v === "dark";

export const localeDir = (locale: Locale): "ltr" | "rtl" =>
  locale === "urdu" ? "rtl" : "ltr";

const DICTS: Record<Locale, Dict> = { roman, urdu, en };

export const getDict = (locale: Locale): Dict => DICTS[locale] ?? DICTS[DEFAULT_LOCALE];

/** Greeting that matches the time of day where she is. */
export function greeting(d: Dict, hour = new Date().getHours()): string {
  if (hour < 12) return d.greetingMorning;
  if (hour < 17) return d.greetingAfternoon;
  return d.greetingEvening;
}
