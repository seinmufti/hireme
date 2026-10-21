"use client"

import { useState } from "react"
import { LoaderCircleIcon, LogOutIcon } from "lucide-react"
import { toast } from "sonner"
import { WithBrand } from "@/components/brand-name"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useT } from "@/i18n/provider"
import { reloadRealData, useBackend } from "@/lib/real-sync"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

/** Real version without its Supabase project yet: say so, and point to the demo. */
export function NotSetUp() {
  const t = useT()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <Logo size={64} />
      <h1 className="text-2xl font-semibold">
        <WithBrand text={t("auth.notSetUpTitle")} />
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">{t("auth.notSetUpBody")}</p>
      <a href="/hireme/demo" className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        {t("auth.openDemo")}
      </a>
    </main>
  )
}

/** After a Google sign-up: job seeker or employer (once; recruiter is given by the admin). */
export function ChooseRole() {
  const t = useT()
  const [role, setRole] = useState<"SEEKER" | "EMPLOYER">("SEEKER")
  const [company, setCompany] = useState("")
  const [busy, setBusy] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const db = supabase()
    const user = (await db?.auth.getUser())?.data.user
    if (!db || !user) return
    setBusy(true)
    const { error } = await db
      .from("profiles")
      .update({ role, onboarded: true, ...(role === "EMPLOYER" && { company: company.trim() }) })
      .eq("id", user.id)
    if (!error && role === "SEEKER") {
      // Job seekers are shown to others by first name only
      const { data } = await db.from("profile_private").select("full_name").eq("id", user.id).single()
      await db.from("profiles").update({ display_name: (data?.full_name ?? "").split(" ")[0] }).eq("id", user.id)
    }
    setBusy(false)
    if (error) return toast.error(t("auth.failed"))
    await reloadRealData()
  }

  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-12">
      <Logo size={56} />
      <h1 className="mt-3 text-center text-xl font-semibold">{t("auth.chooseRole")}</h1>
      <form onSubmit={save} className="mt-6 w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {(["SEEKER", "EMPLOYER"] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              onClick={() => setRole(r)}
              className={cn("h-11 rounded-lg border text-sm", role === r ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              {r === "SEEKER" ? t("auth.seeker") : t("auth.employer")}
            </button>
          ))}
        </div>
        {role === "EMPLOYER" && (
          <div className="space-y-1.5">
            <Label>{t("auth.company")}</Label>
            <Input required value={company} onChange={(e) => setCompany(e.target.value)} className="h-10" />
          </div>
        )}
        <Button type="submit" className="h-10 w-full" disabled={busy}>
          {busy && <LoaderCircleIcon className="animate-spin" />} {t("auth.continue")}
        </Button>
      </form>
      <SignOutButton className="mt-4" />
    </main>
  )
}

/** Signs out of the real version (back to browsing as a visitor). */
export function SignOutButton({ className }: { className?: string }) {
  const t = useT()
  const email = useBackend((s) => s.email)
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      title={email}
      aria-label={t("auth.signOut")}
      onClick={async () => {
        await supabase()?.auth.signOut()
        window.location.assign(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`)
      }}
    >
      <LogOutIcon /> <span className="hidden lg:inline">{t("auth.signOut")}</span>
    </Button>
  )
}
