import type { Role } from "@/lib/options"

export type User = {
  id: string
  name: string
  role: Role
  title: string
  company: string
  avatarColor: string
  email: string
  phone: string
  city: string
  linkedin: string
  bio: string
  createdAt: string
}

export type ProfileInput = Pick<User, "name" | "title" | "company" | "email" | "phone" | "city" | "linkedin" | "bio">

export type Experience = {
  id: string
  title: string
  employer: string
  category: string
  contractType: string
  start: string // "YYYY-MM"
  end: string // "YYYY-MM"; empty while current is true
  current: boolean // still working there
}

export type Degree = {
  id: string
  level: string // an EDUCATION value, e.g. "Bachelor's"
  name: string // e.g. "BSc in Computer Science"
  field: string // field of study; from FIELDS_OF_STUDY or written by the job seeker
  institution: string // university, college or school
  status: string // a DEGREE_STATUSES value: "Graduated" or "Studying"
  startYear: string // "YYYY"
  endYear: string // "YYYY": graduation year, or the expected graduation year while studying
}

export type Certification = {
  id: string
  title: string
  institution: string
  issued: string // "YYYY-MM"
}

export type LanguageSkill = {
  language: string
  speaking: string // a LANGUAGE_LEVELS value, e.g. "C1"
  reading: string
}

// A job seeker's portfolio (their listing in The Pool). Name and contact details live on User.
export type TalentInput = {
  gender: string
  dateOfBirth: string // YYYY-MM-DD
  degrees: Degree[]
  certifications: Certification[]
  languages: LanguageSkill[]
  experiences: Experience[]
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

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }
