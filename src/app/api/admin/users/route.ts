import { adminSupabase, isAdminEmail, serverSupabase } from "@/lib/supabase/server"

// Real version, admins only (ADMIN_EMAILS): every account with its role, changing a role (e.g. giving
// someone the recruiter role) and approving employers. Uses the service role key, which never reaches the browser.

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
    db.from("profiles").select("id, role, display_name, company, approved, created_at").order("created_at", { ascending: false }),
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
      createdAt: p.created_at,
    })),
  })
}

export async function POST(request: Request) {
  const db = await admin()
  if (!db) return fail(403, "Only HireMe admins can change roles.")
  const body = await request.json().catch(() => null)
  if (typeof body?.userId !== "string") return fail(400, "Choose an account.")
  // A new role, or approving (or un-approving) an employer. Giving a role approves the account.
  const change =
    ROLES.includes(body?.role) ? { role: body.role, onboarded: true, approved: true }
    : typeof body?.approved === "boolean" ? { approved: body.approved }
    : null
  if (!change) return fail(400, "Choose a role, or approve the account.")
  const { error } = await db.from("profiles").update(change).eq("id", body.userId)
  if (error) return fail(500, "Couldn't change that.")
  return Response.json({ ok: true })
}
