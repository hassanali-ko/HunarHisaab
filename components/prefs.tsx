"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  getDict,
  LOCALES,
  type Dict,
  type Locale,
  type Theme,
} from "@/lib/i18n";
import { setLocale, setTheme } from "@/app/prefs-actions";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);
const ThemeContext = createContext<Theme>("system");

export function Prefs({
  locale,
  theme,
  children,
}: {
  locale: Locale;
  theme: Theme;
  children: ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </LocaleContext.Provider>
  );
}

export const useLocale = (): Locale => useContext(LocaleContext);
export const useTheme = (): Theme => useContext(ThemeContext);
export const useT = (): Dict => getDict(useContext(LocaleContext));

export function LangSwitcher({ className = "" }: { className?: string }) {
  const current = useLocale();
  const [pending, start] = useTransition();

  return (
    <div
      dir="ltr"
      className={`flex shrink-0 rounded-full border border-rule bg-raised p-0.5 text-[11px] font-medium ${
        pending ? "opacity-60" : ""
      } ${className}`}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => {
            if (l.code !== current) start(() => void setLocale(l.code));
          }}
          aria-pressed={current === l.code}
          aria-label={l.label}
          className={`whitespace-nowrap rounded-full px-2 py-1 transition-colors ${
            current === l.code
              ? "bg-green text-on-green"
              : "text-soft hover:bg-green-wash"
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

export function ThemeSwitcher({ labels }: { labels: [string, string, string] }) {
  const current = useTheme();
  const [pending, start] = useTransition();
  const options: [Theme, string][] = [
    ["system", labels[0]],
    ["light", labels[1]],
    ["dark", labels[2]],
  ];

  return (
    <div
      className={`flex rounded-xl border border-rule bg-raised p-1 text-[13px] font-medium ${
        pending ? "opacity-60" : ""
      }`}
      role="group"
    >
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            if (value !== current) start(() => void setTheme(value));
          }}
          aria-pressed={current === value}
          className={`flex-1 rounded-lg px-3 py-1.5 transition-colors ${
            current === value ? "bg-green text-on-green" : "text-soft hover:bg-green-wash"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
