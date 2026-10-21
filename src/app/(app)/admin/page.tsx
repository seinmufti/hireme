"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { IS_DEMO } from "@/lib/mode"

// Real version, admins only: every account, and its role. Giving someone the recruiter role happens here.
// (Not translated: it's for HireMe's own staff.)

type Account = { id: string; role: string; name: string; email: string; company: string; createdAt: string }

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

  const setRole = async (account: Account, role: string) => {
    const res = await fetch(`${base}/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: account.id, role }),
    })
    if (!res.ok) return toast.error((await res.json()).error ?? "Couldn't change the role.")
    setAccounts((list) => list?.map((a) => (a.id === account.id ? { ...a, role } : a)) ?? null)
    toast.success(`${account.name || account.email} is now ${role.toLowerCase()}`)
  }

  if (IS_DEMO) return <p className="text-sm text-muted-foreground">The demo has no admin page.</p>
  if (error) return <p className="text-sm text-muted-foreground">{error}</p>
  if (!accounts) return <p className="text-sm text-muted-foreground">Loading…</p>

  const q = query.trim().toLowerCase()
  const shown = accounts.filter((a) => !q || `${a.name} ${a.email} ${a.company}`.toLowerCase().includes(q))

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-sm text-muted-foreground">{accounts.length} accounts · give or take away the recruiter role here</p>
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
