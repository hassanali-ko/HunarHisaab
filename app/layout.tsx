import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/components/lang";
import { getLocale } from "@/lib/locale-server";
import { LOCALES, localeDir } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "HunarHisaab",
  description:
    "Turn messy WhatsApp orders from home-based workers into fair prices, organised records, and a confirmed order history.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const dir = localeDir(locale);
  const htmlLang =
    LOCALES.find((l) => l.code === locale)?.htmlLang ?? "en";

  return (
    <html
      lang={htmlLang}
      dir={dir}
      data-locale={locale}
      className={`${geistSans.variable} ${geistMono.variable} ${nastaliq.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <LangProvider locale={locale}>{children}</LangProvider>
      </body>
    </html>
  );
}
