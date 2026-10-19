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

/** Where each role lands after signing in: job seekers on their profile, everyone else in The Pool. */
export const homeFor = (role: Role) => (role === "SEEKER" ? "/profile" : "/pool")

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
