// Shared option lists for the portfolio form and the Pool filters.

export const ROLES = ["EMPLOYER", "RECRUITER", "SEEKER"] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABEL: Record<Role, string> = {
  EMPLOYER: "Employer",
  RECRUITER: "Recruiter",
  SEEKER: "Job Seeker",
}

export const GENDERS = ["Male", "Female"]

export const CONTRACT_TYPES = ["Full-time", "Part-time", "Internship"]

// Job categories for previous jobs; people can also write their own
export const JOB_CATEGORIES = [
  "Information Technology",
  "Engineering",
  "Oil & Gas",
  "Construction",
  "Telecommunications",
  "Finance & Accounting",
  "Sales & Marketing",
  "Customer Service",
  "Administration",
  "Human Resources",
  "Healthcare",
  "Education & Teaching",
  "Hospitality & Tourism",
  "Logistics & Supply Chain",
  "NGO & Humanitarian",
  "Legal",
]

export const EDUCATION = [
  "High school",
  "Diploma",
  "Bachelor's",
  "Master's",
  "PhD",
]

// Languages for the portfolio: the languages of Iraq first, then the world's most widely spoken ones
// Shown first, in their own section, wherever languages are picked
export const MAIN_LANGUAGES = ["English", "Kurdish", "Arabic", "Turkish"]

export const IRAQI_LANGUAGES = ["Kurdish","Arabic","Turkmen","Assyrian (Neo-Aramaic)","Armenian","Persian","Shabaki","Domari","Mandaic"]

export const LANGUAGES = [
  ...IRAQI_LANGUAGES,
  ...["English","Mandarin Chinese","Hindi","Spanish","French","Bengali","Portuguese","Russian","Urdu","Indonesian","German","Japanese","Swahili","Marathi","Telugu","Turkish","Tamil","Vietnamese","Korean","Italian","Thai","Gujarati","Polish","Ukrainian","Malay","Punjabi","Pashto","Tagalog","Dutch","Greek","Hebrew","Swedish","Romanian","Hungarian","Czech","Azerbaijani","Kazakh","Uzbek","Malayalam","Kannada","Sinhala","Nepali","Amharic","Hausa","Somali","Yoruba","Zulu","Afrikaans"].filter((l) => !IRAQI_LANGUAGES.includes(l)),
]

// CEFR levels, plus Native; strongest first
export const LANGUAGE_LEVELS = [
  { value: "Native", label: "Native" },
  { value: "C2", label: "C2 · Proficient" },
  { value: "C1", label: "C1 · Advanced" },
  { value: "B2", label: "B2 · Upper intermediate" },
  { value: "B1", label: "B1 · Intermediate" },
  { value: "A2", label: "A2 · Elementary" },
  { value: "A1", label: "A1 · Beginner" },
]

// Total experience, summed from a job seeker's previous jobs
export const EXPERIENCE_BUCKETS = [
  { value: "0-2", label: "Under 3 years", min: 0, max: 2 },
  { value: "3-5", label: "3–5 years", min: 3, max: 5 },
  { value: "6-10", label: "6–10 years", min: 6, max: 10 },
  { value: "10+", label: "Over 10 years", min: 11, max: Infinity },
]

export const AGE_BUCKETS = [
  { value: "18-24", label: "18–24", min: 0, max: 24 },
  { value: "25-34", label: "25–34", min: 25, max: 34 },
  { value: "35-44", label: "35–44", min: 35, max: 44 },
  { value: "45+", label: "45+", min: 45, max: Infinity },
]

/** Where each role lands after signing in: job seekers on Home (their dashboard), everyone else in The Pool. */
export const homeFor = (role: Role) => (role === "SEEKER" ? "/home" : "/pool")

// New accounts get the next color from this list automatically
export const AVATAR_COLORS = ["#1D4ED8", "#047857", "#8A1538", "#B45309", "#7C3AED", "#0E7490", "#BE185D", "#4D7C0F", "#334155"]

export const DEGREE_STATUSES = ["Graduated", "Studying"]

// Fields of study for degrees, grouped; people can also write their own
export const FIELD_GROUPS: Record<string, string[]> = {
  "Health and medicine": [
    "Medicine",
    "Dentistry",
    "Pharmacy",
    "Nursing",
    "Midwifery",
    "Clinical Laboratory Sciences",
    "Medical Laboratory Technology",
    "Radiology and Medical Imaging",
    "Physiotherapy",
    "Public Health",
    "Optometry",
    "Veterinary Medicine",
    "Anesthesia Technology",
    "Nutrition and Dietetics",
    "Health Administration"
  ],
  "Sciences": [
    "Biology",
    "Biotechnology",
    "Microbiology",
    "Biochemistry",
    "Chemistry",
    "Physics",
    "Geology",
    "Environmental Science",
    "Mathematics",
    "Statistics",
    "Food Science"
  ],
  "Engineering and technology": [
    "Computer Science",
    "Information Technology",
    "Software Engineering",
    "Data Science",
    "Cybersecurity",
    "Civil Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Petroleum Engineering",
    "Chemical Engineering",
    "Architecture",
    "Surveying",
    "Communications Engineering"
  ],
  "Business and law": [
    "Business Administration",
    "Accounting and Finance",
    "Banking",
    "Economics",
    "Marketing",
    "Management",
    "Law",
    "Public Administration"
  ],
  "Education, arts and humanities": [
    "Education",
    "English Language",
    "Kurdish Language",
    "Arabic Language",
    "History",
    "Philosophy",
    "Fine Arts",
    "Translation",
    "Sociology",
    "Social Work",
    "Psychology",
    "Political Science",
    "Media and Communication",
    "Journalism",
    "Sports Science"
  ],
  "Agriculture": [
    "Agriculture",
    "Animal Science",
    "Forestry"
  ]
}

export const FIELDS_OF_STUDY = Object.values(FIELD_GROUPS).flat()

// Cities in Iraq, for a job seeker's location and the cities they would work in. Searchable in the form.
export const IRAQ_CITIES = [
  "Erbil","Sulaymaniyah","Duhok","Halabja","Kirkuk","Zakho","Soran","Ranya","Koya","Akre","Shaqlawa","Choman","Kalar",
  "Chamchamal","Penjwen","Qaladze","Darbandikhan","Khanaqin","Amedi","Semel","Baghdad","Basra","Mosul","Najaf","Karbala",
  "Hillah","Nasiriyah","Amarah","Diwaniyah","Kut","Ramadi","Fallujah","Baqubah","Samarra","Tikrit","Samawah","Tal Afar",
  "Sinjar","Al-Qa'im","Haditha","Zubair","Umm Qasr","Tuz Khurmatu",
]

const flagOf = (code: string) => String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)))

const ISO_COUNTRY_CODES = [
  "AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB",
  "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV",
  "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ",
  "DM", "DO", "TL", "EC", "EG", "SV", "GQ", "ER", "EE", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM",
  "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "HN", "HK", "HU", "IS",
  "IN", "ID", "IR", "IQ", "IE", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA", "LV",
  "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MK", "MG", "MW", "MY", "MV", "ML", "MT", "IM", "MH", "MQ", "MR", "MU",
  "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "BQ", "NL", "NC", "NZ", "NI", "NE",
  "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE",
  "RO", "RU", "RW", "SH", "KN", "LC", "PM", "VC", "BL", "MF", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK",
  "SI", "SB", "SO", "ZA", "GS", "SS", "ES", "LK", "SD", "SR", "SJ", "SZ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TG",
  "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VA", "VE", "VN",
  "VG", "VI", "WF", "EH", "YE", "ZM", "ZW", "XK", "CW", "SX",
]

const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

// Every country (names from the browser), with Iraq and its neighbours first, then A to Z
export const MAIN_COUNTRIES = ["IQ", "TR", "IR", "SY", "JO", "SA", "KW"]
export const COUNTRIES = ISO_COUNTRY_CODES.map((code) => ({ code, name: regionNames.of(code) ?? code, flag: flagOf(code) })).sort(
  (a, b) => {
    const ia = MAIN_COUNTRIES.indexOf(a.code)
    const ib = MAIN_COUNTRIES.indexOf(b.code)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.name.localeCompare(b.name)
  }
)

export const countryName = (code: string) => COUNTRIES.find((c) => c.code === code)?.name ?? code

// Suggestions for core competencies; people can also write their own
export const HARD_SKILLS = [
  "Microsoft Excel", "Microsoft Office", "Accounting", "Bookkeeping", "Financial analysis", "Budgeting", "Data analysis",
  "Data entry", "SQL", "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C#", ".NET", "PHP", "Web development",
  "Mobile development", "Cloud computing (AWS / Azure)", "Networking", "Cybersecurity", "IT support", "Graphic design",
  "Adobe Photoshop", "Adobe Illustrator", "UI/UX design", "Video editing", "Digital marketing", "Social media marketing",
  "SEO", "Content writing", "Copywriting", "Translation", "Sales", "Customer service", "CRM software", "Project management",
  "Procurement", "Supply chain management", "Inventory management", "Logistics", "AutoCAD", "Revit", "Civil engineering",
  "Electrical engineering", "Mechanical engineering", "HSE (health & safety)", "Quality control", "Nursing", "First aid",
  "Pharmacy", "Laboratory skills", "Teaching", "Curriculum design", "HR administration", "Recruitment", "Payroll",
  "Legal research", "Contract drafting", "Report writing", "Driving licence",
]

export const SOFT_SKILLS = [
  "Communication", "Teamwork", "Leadership", "Problem solving", "Time management", "Attention to detail", "Adaptability",
  "Critical thinking", "Creativity", "Negotiation", "Customer focus", "Working under pressure", "Organization",
  "Presentation skills", "Decision making", "Conflict resolution", "Self-motivation", "Multitasking", "Mentoring",
  "Emotional intelligence", "Reliability", "Interpersonal skills",
]

// Where a job application stands; the employer moves it along
export const APPLICATION_STATUSES = ["Applied", "Shortlisted", "Not selected"]
