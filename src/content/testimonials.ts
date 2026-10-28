import type { Receipt } from "./projects"
import { profile } from "./profile"

/**
 * Where a testimonial can be checked. Every source ships the original screenshot, cropped to
 * the note; a LinkedIn recommendation also links to the public recommendations list.
 */
export type TestimonialSource = { kind: "linkedin"; href: string; receipt: Receipt } | { kind: "teams"; receipt: Receipt }

export type Testimonial = {
  id: string
  name: string
  initials: string
  /** Job title and org, shown under the name. */
  title: string
  /** One-line version of `title` for the scroll stage. */
  shortTitle: string
  /** The one trait this quote is evidence for. Shown as the chapter label. */
  trait: string
  /** Their public LinkedIn profile, so visitors can see who they are. */
  profile?: string
  /** How we worked together, in their words where the source gives it. */
  relationship?: string
  date: string
  /** Verbatim excerpt. Use "…" for any cut, never reword. */
  quote: string
  /** A phrase inside `quote`, exactly as written there, that gets the accent gradient. */
  highlight: string
  /** Short verbatim line for the recruiter page, readable at a glance above the screenshot. */
  pull?: string
  /** The whole note, verbatim, one entry per paragraph. */
  full: string[]
  source: TestimonialSource
  /** Project slug to also show this on. */
  project?: string
}

// Verbatim, including the missing spaces after some periods.
const junaid = [
  "I had the pleasure of working with Aahil Afraz during his co-op experience on our engineering team. Aahil quickly distinguished himself through his strong technical aptitude, curiosity, and ability to apply new technologies to solve real-world challenges.Aahil consistently brought fresh perspectives and innovative ideas, helping the team look at problems through a different lens and identify opportunities for improvement. He also demonstrated an impressive ability to leverage AI and emerging technologies to improve efficiency, accelerate analysis, and develop practical solutions for engineering and business needs.Beyond his technical capabilities, Aahil is a proactive, collaborative professional who takes ownership of his work, welcomes feedback, and continuously strives to learn and grow. His positive attitude, strong work ethic, and willingness to tackle new challenges made him a valued member of our team.Aahil has tremendous potential, and I am confident that his combination of technical skill, innovative thinking, AI fluency, and growth mindset will enable him to make a significant impact throughout his career. I highly recommend Aahil and look forward to following his future success.",
]

const scott = [
  "I was part of the approval process for new Co-Op folks, and I'm drawn to early career talent like Aahil because of the fresh perspective they bring—it's important to integrate that with existing ways of doing things to get the most out of our outcomes. He owned more scope than a typical co-op, was comfortable with ambiguity, and moved faster from idea to production, needing less hand-holding than most; he became a key part of delivering vs. just learning. In front of senior leadership he was confident but composed, not intimidated by the room, and fit right into the culture and group dynamics. Going forward, I'd want to see him continue that curious approach to learning new ways of working and go deep on asking the classic \"5 why's\" about problems, so that what he delivers addresses the root cause.  I believe that this is a differentiator of great vs good soluitoning.  Aahil has what it takes.",
]

const naresh = [
  "As Aahil wraps up his co-op, I wanted to take a moment to thank him for everything he has contributed during his time with us.",
  "When Aahil joined, he spent time learning the security space and understanding what DevX Protect does. One thing that stood out early was his proactive attitude. When the SAT validator requirements changed, he took ownership of fixing validator issues on one of our APIs, helping address a managed vulnerability.",
  "Aahil was always willing to step outside his comfort zone and learn something new. He embraced AI-native ways of working, learned how to analyze data using Jupyter notebooks, explored agentic AI and LLM integrations, and quickly applied what he learned. On DPX Ray, he played a key role in building the MVP, helping us better understand our data and turn ideas into something tangible.",
  "One of Aahil's strengths is that he never lets a lack of experience stop him. If he didn't know something, he learned it. He picked up new technologies quickly, experimented with different approaches, and moved fast. He also built a clean and visually appealing user experience for DPX Ray and even proposed a different user experience for Team Hub that gave us a fresh perspective and new ideas to consider.",
  "The work he helped deliver on DPX Ray received positive feedback and helped shape the roadmap for where the product is heading. Just as importantly, he was a great teammate throughout his time here. He was easy to work with, open to feedback, willing to help, and always brought a positive attitude.",
  "Aahil, thank you for your hard work, curiosity, and willingness to take on new challenges. It has been great to see how much you've learned and accomplished in such a short time. Wishing you all the best in your next chapter. Keep learning, keep building, and stay in touch!",
]

const vamsi = [
  "Hi Afraz, Aahil,",
  "As your time with our team comes to an end, I wanted to take a moment to share how much I've appreciated our engagement.",
  "One of the qualities that stands out most about you is your attitude. A positive attitude can take you a long way, and you consistently demonstrate a genuine eagerness to learn, grow, and share your knowledge with others. Your curiosity, humility, and willingness to ask questions when you don't know something are qualities that many experienced professionals strive to maintain.",
  "You bring fresh ideas and perspectives to every discussion. What I admire most is your ability to remain open-minded and receptive to different viewpoints. Rather than being constrained by previous experiences or assumptions, you actively listen, challenge ideas thoughtfully, and continuously refine your own perspectives. That mindset will serve you exceptionally well throughout your career.",
  "You have also demonstrated a strong sense of ownership and execution. Beyond contributing ideas, you consistently turn those ideas into action and help the team explore new approaches to development and problem-solving. The work you have accomplished during your time here has made that abundantly clear.",
  "Most importantly, I am glad to have gotten to know you as a person. It has been a pleasure working with you, and I have no doubt that you have a bright future ahead of you. Thank you for your contributions to the team and for the positive impact you have made during your time here.",
  "I wish you all the best in your future endeavors. Please stay in touch, and I hope our paths cross again someday.",
  "Warm regards,\nVamsi",
]

const teamsNote = "The original Microsoft Teams message, cropped to just the note."

export const testimonials: Testimonial[] = [
  {
    id: "junaid-butt",
    name: "Junaid Butt",
    initials: "JB",
    title: "Senior Director, Cyber Security & Compliance · Comcast Global Technology Organization",
    shortTitle: "Senior Director, Cyber Security & Compliance, Comcast",
    trait: "AI fluency",
    relationship: "Managed Aahil directly",
    date: "Oct 6, 2026",
    quote:
      "He also demonstrated an impressive ability to leverage AI and emerging technologies to improve efficiency, accelerate analysis, and develop practical solutions for engineering and business needs.",
    highlight: "an impressive ability to leverage AI",
    pull: "I highly recommend Aahil",
    full: junaid,
    source: {
      kind: "linkedin",
      href: `${profile.links.linkedin}details/recommendations/`,
      receipt: {
        src: "/receipts/junaid_linkedin.webp",
        width: 1000,
        height: 383,
        alt: "Junaid Butt's LinkedIn recommendation of Aahil",
        caption: "LinkedIn · Recommendation from Junaid Butt · Oct 6, 2026",
        description: "The recommendation as it appears on LinkedIn.",
        email: { from: "Junaid Butt", date: "October 6, 2026", body: junaid.map((text) => ({ text })) },
      },
    },
  },
  {
    id: "scott-adams",
    name: "Scott Adams",
    initials: "SA",
    title: "Executive Director, Cybersecurity & Compliance · Comcast Global Technology Organization",
    shortTitle: "Executive Director, Cybersecurity & Compliance, Comcast",
    trait: "Speed",
    // LinkedIn lists him as senior to Aahil but not his manager, so nothing here may claim he managed him.
    relationship: "Aahil's skip-level leader",
    date: "Sep 17, 2026",
    quote:
      "He owned more scope than a typical co-op, was comfortable with ambiguity, and moved faster from idea to production, needing less hand-holding than most. … Aahil has what it takes.",
    highlight: "moved faster from idea to production",
    pull: "Aahil has what it takes.",
    full: scott,
    source: {
      kind: "linkedin",
      href: `${profile.links.linkedin}details/recommendations/`,
      receipt: {
        src: "/receipts/scott_linkedin.webp",
        width: 1000,
        height: 345,
        alt: "Scott Adams's LinkedIn recommendation of Aahil",
        caption: "LinkedIn · Recommendation from Scott Adams · Sep 17, 2026",
        description: "The recommendation as it appears on LinkedIn.",
        email: { from: "Scott Adams", date: "September 17, 2026", body: scott.map((text) => ({ text })) },
      },
    },
  },
  {
    id: "naresh-kyadarwar",
    name: "Naresh Kyadarwar",
    initials: "NK",
    title: "Principal Engineer · Comcast",
    shortTitle: "Principal Engineer, Comcast",
    trait: "Curiosity",
    profile: "https://www.linkedin.com/in/nareshkyadarwar/",
    date: "Sep 2026",
    quote: "One of Aahil's strengths is that he never lets a lack of experience stop him. If he didn't know something, he learned it.",
    highlight: "If he didn't know something, he learned it.",
    full: naresh,
    project: "security-analytics",
    source: {
      kind: "teams",
      receipt: {
        src: "/receipts/naresh_teams.png",
        width: 972,
        height: 556,
        alt: "Microsoft Teams message from Naresh Kyadarwar thanking Aahil as his co-op wraps up",
        caption: "Microsoft Teams · Naresh Kyadarwar · 9:28 AM",
        description: teamsNote,
        dark: true,
        email: { from: "Naresh Kyadarwar", date: "9:28 AM", body: naresh.map((text) => ({ text })) },
      },
    },
  },
  {
    id: "vamsi-manthena",
    name: "Vamsi Manthena",
    initials: "VM",
    title: "Lead Security Engineer · Comcast",
    shortTitle: "Lead Security Engineer, Comcast",
    trait: "Ownership",
    profile: "https://www.linkedin.com/in/manthenavamsi/",
    date: "Sep 2026",
    quote: "…a strong sense of ownership and execution. Beyond contributing ideas, you consistently turn those ideas into action.",
    highlight: "a strong sense of ownership and execution",
    full: vamsi,
    source: {
      kind: "teams",
      receipt: {
        src: "/receipts/vamsi_teams.png",
        width: 988,
        height: 656,
        alt: "Microsoft Teams message from Vamsi Manthena to Aahil as his time on the team ends",
        caption: "Microsoft Teams · Vamsi Manthena · 11:07 AM",
        description: teamsNote,
        dark: true,
        email: { from: "Vamsi Manthena", date: "11:07 AM", body: vamsi.map((text) => ({ text })) },
      },
    },
  },
]

export const forProject = (slug: string) => testimonials.filter((t) => t.project === slug)

/** Home and recruiter pages: only what anyone can check on LinkedIn. */
export const verifiedTestimonials = testimonials.filter((t) => t.source.kind === "linkedin")
