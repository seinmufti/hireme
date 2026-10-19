import { MonitorIcon } from "lucide-react"
import { Logo } from "@/components/logo"

export function MobileGate({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
        <Logo size={72} />
        <MonitorIcon className="size-10 text-primary" />
        <h1 className="text-2xl font-semibold">Not available on mobile yet</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          HireMe is built for desktop. Please open it on a computer with a screen at least 1024px wide.
        </p>
      </div>
    </div>
  )
}
