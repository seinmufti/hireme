import type { Application, Conversation, Job, Message, Notification, Salary, Talent, User } from "@/lib/types"

// The real version's stand-in for the demo's sample data (src/data/demo.ts and demo-jobs.ts), so the
// sample accounts, CVs and jobs aren't downloaded by people using the real HireMe. next.config.ts swaps
// it in for real builds; the demo build uses the real files.

export const CORE_USERS: User[] = []
export const CORE_TALENTS: Talent[] = []
export const EMPLOYER_USERS: User[] = []
export const DEMO_USERS: User[] = []
export const DEMO_TALENTS: Talent[] = []
export const DEMO_CONVERSATIONS: Conversation[] = []
export const DEMO_MESSAGES: Message[] = []
export const DEMO_EMPLOYER_USERS: User[] = []
export const DEMO_SALARIES: Record<string, Salary> = {}
export const DEMO_JOBS: Job[] = []
export const DEMO_NOTIFICATIONS: Notification[] = []
export const DEMO_APPLICATIONS: Application[] = []
