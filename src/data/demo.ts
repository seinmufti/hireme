import type { Conversation, Message, Talent, User } from "@/lib/types"
import { DEMO_EMPLOYER_USERS } from "./demo-jobs"
import { DEMO_SEEKER_TALENTS, DEMO_SEEKER_USERS } from "./demo-seekers"

// Built-in demo data: one account per role. Every visitor starts from this;
// their own changes are kept in their browser only (see lib/store.ts).

const CREATED = "2026-10-01T09:00:00.000Z"

const CORE_USERS: User[] = [
  {
    id: "u-seeker",
    name: "Aram Mustafa",
    role: "SEEKER",
    title: "",
    company: "",
    avatarColor: "#1D4ED8",
    email: "aram.mustafa@example.com",
    phone: "+964 750 000 0103",
    city: "Erbil",
    linkedin: "https://www.linkedin.com/in/example",
    bio: "",
    createdAt: CREATED,
  },
  {
    id: "u-recruiter",
    name: "Shilan Rasul",
    role: "RECRUITER",
    title: "Senior Recruiter",
    company: "HireMe",
    avatarColor: "#047857",
    email: "shilan.rasul@example.com",
    phone: "+964 750 000 0102",
    city: "Erbil",
    linkedin: "",
    bio: "Recruiter at HireMe, matching talent with employers across the Kurdistan Region.",
    createdAt: CREATED,
  },
  {
    id: "u-employer",
    name: "Karwan Aziz",
    role: "EMPLOYER",
    title: "Talent Acquisition Manager",
    company: "Zagros Tech Solutions",
    avatarColor: "#8A1538",
    email: "karwan.aziz@example.com",
    phone: "+964 750 000 0101",
    city: "Erbil",
    linkedin: "",
    bio: "Hiring engineers and product people for Zagros Tech Solutions.",
    createdAt: CREATED,
  },
]

// The three main demo accounts, the other demo companies (see demo-jobs.ts), then the generated job seekers (see demo-seekers.ts)
export const DEMO_USERS: User[] = [...CORE_USERS, ...DEMO_EMPLOYER_USERS, ...DEMO_SEEKER_USERS]

const CORE_TALENTS: Talent[] = [
  {
    id: "t-aram",
    userId: "u-seeker",
    gender: "Male",
    dateOfBirth: "1997-04-12",
    degrees: [
      {
        id: "d-aram-1",
        level: "Bachelor's",
        name: "BSc in Computer Science",
        field: "Computer Science",
        institution: "Salahaddin University-Erbil",
        status: "Graduated",
        startYear: "2015",
        endYear: "2019",
      },
    ],
    certifications: [
      { id: "c-aram-1", title: "AWS Certified Cloud Practitioner", institution: "Amazon Web Services", issued: "2023-06" },
    ],
    languages: [
      { language: "Kurdish", speaking: "Native", reading: "Native" },
      { language: "Arabic", speaking: "B2", reading: "B1" },
      { language: "English", speaking: "C1", reading: "C1" },
    ],
    experiences: [
      { id: "x-aram-1", title: "Full-Stack Developer", employer: "Hawler Software House", category: "Information Technology", contractType: "Full-time", start: "2022-03", end: "2024-09", current: false },
      { id: "x-aram-2", title: "Junior Web Developer", employer: "Sulav Digital", category: "Information Technology", contractType: "Full-time", start: "2020-07", end: "2022-03", current: false },
    ],
    published: true,
    createdAt: CREATED,
    updatedAt: CREATED,
  },
]

export const DEMO_TALENTS: Talent[] = [...CORE_TALENTS, ...DEMO_SEEKER_TALENTS]

export const DEMO_CONVERSATIONS: Conversation[] = []
export const DEMO_MESSAGES: Message[] = []
