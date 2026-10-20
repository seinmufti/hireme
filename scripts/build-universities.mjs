// Builds src/data/universities.json (country code -> sorted university names) from the open
// Hipo "university-domains-list" (MIT licence), plus a few Iraqi universities it lacks.
// Usage: node scripts/build-universities.mjs path/to/world_universities_and_domains.json
import fs from "node:fs"

const source = JSON.parse(fs.readFileSync(process.argv[2], "utf8"))

// Iraq: the list's spellings are inconsistent, so these replace the variants of the same university
const IRAQ_CANONICAL = {
  "Salahaddin University-Erbil": /salahddin|salahaddin/i,
  "University of Sulaimani": /sulaimani|sulaimania/i,
  "University of Duhok": /dohuk|duhok/i,
  "University of Kurdistan Hewlêr": /kurdistan - hawler|kurdistan hawler/i,
}
const IRAQ_EXTRA = [
  "Erbil Polytechnic University",
  "Sulaimani Polytechnic University",
  "Duhok Polytechnic University",
  "Halabja University",
  "Garmian University",
  "Raparin University",
  "Charmo University",
  "Cihan University-Erbil",
  "Cihan University-Sulaimaniya",
  "Cihan University-Duhok",
  "Tishk International University",
  "Knowledge University",
  "Lebanese French University",
  "Catholic University in Erbil",
  "Komar University of Science and Technology",
  "Bayan University",
  "Nawroz University",
  "Qaiwan International University",
  "Lebanese French University",
  "Kurdistan Technical Institute",
  "Hawler Medical University",
  "University of Zakho",
  "University of Mosul",
  "University of Kirkuk",
  "University of Baghdad",
  "Mustansiriyah University",
  "University of Technology, Baghdad",
  "University of Basrah",
  "University of Kufa",
  "University of Babylon",
  "University of Anbar",
  "Al-Nahrain University",
  "University of Tikrit",
  "University of Diyala",
]

const clean = (name) => name.replace(/\s*\((Kurdistan Region|Iraq)\)\s*/gi, "").replace(/\s+/g, " ").trim()

const byCountry = {}
for (const u of source) {
  const code = u.alpha_two_code
  if (!/^[A-Z]{2}$/.test(code)) continue
  const name = clean(u.name)
  if (code === "IQ" && Object.values(IRAQ_CANONICAL).some((re) => re.test(name))) continue
  ;(byCountry[code] ??= new Set()).add(name)
}
byCountry.IQ ??= new Set()
for (const n of [...Object.keys(IRAQ_CANONICAL), ...IRAQ_EXTRA]) byCountry.IQ.add(n)

const out = Object.fromEntries(
  Object.entries(byCountry)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, set]) => [code, [...set].sort((a, b) => a.localeCompare(b))])
)
fs.writeFileSync("src/data/universities.json", JSON.stringify(out))
console.log(Object.keys(out).length, "countries,", Object.values(out).reduce((n, l) => n + l.length, 0), "universities,", out.IQ.length, "in Iraq")
