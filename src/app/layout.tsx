import type { Metadata } from "next"
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google"
import { headers } from "next/headers"
import { MobileGate } from "@/components/mobile-gate"
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

export const metadata: Metadata = {
  title: "HireMe",
  description: "HireMe — the talent pool connecting employers and job seekers.",
}

const MOBILE_UA = /Android|iPhone|iPad|iPod|Mobile|BlackBerry|IEMobile|Opera Mini/i

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const isMobileDevice = MOBILE_UA.test((await headers()).get("user-agent") ?? "")
  const locale = await getLocale()
  const dir = dirFor(locale)

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <I18nProvider locale={locale}>
          {isMobileDevice ? (
            <MobileGate />
          ) : (
            <>
              {/* Desktop-only: small windows get the gate too */}
              <MobileGate className="lg:hidden" />
              <div className="hidden min-h-dvh lg:flex lg:flex-col">
                <TooltipProvider>{children}</TooltipProvider>
                {/* Pop-ups always on the right, the actions side, in every language */}
                <Toaster position="bottom-right" theme="light" dir={dir} />
              </div>
            </>
          )}
        </I18nProvider>
      </body>
    </html>
  )
}
