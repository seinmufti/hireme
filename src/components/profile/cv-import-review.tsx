import { sectionOf } from "@/lib/cv-import"

// After a CV import, what the AI wasn't sure about or couldn't find is listed in a toast (see
// cv-import-dialog) and its form sections turn yellow.

/** Form sections holding a field that needs a look after an import. */
export const sectionsToCheck = (paths: string[]) => new Set(paths.map(sectionOf))
