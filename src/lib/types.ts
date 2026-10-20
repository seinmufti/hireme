import type { Role } from "@/lib/options"

export type User = {
  id: string
  name: string
  role: Role
  title: string // job seekers: their profession, shown under their name
  company: string
  avatarColor: string
  email: string
  phone: string
  city: string
  linkedin: string
  bio: string
  photoId: string // id of the profile photo in this browser's file store (lib/files.ts); "" = none
  country: string // ISO 3166 code, e.g. "IQ"
  address: string // street address; private, only on the job seeker's own CV
  createdAt: string
}

export type ProfileInput = Pick<
  User,
  "name" | "title" | "company" | "email" | "phone" | "city" | "linkedin" | "bio" | "photoId" | "country" | "address"
>

export type Reference = {
  name: string
  position: string
  phone: string
  email: string
}

export type Experience = {
  id: string
  title: string
  employer: string
  category: string
  contractType: string
  start: string // "YYYY-MM"
  end: string // "YYYY-MM"; empty while current is true
  current: boolean // still working there
  description: string // responsibilities and achievements, one bullet per line
  reference: Reference | null // optional; employers and the CV only see "Available on request"
}

export type Degree = {
  id: string
  level: string // an EDUCATION value, e.g. "Bachelor's"
  name: string // e.g. "BSc in Computer Science"
  field: string // field of study; from FIELDS_OF_STUDY or written by the job seeker
  institution: string // university, college or school
  country?: string // ISO code of the institution's country; "IQ" when missing
  status: string // a DEGREE_STATUSES value: "Graduated" or "Studying"
  startYear: string // "YYYY"
  endYear: string // "YYYY": graduation year, or the expected graduation year while studying
  attachmentIds: string[] // scans of the degree certificate (lib/files.ts)
}

export type Certification = {
  id: string
  title: string
  institution: string
  issued: string // "YYYY-MM"
  attachmentIds: string[] // scans of the license or certificate (lib/files.ts)
}

export type LanguageSkill = {
  language: string
  speaking: string // a LANGUAGE_LEVELS value, e.g. "C1"
  reading: string
  attachmentIds: string[] // optional language certificates, e.g. IELTS (lib/files.ts)
}

export type Project = {
  id: string
  name: string
  link: string // optional
  description: string
  start: string // "YYYY-MM" or ""
  end: string // "YYYY-MM" or ""
}

/** The kinds of work a job seeker is looking for. In their profile form and Pool filters, not on the CV. */
export type WorkPreference = {
  remote: boolean
  international: boolean
  iraqCities: string[] // cities in Iraq they would work in
}

// A job seeker's portfolio (their listing in The Pool). Name and contact details live on User.
export type TalentInput = {
  gender: string
  dateOfBirth: string // YYYY-MM-DD
  summary: string // "About me" on the CV
  degrees: Degree[]
  certifications: Certification[]
  languages: LanguageSkill[]
  experiences: Experience[]
  hardSkills: string[]
  softSkills: string[]
  projects: Project[]
  workPreference: WorkPreference
  published: boolean
}

export type Talent = TalentInput & {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
}

export type Conversation = {
  id: string
  employerId: string
  seekerId: string
  createdAt: string
  updatedAt: string
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  body: string
  readAt: string | null
  createdAt: string
}

/** Where a job is: on site in an Iraqi city, remote, or abroad (international). */
export type JobLocation = {
  remote: boolean
  international: boolean
  iraqCity: string // "" when remote or international
}

// A job posted by an employer. Job seekers search these and get notified about ones that match them.
export type Job = {
  id: string
  employerId: string
  title: string
  company: string // the employer's company when it was posted
  category: string // a JOB_CATEGORIES value, or written by the employer
  skills: string[]
  contractType: string // a CONTRACT_TYPES value
  location: JobLocation
  description: string
  createdAt: string
  updatedAt: string
  open: boolean // closed jobs stay listed for their employer only
}

export type JobInput = Pick<Job, "title" | "category" | "skills" | "contractType" | "location" | "description">

// "A new job matches your profile", sent to job seekers when an employer posts a job
export type Notification = {
  id: string
  userId: string
  jobId: string
  createdAt: string
  readAt: string | null
}

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

// A job seeker's application to a job. The employer sees their CV (without contact details) and the note.
export type Application = {
  id: string
  jobId: string
  seekerId: string
  note: string // optional message to the employer
  status: string // an APPLICATION_STATUSES value
  createdAt: string
  updatedAt: string
}
