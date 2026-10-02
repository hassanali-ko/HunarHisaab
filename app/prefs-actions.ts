"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  isLocale,
  isTheme,
  LOCALE_COOKIE,
  THEME_COOKIE,
  type Locale,
  type Theme,
} from "@/lib/i18n";

const YEAR = 60 * 60 * 24 * 365;

/** Language and appearance are cookies, so the server renders them correctly
 *  on the very first paint with no flash of the wrong thing. */
export async function setLocale(next: Locale) {
  if (!isLocale(next)) return;
  (await cookies()).set(LOCALE_COOKIE, next, {
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function setTheme(next: Theme) {
  if (!isTheme(next)) return;
  (await cookies()).set(THEME_COOKIE, next, {
    path: "/",
    maxAge: YEAR,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
