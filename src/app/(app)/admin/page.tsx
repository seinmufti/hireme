"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IS_DEMO } from "@/lib/mode"

// Real version, admins only: every account and its role. Giving someone the recruiter role, approving
// employers (before that they can't see the Pool or post jobs) and giving job seekers Premium happen here.
// (Not translated: it's for HireMe's own staff.)

type Account = { id: string; role: string; name: string; email: string; company: string; approved: boolean; premiumUntil: string | null; createdAt: string }

export default function AdminPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

  useEffect(() => {
    if (IS_DEMO) return
    fetch(`${base}/api/admin/users`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setAccounts(data.users)
      })
      .catch((e) => setError(e.message || "Couldn't load the accounts."))
  }, [base])

  const change = async (account: Account, update: { role: string } | { approved: boolean } | { premium: boolean }, done: string) => {
    const res = await fetch(`${base}/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: account.id, ...update }),
    })
    const data = await res.json()
    if (!res.ok) return toast.error(data.error ?? "Couldn't change that.")
    const patch: Partial<Account> = "premium" in update ? { premiumUntil: data.premiumUntil ?? null } : { ...update, ...("role" in update && { approved: true }) }
    setAccounts((list) => list?.map((a) => (a.id === account.id ? { ...a, ...patch } : a)) ?? null)
    toast.success(`${account.name || account.email} ${done}`)
  }
  const setRole = (account: Account, role: string) => change(account, { role }, `is now ${role.toLowerCase()}`)
  const approve = (account: Account, approved: boolean) => change(account, { approved }, approved ? "is approved" : "is no longer approved")
  const givePremium = (account: Account, premium: boolean) => change(account, { premium }, premium ? "has Premium for a year" : "no longer has Premium")
  const hasPremium = (a: Account) => !!a.premiumUntil && new Date(a.premiumUntil) > new Date()
  const waiting = accounts?.filter((a) => a.role === "EMPLOYER" && !a.approved).length ?? 0

  if (IS_DEMO) return <p className="text-sm text-muted-foreground">The demo has no admin page.</p>
  if (error) return <p className="text-sm text-muted-foreground">{error}</p>
  if (!accounts) return <p className="text-sm text-muted-foreground">Loading…</p>

  const q = query.trim().toLowerCase()
  // Employers waiting for approval first
  const shown = accounts
    .filter((a) => !q || `${a.name} ${a.email} ${a.company}`.toLowerCase().includes(q))
    .sort((a, b) => Number(b.role === "EMPLOYER" && !b.approved) - Number(a.role === "EMPLOYER" && !a.approved))

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">{accounts.length} accounts{waiting > 0 && ` · ${waiting} waiting for approval`} · approve employers, give the recruiter role and Premium here</p>
        </div>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or company" className="h-9 w-full sm:w-72" />
      </div>
      <ul className="divide-y rounded-xl border bg-card">
        {shown.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{a.name || "—"}</p>
              <p className="truncate text-sm text-muted-foreground">{[a.email, a.company].filter(Boolean).join(" · ")}</p>
            </div>
            {/* Premium: a year from when it's given (people contact HireMe for it) */}
            {a.role === "SEEKER" && (
              <Button variant={hasPremium(a) ? "outline" : "secondary"} size="sm" onClick={() => givePremium(a, !hasPremium(a))}>
                {hasPremium(a)
                  ? `Premium until ${new Date(a.premiumUntil!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · remove`
                  : "Give Premium"}
              </Button>
            )}
            {a.role === "EMPLOYER" && (
              <Button variant={a.approved ? "outline" : "default"} size="sm" onClick={() => approve(a, !a.approved)}>
                {a.approved ? "Approved · undo" : "Approve"}
              </Button>
            )}
            <select
              value={a.role}
              onChange={(e) => setRole(a, e.target.value)}
              className="h-9 rounded-lg border bg-background px-2 text-sm"
              aria-label={`Role of ${a.name || a.email}`}
            >
              <option value="SEEKER">Job seeker</option>
              <option value="EMPLOYER">Employer</option>
              <option value="RECRUITER">Recruiter</option>
            </select>
          </li>
        ))}
      </ul>
    </div>
  )
}
