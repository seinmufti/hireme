"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"
import { toast } from "sonner"
import { WithBrand } from "@/components/brand-name"
import { NotSetUp } from "@/components/real-screens"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useT } from "@/i18n/provider"
import { BACKEND_READY, BASE_PATH, GOOGLE_SIGN_IN } from "@/lib/mode"
import { homeFor } from "@/lib/options"
import { startRealSync, useBackend } from "@/lib/real-sync"
import { useCurrentUser } from "@/lib/store"
import { supabase } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Mode = "signIn" | "signUp" | "forgot"

/** Where Google sends people back to. */
const callback = (next = "/login") => `${window.location.origin}${BASE_PATH}/auth/callback?next=${encodeURIComponent(next)}`
/** Where the links in HireMe's emails go (confirm your account, reset your password): the email adds its token. */
const emailLink = (next = "/login") => `${window.location.origin}${BASE_PATH}/auth/confirm?next=${encodeURIComponent(next)}`

/** Real version: sign in, create an account (job seeker or employer), forgot password, or Google. */
export function RealLoginView() {
  const t = useT()
  const router = useRouter()
  const status = useBackend((s) => s.status)
  const user = useCurrentUser()
  const [mode, setMode] = useState<Mode>("signIn")
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "SEEKER" as "SEEKER" | "EMPLOYER", company: "", title: "" })
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))

  useEffect(() => startRealSync(), [])

  // Already signed in (or just signed in): on to their home page
  useEffect(() => {
    if (status === "signedIn" && user && user.role !== "GUEST") router.replace(homeFor(user.role))
  }, [status, user, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const db = supabase()
    if (!db) return
    setBusy(true)
    try {
      if (mode === "signIn") {
        const { error } = await db.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
        if (error) toast.error(/confirm/i.test(error.message) ? t("auth.notConfirmed") : t("auth.wrongLogin"))
      } else if (mode === "signUp") {
        if (form.password.length < 8) return toast.error(t("auth.passwordShort"))
        const { data, error } = await db.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: emailLink(),
            data: { name: form.name.trim(), role: form.role, company: form.company.trim(), title: form.title.trim() },
          },
        })
        if (error) toast.error(error.message || t("auth.failed"))
        // With email confirmation on, there's no session until they click the link
        else if (!data.session) toast.success(t("auth.checkEmail"), { duration: 10000 })
      } else {
        await db.auth.resetPasswordForEmail(form.email.trim(), { redirectTo: emailLink("/reset-password") })
        toast.success(t("auth.linkSent"), { duration: 10000 })
        setMode("signIn")
      }
    } catch {
      toast.error(t("auth.failed"))
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    const { error } = (await supabase()?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } })) ?? {}
    if (error) toast.error(t("auth.failed"))
  }

  if (!BACKEND_READY) return <NotSetUp />

  const title = mode === "signIn" ? t("auth.signInTitle") : mode === "signUp" ? t("auth.signUpTitle") : t("auth.forgotTitle")

  return (
    <main className="relative flex min-h-dvh flex-col items-center px-4 py-8">
      <div dir="ltr" className="mb-6 flex w-full max-w-sm justify-end md:absolute md:top-5 md:right-8 md:mb-0 md:w-auto">
        <LanguageSwitcher wide />
      </div>
      <Logo size={56} />
      <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight">
        <WithBrand text={title} />
      </h1>

      <form onSubmit={submit} className="mt-6 w-full max-w-sm space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        {GOOGLE_SIGN_IN && mode !== "forgot" && (
          <>
            <Button type="button" variant="outline" className="h-10 w-full" onClick={google}>
              <GoogleIcon /> {t("auth.google")}
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> {t("auth.or")} <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        {mode === "signUp" && (
          <>
            <div className="space-y-1.5">
              <Label>{t("auth.iAm")}</Label>
              <div className="grid grid-cols-2 gap-2" role="radiogroup">
                {(["SEEKER", "EMPLOYER"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={form.role === r}
                    onClick={() => setForm((f) => ({ ...f, role: r }))}
                    className={cn("h-10 rounded-lg border text-sm", form.role === r ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
                  >
                    {r === "SEEKER" ? t("auth.seeker") : t("auth.employer")}
                  </button>
                ))}
              </div>
            </div>
            <Field label={t("auth.fullName")}>
              <Input required autoComplete="name" value={form.name} onChange={set("name")} className="h-10" />
            </Field>
            {form.role === "EMPLOYER" && (
              <>
                <Field label={t("auth.company")}>
                  <Input required autoComplete="organization" value={form.company} onChange={set("company")} className="h-10" />
                </Field>
                <Field label={t("auth.jobTitle")}>
                  <Input autoComplete="organization-title" value={form.title} onChange={set("title")} className="h-10" />
                </Field>
              </>
            )}
          </>
        )}

        <Field label={t("auth.email")}>
          <Input required type="email" autoComplete="email" value={form.email} onChange={set("email")} className="h-10" />
        </Field>
        {mode !== "forgot" && (
          <Field
            label={t("auth.password")}
            aside={
              mode === "signIn" && (
                <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary hover:underline">
                  {t("auth.forgot")}
                </button>
              )
            }
          >
            <Input
              required
              type="password"
              autoComplete={mode === "signUp" ? "new-password" : "current-password"}
              minLength={mode === "signUp" ? 8 : undefined}
              value={form.password}
              onChange={set("password")}
              className="h-10"
            />
          </Field>
        )}

        <Button type="submit" className="h-10 w-full" disabled={busy}>
          {busy && <LoaderCircleIcon className="animate-spin" />}
          {mode === "signIn" ? t("auth.signIn") : mode === "signUp" ? t("auth.signUp") : t("auth.sendLink")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signIn" ? (
            <>
              {t("auth.noAccount")}{" "}
              <button type="button" onClick={() => setMode("signUp")} className="font-medium text-primary hover:underline">
                {t("auth.signUp")}
              </button>
            </>
          ) : mode === "signUp" ? (
            <>
              {t("auth.haveAccount")}{" "}
              <button type="button" onClick={() => setMode("signIn")} className="font-medium text-primary hover:underline">
                {t("auth.signIn")}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setMode("signIn")} className="font-medium text-primary hover:underline">
              {t("auth.backToSignIn")}
            </button>
          )}
        </p>
      </form>
    </main>
  )
}

function Field({ label, aside, children }: { label: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {aside}
      </div>
      {children}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  )
}
