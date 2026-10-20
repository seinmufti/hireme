import type { CvRead } from "./schema"

// What CV_IMPORT_MOCK=1 returns instead of calling the AI, for trying the import without an API key.
// It includes a few things the import has to handle: a year-only date, a local phone format, a link in a
// description and a guessed language level.
export const SAMPLE_CV_READ: CvRead = {
  user: {
    name: "Shilan Omer Aziz",
    title: "Sales Executive",
    email: "shilan.aziz@example.com",
    phone: "0750 123 4567",
    linkedin: "linkedin.com/in/shilan-aziz",
    country: "IQ",
    city: "Erbil",
    address: "Dream City, Villa 112",
  },
  talent: {
    summary: "Sales executive with 5 years of B2B experience in telecom and FMCG, consistently beating quarterly targets.",
    gender: "",
    dateOfBirth: "",
    hardSkills: ["CRM (Salesforce)", "B2B sales", "Negotiation", "Microsoft Excel", "Market research"],
    softSkills: ["Communication", "Teamwork", "Time management"],
    languages: [
      { language: "Kurdish", speaking: "Native", reading: "Native" },
      { language: "Arabic", speaking: "C1", reading: "B2" },
      { language: "English", speaking: "C1", reading: "C1" },
    ],
    degrees: [
      {
        level: "Bachelor's",
        name: "BA in Business Administration",
        field: "Business Administration",
        institution: "Salahaddin University",
        status: "Graduated",
        startYear: "2014",
        endYear: "2018",
      },
    ],
    certifications: [{ title: "Certified Sales Professional", institution: "NASP", issued: "2021" }],
    experiences: [
      {
        title: "Senior Sales Executive",
        employer: "Korek Telecom",
        category: "Sales & Marketing",
        contractType: "Full-time",
        start: "2021-03",
        end: "",
        current: true,
        description:
          "• Grew corporate accounts in Erbil by 35% in two years\n• Led a team of 4 sales representatives\n• Portfolio at www.shilan-sales.com",
        reference: { name: "Dara Hassan", position: "Sales Manager", phone: "+964 750 987 6543", email: "dara@example.com" },
      },
      {
        title: "Sales Representative",
        employer: "Nestlé Iraq",
        category: "Sales & Marketing",
        contractType: "Full-time",
        start: "2018-09",
        end: "2021-02",
        current: false,
        description: "Managed 60+ retail accounts across Erbil\nBeat quarterly targets 9 quarters in a row",
        reference: null,
      },
    ],
    projects: [
      {
        name: "Erbil Retail Expo 2023",
        link: "",
        description: "Organised the company booth and generated 120 qualified leads",
        start: "2023-05",
        end: "2023-05",
      },
    ],
  },
  uncertain: ["talent.languages.1"],
}
