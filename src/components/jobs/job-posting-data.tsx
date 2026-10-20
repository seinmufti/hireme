import type { Job } from "@/lib/types"

const EMPLOYMENT_TYPE: Record<string, string> = { "Full-time": "FULL_TIME", "Part-time": "PART_TIME", Internship: "INTERN" }

/**
 * The job as schema.org JobPosting data, so search engines (Google for Jobs) can list it.
 * https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
export function JobPostingData({ job }: { job: Job }) {
  const { remote, international, iraqCity } = job.location
  const data = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.createdAt,
    validThrough: `${job.deadline}T23:59:59`,
    employmentType: EMPLOYMENT_TYPE[job.contractType] ?? "OTHER",
    hiringOrganization: { "@type": "Organization", name: job.company },
    ...(remote
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "Iraq" } }
      : {
          jobLocation: {
            "@type": "Place",
            address: { "@type": "PostalAddress", ...(international ? {} : { addressLocality: iraqCity, addressCountry: "IQ" }) },
          },
        }),
    skills: job.skills.join(", "),
    industry: job.category,
  }
  // "<" escaped so text in the job can't end the script tag
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />
}
