import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  isLocale,
  isTheme,
  LOCALE_COOKIE,
  THEME_COOKIE,
  type Locale,
  type Theme,
} from "./i18n";

/** Reads language and appearance from cookies so the first paint is right. */
export async function readPrefs(): Promise<{ locale: Locale; theme: Theme }> {
  const jar = await cookies();
  const locale = jar.get(LOCALE_COOKIE)?.value;
  const theme = jar.get(THEME_COOKIE)?.value;
  return {
    locale: isLocale(locale) ? locale : DEFAULT_LOCALE,
    theme: isTheme(theme) ? theme : "system",
  };
}
