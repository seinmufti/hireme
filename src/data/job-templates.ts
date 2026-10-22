import type { JobInput } from "@/lib/types"

// Starting points for a new job post: the employer picks one and edits the details.
// Where, deadline and salary are left for them to fill in.

type Template = Pick<JobInput, "title" | "category" | "contractType" | "skills" | "description">

export const JOB_TEMPLATES: Template[] = [
  {
    title: "Sales Representative",
    category: "Sales",
    contractType: "Full-time",
    skills: ["Sales", "Negotiation", "Customer Service", "Communication"],
    description:
      "Find new customers and look after existing ones.\n- Visit and call customers to present our products\n- Meet monthly sales targets\n- Keep customer records up to date\n- Kurdish and Arabic required, English a plus",
  },
  {
    title: "Customer Service Agent",
    category: "Customer Service",
    contractType: "Full-time",
    skills: ["Customer Service", "Communication", "Patience", "Microsoft Office"],
    description:
      "Help our customers by phone, chat and in person.\n- Answer questions and solve problems quickly\n- Log every request and follow it up\n- Pass complex cases to the right team",
  },
  {
    title: "Accountant",
    category: "Accounting",
    contractType: "Full-time",
    skills: ["Accounting", "Microsoft Excel", "Financial Reporting"],
    description:
      "Keep the company's books accurate and on time.\n- Record daily transactions and reconcile accounts\n- Prepare monthly financial reports\n- Work with our auditors\n- Bachelor's in Accounting required",
  },
  {
    title: "Software Developer",
    category: "IT & Software",
    contractType: "Full-time",
    skills: ["JavaScript", "SQL", "Git", "Problem solving"],
    description:
      "Build and improve our web and mobile apps.\n- Write clean, tested code\n- Work with designers and other developers every day\n- Review code and fix bugs\n- 2+ years of experience",
  },
  {
    title: "Digital Marketing Specialist",
    category: "Marketing",
    contractType: "Full-time",
    skills: ["Digital Marketing", "Social Media", "Content Writing", "Google Ads"],
    description:
      "Grow our brand online.\n- Plan and post on our social media channels\n- Run and measure online ad campaigns\n- Report monthly on what works",
  },
  {
    title: "Administrative Assistant",
    category: "Administration",
    contractType: "Full-time",
    skills: ["Microsoft Office", "Organization", "Communication"],
    description:
      "Keep the office running smoothly.\n- Answer calls and welcome visitors\n- Manage schedules, files and supplies\n- Prepare letters and simple reports",
  },
  {
    title: "Registered Nurse",
    category: "Medical & Healthcare",
    contractType: "Full-time",
    skills: ["Patient Care", "Teamwork", "Communication"],
    description:
      "Care for patients on our ward.\n- Give medication and record patient observations\n- Work with doctors on care plans\n- Rotating shifts\n- Nursing license required",
  },
  {
    title: "Warehouse Worker",
    category: "Logistics & Supply Chain",
    contractType: "Full-time",
    skills: ["Inventory Management", "Teamwork", "Attention to detail"],
    description:
      "Receive, store and send out goods.\n- Check deliveries against orders\n- Keep the warehouse tidy and safe\n- Forklift certificate is a plus",
  },
  {
    title: "Intern",
    category: "Administration",
    contractType: "Internship",
    skills: ["Communication", "Microsoft Office", "Willingness to learn"],
    description:
      "A paid three-month internship for students and fresh graduates.\n- Support the team with daily tasks\n- Learn how the business works from the inside\n- Final-year students welcome",
  },
]
