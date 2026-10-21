"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"
import { toast } from "sonner"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useT } from "@/i18n/provider"
import { supabase } from "@/lib/supabase/client"

// Real version: opened from the password reset email (already signed in by the link). Sets a new password.
export default function ResetPasswordPage() {
  const t = useT()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return toast.error(t("auth.passwordShort"))
    setBusy(true)
    const { error } = (await supabase()?.auth.updateUser({ password })) ?? { error: new Error() }
    setBusy(false)
    if (error) return toast.error(t("auth.failed"))
    toast.success(t("auth.passwordSaved"))
    router.replace("/login")
  }

  return (
    <main className="flex min-h-dvh flex-col items-center px-4 py-12">
      <Logo size={56} />
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t("auth.resetTitle")}</h1>
      <form onSubmit={submit} className="mt-6 w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-1.5">
          <Label>{t("auth.newPassword")}</Label>
          <Input required type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
        </div>
        <Button type="submit" className="h-10 w-full" disabled={busy}>
          {busy && <LoaderCircleIcon className="animate-spin" />} {t("auth.savePassword")}
        </Button>
      </form>
    </main>
  )
}
