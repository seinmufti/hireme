// The accounts most recently signed in to, newest first. A per-browser convenience for the header
// switcher, kept apart from the app data so it never affects backups or resets.

const KEY = "hireme-recent-logins"
const KEEP = 20

export function recentLogins(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(list) ? list.filter((x) => typeof x === "string") : []
  } catch {
    return []
  }
}

export function rememberLogin(userId: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([userId, ...recentLogins().filter((id) => id !== userId)].slice(0, KEEP)))
  } catch {}
}
