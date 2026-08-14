"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  getDict,
  LOCALES,
  type Locale,
  type Translations,
} from "@/lib/i18n";
import { setLocale } from "@/app/locale-actions";

const LangContext = createContext<Locale>(DEFAULT_LOCALE);

export function LangProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return <LangContext.Provider value={locale}>{children}</LangContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LangContext);
}

export function useT(): Translations {
  return getDict(useContext(LangContext));
}

export function LangSwitcher() {
  const locale = useLocale();
  const [pending, start] = useTransition();

  const pick = (next: Locale) => {
    if (next === locale) return;
    start(() => {
      setLocale(next);
    });
  };

  return (
    <div
      dir="ltr"
      className={`flex shrink-0 rounded-full border border-border bg-card p-0.5 text-[11px] font-medium ${
        pending ? "opacity-70" : ""
      }`}
    >
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => pick(l.code)}
          aria-pressed={locale === l.code}
          aria-label={l.label}
          className={`whitespace-nowrap rounded-full px-2 py-1 transition-colors ${
            locale === l.code
              ? "bg-primary text-white"
              : "text-muted hover:bg-primary-soft"
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
