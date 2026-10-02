import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { Prefs } from "@/components/prefs";
import { LOCALES, localeDir } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// A ledger is set in a serif. Fraunces has the warmth to stop that reading
// as corporate, and its optical sizing holds up at headline weight.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  weight: ["400"],
  display: "swap",
});

/** An unset variable arrives as an empty string, which is not a URL. */
function siteUrl(): URL {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  try {
    return new URL(raw || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "HunarHisaab",
    template: "%s · HunarHisaab",
  },
  description:
    "Read a WhatsApp order, price the work properly with your own hours counted, and keep a record your customer confirmed. Open source, and it needs no AI key.",
  applicationName: "HunarHisaab",
  openGraph: {
    title: "HunarHisaab",
    description:
      "Price your work properly and keep a record your customer confirmed.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#11150f" },
  ],
};


export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, theme } = await readPrefs();
  const dir = localeDir(locale);
  const htmlLang = LOCALES.find((l) => l.code === locale)?.htmlLang ?? "en";

  return (
    <html
      lang={htmlLang}
      dir={dir}
      data-locale={locale}
      {...(theme === "system" ? {} : { "data-theme": theme })}
      className={`${inter.variable} ${fraunces.variable} ${nastaliq.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-green focus:px-4 focus:py-2 focus:text-on-green"
        >
          Skip to content
        </a>
        <Prefs locale={locale} theme={theme}>
          {children}
        </Prefs>
      </body>
    </html>
  );
}
