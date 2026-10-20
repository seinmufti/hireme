import type { Application, Job, JobLocation, Notification, User } from "@/lib/types"

// Built-in demo companies (employer accounts) and the jobs they have posted.

const CREATED = "2026-10-01T09:00:00.000Z"

const employer = (id: string, name: string, title: string, company: string, color: string, city: string, phone: string, email: string, bio: string): User => ({
  id,
  name,
  role: "EMPLOYER",
  title,
  company,
  photoId: "",
  country: "IQ",
  address: "",
  avatarColor: color,
  email,
  phone,
  city,
  linkedin: "",
  bio,
  createdAt: CREATED,
})

export const DEMO_EMPLOYER_USERS: User[] = [
  employer("u-employer-nawroz", "Dilan Hama", "HR Manager", "Nawroz Telecom", "#0E7490", "Sulaymaniyah", "+964 770 120 3344", "careers@nawroz-telecom.example.com",
    "Mobile and internet provider serving the Kurdistan Region since 2008. Hiring engineers, sales and customer care teams."),
  employer("u-employer-tigris", "Omar Al-Jubouri", "Operations Director", "Tigris Logistics", "#B45309", "Baghdad", "+964 780 220 1188", "jobs@tigris-logistics.example.com",
    "Freight, warehousing and last-mile delivery across Iraq, with hubs in Baghdad, Basra and Erbil."),
  employer("u-employer-gulf", "Zainab Kadhim", "Talent Partner", "Basra Gulf Energy", "#334155", "Basra", "+964 781 330 4455", "talent@basragulf.example.com",
    "Oil and gas services company working on upstream projects in southern Iraq and the Gulf."),
  employer("u-employer-dilan", "Rebaz Othman", "Retail Operations Manager", "Dilan Retail Group", "#BE185D", "Erbil", "+964 750 440 9900", "hr@dilanretail.example.com",
    "Supermarkets and electronics stores in Erbil, Sulaymaniyah and Duhok. Always looking for sales talent."),
  employer("u-employer-shifa", "Dr. Nasreen Ali", "Medical Director", "Shifa Medical Center", "#4D7C0F", "Duhok", "+964 750 550 2211", "recruitment@shifa-medical.example.com",
    "Private hospital and outpatient clinics in Duhok and Zakho."),
]

const at = (day: number, hour = 9) => `2026-10-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`
const city = (iraqCity: string): JobLocation => ({ remote: false, international: false, iraqCity })
const REMOTE: JobLocation = { remote: true, international: false, iraqCity: "" }
const ABROAD: JobLocation = { remote: false, international: true, iraqCity: "" }

const COMPANY: Record<string, string> = {
  "u-employer": "Zagros Tech Solutions",
  ...Object.fromEntries(DEMO_EMPLOYER_USERS.map((u) => [u.id, u.company])),
}

const job = (
  id: string,
  employerId: string,
  day: number,
  title: string,
  category: string,
  contractType: string,
  location: JobLocation,
  skills: string[],
  description: string
): Job => ({
  id,
  employerId,
  title,
  company: COMPANY[employerId],
  category,
  skills,
  contractType,
  location,
  description,
  createdAt: at(day),
  updatedAt: at(day),
  open: true,
})

export const DEMO_JOBS: Job[] = [
  job("j-zagros-1", "u-employer", 18, "Senior Full-Stack Developer", "Information Technology", "Full-time", city("Erbil"),
    ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Teamwork"],
    "Build and run the web platforms we make for banks and retailers in the Kurdistan Region.\n- Design features end to end, from database to UI\n- Review code and mentor two junior developers\n- 4+ years building web applications"),
  job("j-zagros-2", "u-employer", 15, "Frontend Developer (Remote)", "Information Technology", "Full-time", REMOTE,
    ["JavaScript", "React", "HTML", "CSS", "Communication"],
    "Join our product team from anywhere in Iraq.\n- Turn designs into fast, accessible React screens\n- Work with designers and backend developers every day\n- 2+ years of React"),
  job("j-zagros-3", "u-employer", 9, "QA Intern", "Information Technology", "Internship", city("Erbil"),
    ["Attention to detail", "Communication", "Microsoft Excel"],
    "Three-month paid internship testing our web and mobile apps. Final-year students and fresh graduates are welcome."),
  job("j-nawroz-1", "u-employer-nawroz", 19, "Sales Representative", "Sales & Marketing", "Full-time", city("Sulaymaniyah"),
    ["Sales", "Negotiation", "Customer Service", "Communication"],
    "Sell mobile and home internet plans to businesses and households.\n- Meet monthly sales targets\n- Visit customers across Sulaymaniyah\n- Kurdish and Arabic required, English a plus"),
  job("j-nawroz-2", "u-employer-nawroz", 12, "Network Engineer", "Telecommunications", "Full-time", city("Sulaymaniyah"),
    ["Networking", "Cisco", "Linux", "Problem solving"],
    "Plan, configure and monitor our core and access network. CCNA or equivalent experience required."),
  job("j-nawroz-3", "u-employer-nawroz", 7, "Customer Care Agent", "Customer Service", "Part-time", city("Erbil"),
    ["Customer Service", "Communication", "Patience"],
    "Answer customer calls and chats in Kurdish and Arabic. Evening shifts available."),
  job("j-nawroz-4", "u-employer-nawroz", 3, "Digital Marketing Specialist", "Sales & Marketing", "Full-time", REMOTE,
    ["Digital Marketing", "Social Media", "Content Writing", "Google Ads"],
    "Run our social media and online ad campaigns and report on what works."),
  job("j-tigris-1", "u-employer-tigris", 17, "Logistics Coordinator", "Logistics & Supply Chain", "Full-time", city("Baghdad"),
    ["Logistics", "Microsoft Excel", "Planning", "Communication"],
    "Plan daily deliveries, track shipments and keep customers informed."),
  job("j-tigris-2", "u-employer-tigris", 11, "Warehouse Supervisor", "Logistics & Supply Chain", "Full-time", city("Basra"),
    ["Inventory Management", "Leadership", "Teamwork"],
    "Lead a team of 15 in our Basra warehouse. Forklift certificate is a plus."),
  job("j-tigris-3", "u-employer-tigris", 5, "B2B Sales Executive", "Sales & Marketing", "Full-time", city("Erbil"),
    ["Sales", "Negotiation", "CRM", "Presentation"],
    "Win new business customers for our freight and warehousing services in the north."),
  job("j-tigris-4", "u-employer-tigris", 2, "Accountant", "Finance & Accounting", "Full-time", city("Baghdad"),
    ["Accounting", "Microsoft Excel", "Financial Reporting"],
    "Keep the books, prepare monthly reports and work with our auditors. Bachelor's in Accounting required."),
  job("j-gulf-1", "u-employer-gulf", 16, "HSE Officer", "Oil & Gas", "Full-time", city("Basra"),
    ["Health and Safety", "Risk Assessment", "Reporting"],
    "Make sure our field sites follow health, safety and environment rules. NEBOSH preferred."),
  job("j-gulf-2", "u-employer-gulf", 10, "Petroleum Engineer", "Oil & Gas", "Full-time", ABROAD,
    ["Reservoir Engineering", "Problem solving", "Teamwork"],
    "Rotational role on projects in the UAE and Kuwait. 5+ years in upstream oil and gas."),
  job("j-gulf-3", "u-employer-gulf", 4, "Mechanical Engineer", "Engineering", "Full-time", city("Basra"),
    ["AutoCAD", "Maintenance", "Project Management"],
    "Maintain rotating equipment and plan shutdowns at our Basra facilities."),
  job("j-dilan-1", "u-employer-dilan", 20, "Store Sales Associate", "Sales & Marketing", "Full-time", city("Erbil"),
    ["Sales", "Customer Service", "Teamwork"],
    "Help customers in our electronics store find the right products. No experience needed; we train you."),
  job("j-dilan-2", "u-employer-dilan", 14, "Sales Team Leader", "Sales & Marketing", "Full-time", city("Duhok"),
    ["Sales", "Leadership", "Customer Service", "Microsoft Excel"],
    "Lead the sales team in our new Duhok store and hit monthly targets."),
  job("j-dilan-3", "u-employer-dilan", 8, "HR Officer", "Human Resources", "Full-time", city("Erbil"),
    ["Recruitment", "Communication", "Microsoft Office"],
    "Hire store staff, run onboarding and keep employee records."),
  job("j-dilan-4", "u-employer-dilan", 1, "Cashier", "Customer Service", "Part-time", city("Sulaymaniyah"),
    ["Customer Service", "Attention to detail"],
    "Morning or evening shifts at our Sulaymaniyah supermarket."),
  job("j-shifa-1", "u-employer-shifa", 13, "Registered Nurse", "Healthcare", "Full-time", city("Duhok"),
    ["Patient Care", "Teamwork", "Communication"],
    "Ward nurse for our internal medicine department. Rotating shifts."),
  job("j-shifa-2", "u-employer-shifa", 6, "Medical Receptionist", "Administration", "Full-time", city("Zakho"),
    ["Customer Service", "Microsoft Office", "Organization"],
    "Welcome patients, book appointments and manage records at our Zakho clinic."),
]

// The demo job seeker (Aram, a developer) has heard about the IT jobs that match him
export const DEMO_NOTIFICATIONS: Notification[] = ["j-zagros-1", "j-zagros-2"].map((jobId, i) => ({
  id: `n-demo-${i + 1}`,
  userId: "u-seeker",
  jobId,
  createdAt: DEMO_JOBS.find((j) => j.id === jobId)!.createdAt,
  readAt: null,
}))

// A few job seekers have applied to Zagros Tech's developer jobs, so the employer has applicants to look at
const application = (id: string, jobId: string, seekerId: string, day: number, status: string, note = ""): Application => ({
  id,
  jobId,
  seekerId,
  note,
  status,
  createdAt: at(day, 14),
  updatedAt: at(day, 14),
})

export const DEMO_APPLICATIONS: Application[] = [
  application("a-demo-1", "j-zagros-1", "u-seeker-48", 18, "Shortlisted", "I'd love to bring my React experience to Zagros Tech."),
  application("a-demo-2", "j-zagros-1", "u-seeker-02", 19, "Applied"),
  application("a-demo-3", "j-zagros-2", "u-seeker-21", 16, "Applied", "Remote work suits me well, and I'm keen to keep learning."),
]
