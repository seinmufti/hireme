import {
  BadgeCheckIcon,
  BriefcaseIcon,
  Building2Icon,
  FileTextIcon,
  GraduationCapIcon,
  HandshakeIcon,
  type LucideIcon,
  MapPinIcon,
  MessageCircleIcon,
  SearchIcon,
  SendIcon,
  StarIcon,
  TrendingUpIcon,
} from "lucide-react"
import { ParticleField } from "@/components/particle-field"

/**
 * The moving background behind every page, on the plain page colour (no gradients): a field of small dots in the
 * logo's maroon, red and black drifting and linking up (see ParticleField), and thin outline icons of the job hunt
 * (briefcase, CV, company, interview chat, offer…) floating slowly up. They sit behind the cards, so they show in the
 * gaps between them. Decoration only; hidden when printing, still for people who prefer less motion.
 */

const MAROON = "text-primary"
const RED = "text-[#F03838]"
const BLACK = "text-neutral-900"

// Spread over the width, each with its own size, speed and start, so they never move in step
const ICONS: { icon: LucideIcon; left: string; size: number; duration: number; delay: number; color: string }[] = [
  { icon: BriefcaseIcon, left: "3%", size: 26, duration: 34, delay: -4, color: MAROON },
  { icon: FileTextIcon, left: "12%", size: 22, duration: 40, delay: -22, color: BLACK },
  { icon: Building2Icon, left: "21%", size: 28, duration: 46, delay: -35, color: MAROON },
  { icon: MessageCircleIcon, left: "30%", size: 20, duration: 32, delay: -12, color: RED },
  { icon: BadgeCheckIcon, left: "39%", size: 24, duration: 42, delay: -28, color: MAROON },
  { icon: MapPinIcon, left: "48%", size: 20, duration: 36, delay: -6, color: RED },
  { icon: HandshakeIcon, left: "57%", size: 28, duration: 48, delay: -40, color: BLACK },
  { icon: SearchIcon, left: "66%", size: 20, duration: 33, delay: -17, color: RED },
  { icon: GraduationCapIcon, left: "75%", size: 26, duration: 44, delay: -31, color: BLACK },
  { icon: SendIcon, left: "83%", size: 20, duration: 37, delay: -9, color: BLACK },
  { icon: TrendingUpIcon, left: "91%", size: 26, duration: 45, delay: -24, color: MAROON },
  { icon: StarIcon, left: "97%", size: 18, duration: 35, delay: -37, color: RED },
]

export function PageBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
      <ParticleField />

      {/* Job-hunt icons floating up from the bottom, swaying a little; scrolling gives them a push (set by ParticleField) */}
      <div className="absolute inset-0 transition-transform duration-300 ease-out" style={{ transform: "translateY(var(--scroll-kick, 0px))" }}>
        {ICONS.map(({ icon: Icon, ...i }) => (
          <span
            key={i.left}
            className={`animate-rise absolute top-full ${i.color}`}
            style={{ left: i.left, animationDuration: `${i.duration}s`, animationDelay: `${i.delay}s` }}
          >
            {/* The faintness is on the icon: the rise fades its wrapper in and out */}
            <Icon className="animate-sway opacity-25" strokeWidth={1.75} style={{ width: i.size, height: i.size }} />
          </span>
        ))}
      </div>
    </div>
  )
}
