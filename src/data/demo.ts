import { professionFrom, withTalentDefaults, withUserDefaults, type LegacyTalent } from "@/lib/normalize"
import type { Conversation, Message, Talent, User } from "@/lib/types"
import { DEMO_EMPLOYER_USERS } from "./demo-jobs"
import { DEMO_SEEKER_TALENTS, DEMO_SEEKER_USERS } from "./demo-seekers"

// Built-in demo data: one account per role. Every visitor starts from this;
// their own changes are kept in their browser only (see lib/store.ts).

const CREATED = "2026-10-01T09:00:00.000Z"

// One account per role, and the guest. Reset demo brings back only these (see resetDemo in lib/store.ts).
export const CORE_USERS: User[] = [
  {
    id: "u-seeker",
    name: "Aram Mustafa",
    role: "SEEKER",
    title: "Full-Stack Developer",
    company: "",
    avatarColor: "#1D4ED8",
    email: "aram.mustafa@example.com",
    phone: "+964 750 000 0103",
    city: "Erbil",
    linkedin: "https://www.linkedin.com/in/example",
    bio: "",
    photoId: "",
    country: "IQ",
    address: "100m Street, Ankawa",
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
    photoId: "",
    country: "IQ",
    address: "",
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
    photoId: "",
    country: "IQ",
    address: "",
    createdAt: CREATED,
  },
  // The only guest: anyone browsing without an account
  {
    id: "u-guest",
    name: "Guest",
    role: "GUEST",
    title: "",
    company: "",
    avatarColor: "#64748B",
    email: "",
    phone: "",
    city: "",
    linkedin: "",
    bio: "",
    photoId: "",
    country: "",
    address: "",
    createdAt: CREATED,
  },
]

export const CORE_TALENTS: Talent[] = [
  {
    id: "t-aram",
    userId: "u-seeker",
    gender: "Male",
    dateOfBirth: "1997-04-12",
    summary:
      "Full-stack developer with 4+ years of experience building web applications for clients across the Kurdistan Region. Comfortable owning features end to end, from database design to polished interfaces.",
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
        attachmentIds: [],
      },
    ],
    certifications: [
      { id: "c-aram-1", title: "AWS Certified Cloud Practitioner", institution: "Amazon Web Services", issued: "2023-06", attachmentIds: [] },
    ],
    languages: [
      { language: "Kurdish", speaking: "Native", reading: "Native", attachmentIds: [] },
      { language: "Arabic", speaking: "B2", reading: "B1", attachmentIds: [] },
      { language: "English", speaking: "C1", reading: "C1", attachmentIds: [] },
    ],
    experiences: [
      {
        id: "x-aram-1",
        title: "Full-Stack Developer",
        employer: "Hawler Software House",
        category: "Information Technology",
        contractType: "Full-time",
        start: "2022-03",
        end: "2024-09",
        current: false,
        description: [
          "Built a booking platform used by 40+ clinics in Erbil, cutting phone bookings by 60%",
          "Led the move from PHP to React and Node.js, halving page load times",
          "Mentored two junior developers through code reviews and pair programming",
        ].join("\n"),
        reference: { name: "Dilshad Omar", position: "CTO, Hawler Software House", phone: "+964 750 111 2233", email: "dilshad.omar@example.com" },
      },
      {
        id: "x-aram-2",
        title: "Junior Web Developer",
        employer: "Sulav Digital",
        category: "Information Technology",
        contractType: "Full-time",
        start: "2020-07",
        end: "2022-03",
        current: false,
        description: [
          "Delivered 15+ responsive websites for local businesses on time and on budget",
          "Set up automated backups and monitoring for client servers",
        ].join("\n"),
        reference: null,
      },
    ],
    hardSkills: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Cloud computing (AWS / Azure)"],
    softSkills: ["Problem solving", "Teamwork", "Mentoring", "Communication"],
    projects: [
      {
        id: "p-aram-1",
        name: "Erbil Bus Times",
        link: "https://github.com/example/erbil-bus",
        description: "Open-source app showing live bus arrival times in Erbil.",
        start: "2023-01",
        end: "2023-06",
      },
      { id: "p-aram-2", name: "Volunteer coding club", link: "", description: "Taught weekly web development classes to high-school students.", start: "2021-09", end: "" },
    ],
    workPreference: { remote: true, international: false, iraqCities: ["Erbil", "Sulaymaniyah"] },
    published: true,
    createdAt: CREATED,
    updatedAt: CREATED,
  },
]

// The generated job seekers get CV details that fit their background (profession, skills, a summary,
// what they did in each job), so the CV pages and job matching have something to show.
const CATEGORY_CV: Record<string, { hard: string[]; does: string[] }> = {
  Administration: { hard: ["Microsoft Office", "Data entry", "Report writing"], does: ["Organised schedules, files and correspondence for a busy office", "Introduced a digital filing system that made documents easier to find"] },
  Construction: { hard: ["AutoCAD", "Project management", "HSE (health & safety)", "Quality control"], does: ["Supervised site work and subcontractors to keep projects on schedule", "Kept the site free of lost-time accidents through daily safety checks"] },
  "Customer Service": { hard: ["Customer service", "CRM software", "Data entry"], does: ["Handled 60+ customer calls and messages a day", "Raised customer satisfaction scores by resolving complaints on first contact"] },
  Engineering: { hard: ["AutoCAD", "Project management", "Quality control"], does: ["Prepared designs and technical drawings for client projects", "Reduced material waste by reviewing specifications before purchase"] },
  "Finance & Accounting": { hard: ["Accounting", "Microsoft Excel", "Financial analysis", "Budgeting"], does: ["Prepared monthly financial statements and reconciliations", "Cut month-end closing time by automating reports in Excel"] },
  Healthcare: { hard: ["Nursing", "First aid", "Laboratory skills"], does: ["Cared for patients and kept accurate medical records", "Trained new staff on hygiene and infection-control procedures"] },
  "Information Technology": { hard: ["IT support", "Networking", "Web development", "SQL"], does: ["Supported 100+ users with hardware, software and network issues", "Built internal tools that saved the team hours every week"] },
  "Logistics & Supply Chain": { hard: ["Logistics", "Inventory management", "Procurement"], does: ["Coordinated shipments and stock levels across warehouses", "Lowered delivery delays by planning routes and supplier orders ahead"] },
  "NGO & Humanitarian": { hard: ["Project management", "Report writing", "Data analysis"], does: ["Coordinated aid distribution for displaced families", "Wrote donor reports and tracked project indicators"] },
  "Oil & Gas": { hard: ["HSE (health & safety)", "Quality control", "Mechanical engineering"], does: ["Monitored field operations and equipment performance", "Helped keep operations compliant with HSE standards"] },
  "Sales & Marketing": { hard: ["Sales", "Digital marketing", "Social media marketing", "CRM software"], does: ["Grew a client portfolio and consistently met monthly sales targets", "Ran social media campaigns that increased enquiries"] },
}
const SOFT = ["Communication", "Teamwork", "Time management", "Problem solving", "Attention to detail", "Adaptability", "Customer focus", "Leadership"]

function withCvDetails(t: LegacyTalent, i: number): LegacyTalent {
  const latest = t.experiences[0]
  const cv = latest ? CATEGORY_CV[latest.category] : undefined
  return {
    ...t,
    summary: latest
      ? `${latest.title} with experience at ${latest.employer}. Reliable, eager to learn and looking for my next challenge.`
      : "Recent graduate looking for a first role where I can learn quickly and contribute to the team.",
    hardSkills: cv?.hard ?? ["Microsoft Office"],
    softSkills: [SOFT[i % SOFT.length], SOFT[(i + 3) % SOFT.length], SOFT[(i + 5) % SOFT.length]],
    experiences: t.experiences.map((e) => ({ ...e, description: CATEGORY_CV[e.category]?.does.join("\n") ?? "" })),
    workPreference: { remote: i % 4 === 0, international: i % 5 === 0, iraqCities: [] },
  }
}

const SEEKER_USERS = DEMO_SEEKER_USERS.map(withUserDefaults)
// Profession: the latest job title, or "<field> graduate" for people without work experience yet
const professionOf = (userId: string) => professionFrom(DEMO_SEEKER_TALENTS.find((t) => t.userId === userId))

// The other demo companies (see demo-jobs.ts)
export const EMPLOYER_USERS = DEMO_EMPLOYER_USERS.map(withUserDefaults)

// The three main demo accounts, the other demo companies, then the generated job seekers (see demo-seekers.ts)
export const DEMO_USERS: User[] = [
  ...CORE_USERS,
  ...EMPLOYER_USERS,
  ...SEEKER_USERS.map((u) => ({ ...u, title: u.title || professionOf(u.id) })),
]

export const DEMO_TALENTS: Talent[] = [
  ...CORE_TALENTS,
  ...DEMO_SEEKER_TALENTS.map((t, i) => {
    const full = withTalentDefaults(withCvDetails(t, i))
    const city = SEEKER_USERS.find((u) => u.id === t.userId)?.city
    return { ...full, workPreference: { ...full.workPreference, iraqCities: city ? [city] : [] } }
  }),
]

export const DEMO_CONVERSATIONS: Conversation[] = []
export const DEMO_MESSAGES: Message[] = []
