# HireMe

Desktop-only talent pool connecting **Job Seekers**, **Recruiters** and **Employers**.

- `/` sends you to `/login`, a demo sign-in screen: pick any account to continue. The header also has a quick account switcher.
- `/profile` is every signed-in account's profile.
- **Job Seeker** has no access to The Pool. They fill in their portfolio on their profile (that is what employers see in The Pool) and reply to employers in the Inbox.
- **Employer** searches The Pool (`/pool`) with filters (each dropdown shows how many candidates each option would match) and sends an editable template message.
- **Recruiter** can view The Pool (read-only for now).

Phones and windows narrower than 1024px see a "Not available on mobile yet" screen.

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

## Saved data and testing

Everything a visitor saves lives in the browser's localStorage and goes through `src/lib/safe-storage.ts`: a save can never delete an account, portfolio, conversation or message that is already stored (anything a tab is missing is put back and a warning is logged), the previous data is kept as a backup, and only the ↺ reset button can replace everything, with an Undo.

Browser storage is per address, so run any testing on the separate copy of the app, which can't reach the data saved on port 3000:

```bash
npm run dev:test   # http://localhost:3001
```
