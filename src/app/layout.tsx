import type { Metadata } from "next"
import { Geist, Geist_Mono, Lato, Noto_Sans_Arabic } from "next/font/google"
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
// The CV is set in Lato
const cvText = Lato({ variable: "--font-cv", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] })

export const metadata: Metadata = {
  title: "HireMe",
  description: "HireMe — the talent pool connecting employers and job seekers.",
}

/** The app is laid out for windows at least this wide; narrower ones (down to 640px) get it scaled down to fit. */
const DESIGN_WIDTH = 1024
// Runs before the page is drawn (no jump), and again whenever the window is resized
const FIT_TO_WINDOW = `(() => {
  const fit = () => {
    const w = window.innerWidth
    // Sizes are in rem, so a smaller root font size shrinks the whole layout (CSS zoom would misplace pop-ups)
    document.documentElement.style.fontSize = w >= 640 && w < ${DESIGN_WIDTH} ? (16 * w) / ${DESIGN_WIDTH} + "px" : ""
  }
  fit()
  window.addEventListener("resize", fit)
})()`

const MOBILE_UA = /Android|iPhone|iPad|iPod|Mobile|BlackBerry|IEMobile|Opera Mini/i

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const isMobileDevice = MOBILE_UA.test((await headers()).get("user-agent") ?? "")
  const locale = await getLocale()
  const dir = dirFor(locale)

  return (
    <html
      lang={locale}
      dir={dir}
      // FIT_TO_WINDOW sets the font size before React loads
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoArabic.variable} ${cvText.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: FIT_TO_WINDOW }} />
        <I18nProvider locale={locale}>
          {isMobileDevice ? (
            <MobileGate />
          ) : (
            <>
              {/* Desktop-only: very small windows (under 640px) get the gate too */}
              <MobileGate className="sm:hidden" />
              <div className="hidden min-h-dvh sm:flex sm:flex-col">
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
