import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Lato, Noto_Sans_Arabic } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { dirFor } from "@/i18n/locales"
import { I18nProvider } from "@/i18n/provider"
import { getLocale } from "@/i18n/server"
import "./globals.css"

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
// Arabic and Kurdish (Sorani) text; Latin text keeps Geist
const notoArabic = Noto_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic"] })
// The CV is set in Lato
const cvText = Lato({ variable: "--font-cv", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] })

export const metadata: Metadata = {
  title: "HireMe",
  description: "HireMe — the talent pool connecting employers and job seekers.",
}

// Phones: content may run under the notch and home bar; the tab bar keeps clear of them (safe-area insets)
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" }

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale()
  const dir = dirFor(locale)

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} ${cvText.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <I18nProvider locale={locale}>
          <div className="flex min-h-dvh flex-col">
            <TooltipProvider>{children}</TooltipProvider>
            {/* Pop-ups always on the right, the actions side, in every language; on phones above the tab bar */}
            <Toaster position="bottom-right" theme="light" dir={dir} mobileOffset={{ bottom: "5.5rem" }} />
          </div>
        </I18nProvider>
      </body>
    </html>
  )
}
