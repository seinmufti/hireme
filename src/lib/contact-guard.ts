// Employers must never see a job seeker's contact details; they reach out through HireMe messages.
// This catches contact details typed into portfolio text, which employers do see.

const hasPhoneNumber = (text: string) =>
  // 9+ digits in one run (separators allowed), so years like "2019-2024" don't count
  (text.match(/\+?\d[\d\s().-]{6,}\d/g) ?? []).some((run) => run.replace(/\D/g, "").length >= 9)

const CHECKS: [(text: string) => boolean, string][] = [
  [(t) => /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(t), "an email address"],
  [(t) => /(https?:\/\/|www\.)\S+|\b[\w-]+\.(com|net|org|me|iq|krd)\b/i.test(t), "a link"],
  [hasPhoneNumber, "a phone number"],
  // Messaging apps and @handles; not social networks, which are also legitimate skills ("Instagram marketing")
  [(t) => /\b(whats\s?app|telegram|viber)\b|(^|\s)@\w{3,}/i.test(t), "a messaging account"],
]

/** Returns what kind of contact detail the text contains, or null if none. */
export function findContactDetail(text: string) {
  return CHECKS.find(([check]) => check(text))?.[1] ?? null
}
