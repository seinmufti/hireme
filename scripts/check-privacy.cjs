// Checks the real database's privacy rules with throwaway accounts, then deletes them.
// Run from the project folder: node scripts/check-privacy.cjs (needs the Supabase keys in .env.local)
const fs = require("fs")
const { createClient } = require(process.cwd() + "/node_modules/@supabase/supabase-js")
const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]))
const URL = env.NEXT_PUBLIC_SUPABASE_URL, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
const pw = "Test-" + Math.random().toString(36).slice(2) + "-x9"
const tag = Date.now()
const results = []
const check = (name, ok, detail = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  (" + detail + ")" : ""}`)

async function makeUser(label, meta) {
  const email = `hireme-test-${label}-${tag}@example.com`
  const { data, error } = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: meta })
  if (error) throw new Error(label + ": " + error.message)
  const client = createClient(URL, ANON, { auth: { persistSession: false } })
  const s = await client.auth.signInWithPassword({ email, password: pw })
  if (s.error) throw new Error(label + " sign-in: " + s.error.message)
  return { id: data.user.id, client }
}

;(async () => {
  const ids = []
  try {
    const A = await makeUser("seeker-a", { name: "Aram Mustafa Test", role: "SEEKER" }); ids.push(A.id)
    const B = await makeUser("seeker-b", { name: "Bana Test", role: "SEEKER" }); ids.push(B.id)
    const E = await makeUser("employer", { name: "Karwan Test", role: "EMPLOYER", company: "Test Co" }); ids.push(E.id)
    const anon = createClient(URL, ANON, { auth: { persistSession: false } })

    // A new employer waits for approval: no Pool, no job posts
    const early = await E.client.from("jobs").insert({ id: `j0-${tag}`, employer_id: E.id, data: { title: "Too early" } })
    check("an employer can't post jobs before HireMe approves them", !!early.error)
    const approve = await E.client.from("profiles").update({ approved: true }).eq("id", E.id)
    const selfApproved = (await admin.from("profiles").select("approved").eq("id", E.id).single()).data.approved
    check("an employer can't approve themselves", selfApproved === false, approve.error ? "refused" : "no error, but unchanged")
    await admin.from("profiles").update({ approved: true }).eq("id", E.id)

    // Sign-up created the profiles
    const prof = await admin.from("profiles").select("id, role, display_name, onboarded").in("id", ids)
    const pA = prof.data.find((p) => p.id === A.id), pE = prof.data.find((p) => p.id === E.id)
    check("sign-up creates the profile with the chosen role", pA?.role === "SEEKER" && pE?.role === "EMPLOYER" && pA.onboarded)
    check("job seekers are shown by first name only", pA?.display_name === "Aram", pA?.display_name)

    // A fills in contact details and a CV
    await A.client.from("profile_private").update({ phone: "+964 750 000 0000", address: "Secret Street" }).eq("id", A.id)
    const talent = await A.client.from("talents").insert({ id: `t-${tag}`, user_id: A.id, data: { id: `t-${tag}`, userId: A.id, summary: "hi", listed: true } })
    check("a job seeker can save their CV", !talent.error, talent.error?.message)

    const own = await A.client.from("profile_private").select("*").eq("id", A.id)
    check("a job seeker reads their own contact details", own.data?.length === 1 && own.data[0].phone === "+964 750 000 0000")
    const bReadsA = await B.client.from("profile_private").select("*").eq("id", A.id)
    check("another job seeker can't read them", bReadsA.data?.length === 0)
    const eReadsA = await E.client.from("profile_private").select("*").eq("id", A.id)
    check("an employer can't read a job seeker's contact details", eReadsA.data?.length === 0)
    const aReadsE = await A.client.from("profile_private").select("email").eq("id", E.id)
    check("a company's contact details are public", aReadsE.data?.length === 1)

    const bTalents = await B.client.from("talents").select("id").eq("user_id", A.id)
    check("another job seeker can't read a CV", bTalents.data?.length === 0)
    const U = await makeUser("employer-new", { name: "Unapproved Test", role: "EMPLOYER", company: "New Co" }); ids.push(U.id)
    const uTalents = await U.client.from("talents").select("id").eq("user_id", A.id)
    check("an employer HireMe hasn't approved can't read CVs", uTalents.data?.length === 0)
    const eTalents = await E.client.from("talents").select("id").eq("user_id", A.id)
    check("an employer can read a CV (the Pool)", eTalents.data?.length === 1)
    const anonTalents = await anon.from("talents").select("id")
    check("visitors can't read CVs", anonTalents.data?.length === 0)

    const promote = await A.client.from("profiles").update({ role: "RECRUITER" }).eq("id", A.id)
    const after = await admin.from("profiles").select("role").eq("id", A.id).single()
    check("nobody can make themselves a recruiter", after.data.role === "SEEKER", promote.error ? "refused" : "no error, but unchanged")
    const hijack = await B.client.from("profiles").update({ title: "hacked" }).eq("id", A.id)
    const titleA = await admin.from("profiles").select("title").eq("id", A.id).single()
    check("nobody can change another's profile", titleA.data.title !== "hacked")

    // Jobs and applications
    const job = await E.client.from("jobs").insert({ id: `j-${tag}`, employer_id: E.id, data: { id: `j-${tag}`, employerId: E.id, title: "Test job" } })
    check("an employer posts a job", !job.error, job.error?.message)
    const seekerJob = await A.client.from("jobs").insert({ id: `j2-${tag}`, employer_id: A.id, data: {} })
    check("a job seeker can't post a job", !!seekerJob.error)
    const anonJobs = await anon.from("jobs").select("id").eq("id", `j-${tag}`)
    check("visitors can see job listings", anonJobs.data?.length === 1)
    const bEditsJob = await B.client.from("jobs").update({ data: { title: "hacked" } }).eq("id", `j-${tag}`)
    const jobNow = await admin.from("jobs").select("data").eq("id", `j-${tag}`).single()
    check("nobody else can change a job", jobNow.data.data.title === "Test job")

    const app = await A.client.from("applications").insert({ id: `a-${tag}`, job_id: `j-${tag}`, seeker_id: A.id, data: { id: `a-${tag}`, status: "Applied" } })
    check("a job seeker applies", !app.error, app.error?.message)
    const eApps = await E.client.from("applications").select("id")
    check("the employer sees the application", eApps.data?.some((a) => a.id === `a-${tag}`))
    const bApps = await B.client.from("applications").select("id")
    check("another job seeker can't see it", bApps.data?.length === 0)
    const sneaky = await A.client.from("applications").update({ data: { id: `a-${tag}`, status: "Shortlisted" } }).eq("id", `a-${tag}`)
    let appNow = (await admin.from("applications").select("data").eq("id", `a-${tag}`).single()).data.data
    check("a job seeker can't shortlist themselves", appNow.status === "Applied", sneaky.error ? "refused" : "")
    const decide = await E.client.from("applications").update({ data: { ...appNow, status: "Shortlisted" } }).eq("id", `a-${tag}`)
    appNow = (await admin.from("applications").select("data").eq("id", `a-${tag}`).single()).data.data
    check("the employer sets the application's status", !decide.error && appNow.status === "Shortlisted", decide.error?.message)
    const reword = await E.client.from("applications").update({ data: { ...appNow, note: "edited by employer" } }).eq("id", `a-${tag}`)
    check("the employer can't rewrite the job seeker's note", !!reword.error)
    const pre = await A.client.from("applications").insert({ id: `a3-${tag}`, job_id: `j-${tag}`, seeker_id: A.id, data: { status: "Shortlisted" } })
    const preNow = (await admin.from("applications").select("data").eq("id", `a3-${tag}`).single()).data?.data
    check("a new application always starts as Applied", !pre.error && preNow?.status === "Applied", pre.error?.message)
    const fake = await B.client.from("applications").insert({ id: `a2-${tag}`, job_id: `j-${tag}`, seeker_id: A.id, data: {} })
    check("nobody can apply in someone else's name", !!fake.error)

    // Messages
    const conv = await E.client.from("conversations").insert({ id: `c-${tag}`, employer_id: E.id, seeker_id: A.id, data: { id: `c-${tag}` } })
    const msg = await E.client.from("messages").insert({ id: `m-${tag}`, conversation_id: `c-${tag}`, sender_id: E.id, data: { body: "hello" } })
    check("an employer messages a job seeker", !conv.error && !msg.error, conv.error?.message || msg.error?.message)
    const spoof = await E.client.from("messages").insert({ id: `m2-${tag}`, conversation_id: `c-${tag}`, sender_id: E.id, data: { body: "hi", senderId: A.id } })
    const spoofed = (await admin.from("messages").select("data").eq("id", `m2-${tag}`).single()).data?.data
    check("a message can't pretend to come from someone else", !spoof.error && spoofed?.senderId === E.id, spoof.error?.message)
    const rewrite = await A.client.from("messages").update({ data: { body: "changed", readAt: null } }).eq("id", `m-${tag}`)
    const bodyNow = (await admin.from("messages").select("data").eq("id", `m-${tag}`).single()).data.data.body
    check("nobody can rewrite someone else's message", bodyNow === "hello", rewrite.error ? "refused" : "")
    const msgRow = (await admin.from("messages").select("data").eq("id", `m-${tag}`).single()).data.data
    const read = await A.client.from("messages").update({ data: { ...msgRow, readAt: new Date().toISOString() } }).eq("id", `m-${tag}`)
    check("the recipient marks a message read", !read.error, read.error?.message)
    const aMsgs = await A.client.from("messages").select("id")
    const bMsgs = await B.client.from("messages").select("id")
    check("nobody else can read it", bMsgs.data?.length === 0)
    check("the job seeker has both messages", aMsgs.data?.length === 2)
    const bConv = await B.client.from("conversations").select("id")
    check("nobody else sees the conversation", bConv.data?.length === 0)

    // Notifications
    const notify = await E.client.from("notifications").insert({ id: `n-${tag}`, user_id: A.id, job_id: `j-${tag}`, data: {} })
    check("an employer can notify a job seeker about their own job", !notify.error, notify.error?.message)
    const spam = await B.client.from("notifications").insert({ id: `n2-${tag}`, user_id: A.id, job_id: `j-${tag}`, data: {} })
    check("others can't send notifications", !!spam.error)
    const bNotes = await B.client.from("notifications").select("id")
    check("notifications are private", bNotes.data?.length === 0)

    // References (the private part of a CV)
    const refs = await A.client.from("cv_private").upsert({ id: A.id, data: { references: { e1: { name: "Ref Person", phone: "+964 770 000 0000" } } } })
    check("a job seeker saves their references", !refs.error, refs.error?.message)
    const ownRefs = await A.client.from("cv_private").select("data").eq("id", A.id)
    check("a job seeker reads their own references", ownRefs.data?.[0]?.data?.references?.e1?.name === "Ref Person")
    const eRefs = await E.client.from("cv_private").select("data").eq("id", A.id)
    check("an employer can't read a job seeker's references", eRefs.data?.length === 0)
    const bRefs = await B.client.from("cv_private").upsert({ id: A.id, data: {} })
    const refsNow = await admin.from("cv_private").select("data").eq("id", A.id).single()
    check("nobody can change another's references", !!bRefs.error && refsNow.data.data.references?.e1?.name === "Ref Person")

    // Files
    const file =await A.client.storage.from("files").upload(`${A.id}/x/photo.txt`, new Blob(["hi"], { type: "text/plain" }))
    check("a user uploads to their own folder", !file.error, file.error?.message)
    const intoOthers = await B.client.storage.from("files").upload(`${A.id}/y/evil.txt`, new Blob(["x"], { type: "text/plain" }))
    check("nobody uploads into another's folder", !!intoOthers.error)
    const bReads = await B.client.storage.from("files").download(`${A.id}/x/photo.txt`)
    check("another job seeker can't open a job seeker's files", !!bReads.error)
    const bLists = await B.client.storage.from("files").list(A.id)
    check("another job seeker can't list a job seeker's files", (bLists.data ?? []).length === 0)
    const eReads = await E.client.storage.from("files").download(`${A.id}/x/photo.txt`)
    check("an approved employer opens a job seeker's CV files", !eReads.error, eReads.error?.message)
    const uReads = await U.client.storage.from("files").download(`${A.id}/x/photo.txt`)
    check("an unapproved employer can't open them", !!uReads.error)
    await E.client.storage.from("files").upload(`${E.id}/x/logo.txt`, new Blob(["logo"], { type: "text/plain" }))
    const logo = await A.client.storage.from("files").download(`${E.id}/x/logo.txt`)
    check("anyone signed in opens a company's files (logos)", !logo.error, logo.error?.message)
    await admin.storage.from("files").remove([`${A.id}/x/photo.txt`, `${E.id}/x/logo.txt`])

    // AI limits
    const tries = []
    for (let i = 0; i < 3; i++) tries.push((await A.client.rpc("take_ai_credit", { kind: `test-${tag}`, daily_limit: 2 })).data)
    check("AI features stop at the daily limit", tries.join(",") === "true,true,false", tries.join(","))
  } catch (e) {
    results.push("ERROR  " + e.message)
  } finally {
    for (const id of ids) await admin.auth.admin.deleteUser(id)
    console.log(results.join("\n"))
    console.log(`\n${results.filter((r) => r.startsWith("PASS")).length} passed, ${results.filter((r) => !r.startsWith("PASS")).length} failed. Test accounts deleted.`)
  }
})()
