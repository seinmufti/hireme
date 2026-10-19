import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { headers } from "next/headers"
import { MobileGate } from "@/components/mobile-gate"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HireMe",
  description: "HireMe — the talent pool connecting employers and job seekers.",
}

const MOBILE_UA = /Android|iPhone|iPad|iPod|Mobile|BlackBerry|IEMobile|Opera Mini/i

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const isMobileDevice = MOBILE_UA.test((await headers()).get("user-agent") ?? "")

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        {isMobileDevice ? (
          <MobileGate />
        ) : (
          <>
            {/* Desktop-only: small windows get the gate too */}
            <MobileGate className="lg:hidden" />
            <div className="hidden min-h-dvh lg:flex lg:flex-col">
              <TooltipProvider>{children}</TooltipProvider>
              <Toaster position="bottom-right" theme="light" />
            </div>
          </>
        )}
      </body>
    </html>
  )
}
