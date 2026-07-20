import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Cairo } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_DIR,
  isLocale,
  type Locale,
} from "@/lib/i18n/config";
import { LocaleProvider } from "@/lib/i18n/provider";
import { createTranslator } from "@/lib/i18n/translate";

const geistSans = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

// Read on the server so <html lang/dir> is correct on the first paint.
async function readLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocale();
  const t = createTranslator(locale, "common");
  return {
    title: t("appName"),
    description: t("appDescription"),
    icons: {
      icon: "/billinglogo.png",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await readLocale();

  return (
    <html
      lang={locale}
      dir={LOCALE_DIR[locale]}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
        <Toaster />
      </body>
    </html>
  );
}
