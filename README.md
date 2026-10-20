# HireMe

Desktop-only talent pool connecting **Job Seekers**, **Recruiters** and **Employers**.

- `/` sends you to `/login`, a demo sign-in screen: pick any account to continue. The header also has a quick account switcher.
- `/profile` is every signed-in account's profile.
- **Job Seeker** has no access to The Pool. They fill in their CV on their profile (that is what employers see in The Pool) and reply to employers in the Inbox. **Ready** saves it and opens `/profile/cv`, the A4 CV preview, where **Download PDF** prints exactly that page (choose "Save as PDF"). Every CV has a small HireMe logo at the bottom; free CVs would also get a watermark, but everyone is premium for now (`isPremium` in `src/lib/premium.ts`).
- **Employer** searches The Pool (`/pool`) with filters (each dropdown shows how many candidates each option would match), opens a candidate's CV (without contact details, address or references, and no download) and sends an editable template message.
- **Recruiter** can view The Pool (read-only for now).
- **Jobs** (`/jobs`, `/jobs?q=sales`): everyone can search open jobs by keyword (title, category, skills, description) and filter by category, location (city in Iraq, remote, international) and contract type. Job seekers see which jobs match their profile (`src/lib/matching.ts`). Applying is coming later.
- **Employers** post jobs (`/jobs/new`) and manage them (`/jobs/mine`: edit, close, reopen). Posting a job notifies every job seeker in The Pool it matches; they see it under the bell in the header.
- **Companies** (`/companies`, `/companies?q=erbil`): every employer's company, contact details and open jobs.

Phones and windows narrower than 1024px see a "Not available on mobile yet" screen.

Uploaded files (profile photos, scans of degrees, licenses and language certificates; images or PDFs up to 10 MB, images are shrunk first) are kept in the browser's IndexedDB (`src/lib/files.ts`); the app data only stores their ids. They are included in the Demo Download backup.

## Home and languages

- **Home** (`/home`) is the job seeker's landing page: *Overall* (total experience, languages, location) on the left, their CV summary with **Preview CV** and matching jobs in the middle, and *Actions* (notifications, quick links, the type of work they want) on the right.
- The app comes in **English, Arabic and Kurdish (Sorani)**. The language switcher is in the header (and on the login page). The choice is kept in the `hireme-locale` cookie, so the server renders the page in that language and sets `dir="rtl"` for Arabic and Kurdish.
- Even in right-to-left languages, the logo stays on the far left, stats stay on the left and actions on the right. Those panels set `dir="ltr"` on their container and the language's `dir` on each panel.

### Adding or changing text

1. Add the English text to `src/i18n/dictionaries/en.ts` under a section (e.g. `jobs: { title: "Jobs" }`). Use `{name}` for values filled in later.
2. Add the same key to `ar.ts` and `ckb.ts`. Anything left out falls back to English, so a page never breaks over a missing translation.
3. In a client component: `const t = useT()` (from `@/i18n/provider`), then `t("jobs.title")` or `t("home.greeting", { name })`. Keys are type-checked. For keys built at runtime, use `t.dynamic(key, fallback)`.
4. Use logical Tailwind classes (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `border-s`) instead of `ml-`, `pl-`, `left-`, `text-left` so layouts mirror in Arabic and Kurdish.

Data people type in (names, job titles) and the built-in option lists (job categories, languages, degree levels) aren't translated.

## Demo data

There is no backend. The demo data is built in (`src/data/demo.ts`), and everything a visitor changes is saved in **their own browser** (localStorage), so it never affects anyone else. The "Reset demo" button on the login page resets it.

To change the built-in data, edit `src/data/demo.ts` and bump `version` in `src/lib/store.ts` so returning visitors pick it up.

The login page has **Demo Download** (saves all accounts and data as a `.json` file) and **Upload backup** (restores it exactly). The file always uses the current data version (`src/lib/backup.ts`); older files are upgraded by `migrate` in `src/lib/store.ts`, so whenever you add or change a field, bump `version` and add a migration step.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) · Zustand (persisted to localStorage)

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

## Import from your CV (AI)

On their profile form, job seekers can upload an existing CV (PDF, Word .docx, plain text or a photo, up to 10 MB) and Claude fills in the form. Fields already filled in are only replaced when the job seeker ticks them; anything the AI wasn't sure about or couldn't find turns its section yellow.

It runs on the server (`src/app/api/cv-import/route.ts`), so it needs a Claude API key:

```bash
cp .env.example .env.local   # then set ANTHROPIC_API_KEY
```

Without a key, set `CV_IMPORT_MOCK=1` in `.env.local` to try it with a built-in sample CV.

## Saved data and testing

Everything a visitor saves lives in the browser's localStorage and goes through `src/lib/safe-storage.ts`: a save can never delete an account, portfolio, conversation or message that is already stored (anything a tab is missing is put back and a warning is logged), the previous data is kept as a backup, and only the ↺ reset button can replace everything, with an Undo.

Browser storage is per address, so run any testing on the separate copy of the app, which can't reach the data saved on port 3000:

```bash
npm run dev:test   # http://localhost:3001
```

The list of universities per country (`src/data/universities.json`) is built by `scripts/build-universities.mjs` from the open [university-domains-list](https://github.com/Hipo/university-domains-list) (MIT licence) plus a few Iraqi universities it lacks. Cities come from the `country-state-city` package, loaded only when a country other than Iraq is picked.
