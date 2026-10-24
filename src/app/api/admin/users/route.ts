import { adminSupabase, isAdminEmail, serverSupabase } from "@/lib/supabase/server"

// Real version, admins only (ADMIN_EMAILS): every account with its role, changing a role (e.g. giving
// someone the recruiter role), approving employers and giving HireMe Premium (for a year). Uses the service role key, which never reaches the browser.

const ROLES = ["SEEKER", "EMPLOYER", "RECRUITER"]
const fail = (status: number, error: string) => Response.json({ error }, { status })

async function admin() {
  const me = (await (await serverSupabase())?.auth.getUser())?.data.user
  if (!me || !isAdminEmail(me.email)) return null
  return adminSupabase()
}

export async function GET() {
  const db = await admin()
  if (!db) return fail(403, "Only HireMe admins can open this page.")
  const [profiles, privates] = await Promise.all([
    db.from("profiles").select("id, role, display_name, company, approved, premium_until, created_at").order("created_at", { ascending: false }),
    db.from("profile_private").select("id, full_name, email"),
  ])
  if (profiles.error || privates.error) return fail(500, "Couldn't load the accounts.")
  const priv = new Map(privates.data.map((p) => [p.id, p]))
  return Response.json({
    users: profiles.data.map((p) => ({
      id: p.id,
      role: p.role,
      name: priv.get(p.id)?.full_name || p.display_name,
      email: priv.get(p.id)?.email ?? "",
      company: p.company,
      approved: p.approved,
      premiumUntil: p.premium_until,
      createdAt: p.created_at,
    })),
  })
}

export async function POST(request: Request) {
  const db = await admin()
  if (!db) return fail(403, "Only HireMe admins can change roles.")
  const body = await request.json().catch(() => null)
  if (typeof body?.userId !== "string") return fail(400, "Choose an account.")
  // A new role, approving (or un-approving) an employer, or Premium for a year (or ending it). Giving a role
  // approves the account.
  const yearFromNow = () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  const change =
    ROLES.includes(body?.role) ? { role: body.role, onboarded: true, approved: true }
    : typeof body?.approved === "boolean" ? { approved: body.approved }
    : typeof body?.premium === "boolean" ? { premium_until: body.premium ? yearFromNow() : null }
    : null
  if (!change) return fail(400, "Choose a role, approve the account or change Premium.")
  const { error } = await db.from("profiles").update(change).eq("id", body.userId)
  if (error) return fail(500, "Couldn't change that.")
  return Response.json({ ok: true, ...("premium_until" in change && { premiumUntil: change.premium_until }) })
}
