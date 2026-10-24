"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon, KeyRoundIcon, LoaderCircleIcon, MailIcon } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useT } from "@/i18n/provider"
import { BASE_PATH, IS_DEMO } from "@/lib/mode"
import { useStore } from "@/lib/store"
import { supabase } from "@/lib/supabase/client"
import { useRoleGuard } from "@/lib/use-role-guard"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// The confirmation links in the email-change emails go through HireMe's own address, then back here
const emailLink = (next: string) => `${window.location.origin}${BASE_PATH}/auth/confirm?next=${encodeURIComponent(next)}`

// The sign-in details of the account: the email it signs in with and the password. (The email and phone
// shown on the CV are edited with the CV, and can differ.) The demo has no sign-in, so there the email is
// only saved and passwords can't be set.
export function AccountView() {
  const user = useRoleGuard()
  const t = useT()
  const setLoginEmail = useStore((s) => s.setLoginEmail)

  // Real version: the address they sign in with, from their session
  const [signInEmail, setSignInEmail] = useState<string | null>(null)
  useEffect(() => {
    if (IS_DEMO) return
    supabase()
      ?.auth.getUser()
      .then(({ data }) => setSignInEmail(data.user?.email ?? ""))
  }, [])
  // Separate from the email on the CV (until changed here, the demo's is the one the account was made with)
  const currentEmail = IS_DEMO ? (user?.loginEmail ?? user?.email ?? "") : (signInEmail ?? "")

  const [email, setEmail] = useState("")
  const [savingEmail, setSavingEmail] = useState(false)
  const [current, setCurrent] = useState("")
  const [password, setPassword] = useState("")
  const [repeat, setRepeat] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)
  if (!user) return null

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    const next = email.trim()
    if (!EMAIL_PATTERN.test(next)) return toast.error(t("account.badEmail"))
    if (next.toLowerCase() === currentEmail.toLowerCase()) return toast.error(t("account.sameEmail"))
    setSavingEmail(true)
    try {
      if (IS_DEMO) {
        setLoginEmail(next)
        toast.success(t("account.emailSaved"))
      } else {
        // Supabase sends a link to the new address; it changes once that's opened, and the old address gets a notice
        const { error } = (await supabase()?.auth.updateUser({ email: next }, { emailRedirectTo: emailLink("/account") })) ?? { error: new Error() }
        if (error) return toast.error(error.message || t("auth.failed"))
        toast.success(t("account.emailCheck", { email: next }), { duration: 10000 })
      }
      setEmail("")
    } finally {
      setSavingEmail(false)
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return toast.error(t("auth.passwordShort"))
    if (password !== repeat) return toast.error(t("account.passwordsDiffer"))
    const db = supabase()
    if (!db) return toast.error(t("auth.failed"))
    setSavingPassword(true)
    try {
      // The current password first, so someone at an unlocked computer can't change it
      const check = await db.auth.signInWithPassword({ email: currentEmail, password: current })
      if (check.error) return toast.error(t("account.wrongPassword"))
      const { error } = await db.auth.updateUser({ password })
      if (error) return toast.error(error.message || t("auth.failed"))
      toast.success(t("account.passwordSaved"))
      setCurrent("")
      setPassword("")
      setRepeat("")
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={user.role === "SEEKER" ? "/overview" : "/profile"} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeftIcon className="rtl:rotate-180" /> {t("account.back")}
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">{t("account.title")}</h1>
      </div>

      <form onSubmit={changeEmail} className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <h2 className="flex items-center gap-2 font-medium">
            <MailIcon className="size-4 text-muted-foreground" /> {t("account.emailTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("account.emailHint")}</p>
        </div>
        <div className="space-y-1.5">
          <Label>{t("account.currentEmail")}</Label>
          <p className="text-sm font-medium">{currentEmail || "—"}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-email">{t("account.newEmail")}</Label>
          <Input id="new-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="h-10" />
        </div>
        <Button type="submit" disabled={savingEmail}>
          {savingEmail && <LoaderCircleIcon className="animate-spin" />} {t("account.saveEmail")}
        </Button>
      </form>

      <form onSubmit={changePassword} className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <h2 className="flex items-center gap-2 font-medium">
            <KeyRoundIcon className="size-4 text-muted-foreground" /> {t("account.passwordTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{IS_DEMO ? t("account.demoNoPassword") : t("account.passwordHint")}</p>
        </div>
        <fieldset disabled={IS_DEMO} className="space-y-4 disabled:opacity-60">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">{t("account.currentPassword")}</Label>
            <Input id="current-password" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className="h-10" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
              <Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="repeat-password">{t("account.repeatPassword")}</Label>
              <Input id="repeat-password" type="password" autoComplete="new-password" minLength={8} required value={repeat} onChange={(e) => setRepeat(e.target.value)} className="h-10" />
            </div>
          </div>
          <Button type="submit" disabled={savingPassword}>
            {savingPassword && <LoaderCircleIcon className="animate-spin" />} {t("auth.savePassword")}
          </Button>
        </fieldset>
      </form>
    </div>
  )
}
