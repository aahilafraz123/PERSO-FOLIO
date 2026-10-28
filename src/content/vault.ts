import { logos } from "@/components/logos"
import { bySlug, type Metric } from "./projects"

/**
 * Content for /vault, the recruiter page. Projects that already have a case study pull their
 * facts from projects.ts; AgentGuard, Bankify and the design work only live here for now. Nothing
 * on the page links to the case studies: every detail is on the page itself.
 */

/** A screenshot shown with a project. */
export type Shot = { src: string; alt: string; label: string; width: number; height: number }

export type Build = {
  id: string
  title: string
  /** Shown before the title, in the same heading: "PayPal AI Hackathon – AgentGuard". */
  titlePrefix?: string
  /** Org or context, one short line. */
  kicker: string
  /** One line that lands the result, readable at a glance. */
  line: string
  summary: string
  points: string[]
  metrics: Metric[]
  stack: string[]
  /** The public repo, shown as the main button. */
  repo?: string
  /** Shown instead of the repo button when the code isn't public. */
  codeNote?: string
  /** Other links, shown quieter. */
  links: { label: string; href: string }[]
  /** Logo shown next to the title; projects without one get a monogram. */
  logo?: string
  shots?: Shot[]
  /** Phone-size screenshots, shown layered. */
  phones?: Shot[]
  /** A single image on a coloured backdrop, such as an award graphic. */
  art?: { src: string; alt: string; bg: string }
  /** For projects without screenshots: where the data comes from, what reads it, what comes out. */
  flow?: { inputs: string[]; engine: string; output: string }
}

const fromProject = (slug: string, b: Pick<Build, "line"> & Partial<Build>): Build => {
  const p = bySlug(slug)!
  const repo = p.links?.find((l) => l.href.includes("github.com/"))
  return {
    id: slug,
    title: p.title,
    kicker: p.org,
    stack: p.stack,
    summary: p.summary,
    points: p.highlights,
    metrics: p.metrics,
    repo: repo?.href,
    links: (p.links ?? []).filter((l) => l !== repo),
    ...b,
  }
}

/** Comcast work is internal, so it has no repo or demo: it opens inside the Comcast row, not the project list. */
const dpx = bySlug("security-analytics")!
export const comcastWork = {
  title: "DPX-Ray",
  line: "LLM security analytics platform for 30,000+ engineers",
  points: dpx.highlights,
  note: "Internal Comcast tool, no public code",
}

export type Experience = {
  org: string
  role: string
  period: string
  note?: string
  logo?: string
  href?: string
  /** Shown inside the row when it's opened. */
  work?: typeof comcastWork
}

export const experience: Experience[] = [
  { org: "Comcast", role: "SWE Co-op", period: "2026", note: "Return offer", logo: logos.comcast, work: comcastWork },
  { org: "Zaro Health", role: "SWE", period: "Sep 2026 – now", href: "https://zarohealth.com/" },
  { org: "NASA Space Apps", role: "Global Nominee", period: "2025", note: "Top 1,290 of 11.5k", logo: logos.nasaColor },
  { org: "LearnFlow", role: "Co-founder", period: "2025", note: "150+ beta users" },
]

export const certs = [
  { code: "AI-900", name: "Azure AI Fundamentals" },
  { code: "AZ-900", name: "Azure Fundamentals" },
  { code: "SC-900", name: "Security, Compliance & Identity" },
]

export const builds: Build[] = [
  {
    id: "agentguard",
    title: "AgentGuard",
    titlePrefix: "PayPal AI Hackathon",
    kicker: "AI agent security · 2026",
    line: "Your AI support agent can issue refunds. AgentGuard makes sure nobody can talk it into one.",
    summary:
      "A policy checkpoint between AI agents and PayPal. Every refund an agent asks for is checked against PayPal's own records, the merchant's refund policy and a Claude risk agent, then allowed, sent to the owner for review, or blocked.",
    points: [
      "Plugs in two ways: inside a Claude support agent, or as an MCP security proxy in front of PayPal's official MCP server, where all 28 tools pass through and refunds get checked first",
      "LangGraph pipeline with a human in the loop: an escalated refund pauses the graph, checkpointed in SQLite, and PayPal is re-checked before the money moves",
      "Red-team eval of 24 scripted chats on Sonnet and Haiku: unguarded agents paid attackers up to $487, AgentGuard paid $0, and no honest customer was refused",
      "The model can only send a refund to a human, never approve one. The deterministic guard eval runs 30/30 in CI on every push",
    ],
    metrics: [
      { value: "$0", label: "paid to attackers in 80 red-team runs, vs up to $487 unguarded" },
      { value: "96%", label: "precision spotting manipulation, with Claude Haiku" },
      { value: "9", label: "checks against PayPal's records before any refund moves" },
    ],
    stack: ["Python", "FastAPI", "LangGraph", "Claude", "MCP", "PayPal REST", "React", "TypeScript", "Docker"],
    repo: "https://github.com/aahilafraz123/agentguard-merchant",
    links: [{ label: "PayPal AI Hackathon", href: "https://paypalaihackathon.devpost.com/" }],
    logo: logos.paypal,
    shots: [
      {
        src: "/projects/agentguard-demo.webp",
        alt: "AgentGuard live demo: an attacker claiming to be the store owner is blocked, and the merchant view shows the PayPal evidence",
        label: "Live demo",
        width: 1440,
        height: 900,
      },
      {
        src: "/projects/agentguard-evals.webp",
        alt: "AgentGuard eval scoreboard: $322 lost unguarded, $130 with prompt rules, $0 with AgentGuard",
        label: "Red-team evals",
        width: 1440,
        height: 900,
      },
    ],
  },
  fromProject("aircast", {
    titlePrefix: "NASA Space Apps Challenge 2025",
    kicker: "Global Nominee · Oct 2025",
    line: "AI air-quality forecasts from NASA satellite data, built and shipped to Azure in 48 hours",
    logo: logos.nasaColor,
    art: {
      src: "/projects/aircast-nominee.webp",
      alt: "NASA International Space Apps Challenge 2025 Global Nominees badge",
      bg: "linear-gradient(135deg, #01378d, #0b2a66 55%, #102040)",
    },
  }),
  {
    id: "bankify",
    title: "Bankify",
    kicker: "Solo build · 2026",
    line: "An AI command center for your money that finds what's costing you and explains it in plain words",
    stack: ["Next.js", "TypeScript", "Supabase", "Postgres", "Plaid", "Claude", "Vitest"],
    summary:
      "Accounts, cards, subscriptions, retirement, goals and IOUs in one app, with a reasoning layer on top that tells you what's costing you money. Runs on demo data or real bank connections through Plaid.",
    points: [
      "Catches double-paid bills, overlapping subscriptions, price increases, groceries on the wrong card and unclaimed 401(k) match",
      "Ask tab: Claude with read-only tools over your own financial data, streaming answers",
      "Two-factor sign-in, and the database itself refuses user data to sessions that haven't passed it",
      "Pure, tested engine for subscriptions, cards, retirement and goals, separate from the data source",
    ],
    metrics: [
      { value: "5", label: "areas in one app: money, cards, plans, people, Ask" },
      { value: "2FA", label: "enforced by the database, not just the UI" },
      { value: "Plaid", label: "real bank connections, read-only" },
    ],
    links: [],
    codeNote: "Private repo, code on request",
    phones: [
      { src: "/projects/bankify-today.webp", alt: "Bankify Today screen: 11 fixes worth about $4,894 a year, with net worth, spending and what to fix", label: "Today", width: 800, height: 1604 },
      { src: "/projects/bankify-cards.webp", alt: "Bankify Cards screen: which card to use where, valued by what the points are worth", label: "Cards", width: 800, height: 1604 },
      { src: "/projects/bankify-money.webp", alt: "Bankify Money screen: net worth, accounts, and a bank that needs signing in again", label: "Money", width: 800, height: 1604 },
      { src: "/projects/bankify-plan.webp", alt: "Bankify Plan screen: goals with when each one finishes at the current pace", label: "Plan", width: 800, height: 1604 },
    ],
  },
  fromProject("stock-analyzer", {
    line: "Type a ticker, get a research report: SEC filings, earnings calls and 10 live sources, read by Claude",
    points: [
      "Fetches 10 data sources at once, so a report takes as long as the slowest source, and any one failing never stops it",
      "Downloads the latest 10-Q and 10-K from SEC EDGAR and pulls out MD&A, liquidity and risk factors",
      "Splits earnings calls into prepared remarks and analyst Q&A, so the model can weigh one against the other",
      "Claude answers in a strict JSON schema: signal, confidence, valuation, strengths, risks, recommendation",
    ],
    shots: [
      {
        src: "/projects/stockanalyzer-home.webp",
        alt: "StockAnalyzer home: an equity research terminal with a ticker search and popular tickers",
        label: "Home",
        width: 1400,
        height: 900,
      },
    ],
  }),
  fromProject("learnflow", {
    line: "The AI study app I co-founded and built. 150+ beta users",
    codeNote: "Private repo, code on request",
    shots: [
      {
        src: "/projects/learnflow-desk.webp",
        alt: "Illustration: lectures, handwritten notes and readings all flowing into one study workspace on a laptop",
        label: "Concept",
        width: 1600,
        height: 905,
      },
    ],
  }),
]

export type Design = {
  name: string
  what: string
  url: string
  /** Shown on redesigns of real brands, so nobody mistakes them for the official site. */
  concept?: boolean
}

/** Live, inside the page. */
export const designs: Design[] = [
  {
    name: "Zaro, Apple-style redesign",
    what: "A concept redesign of Zaro in the style of an Apple product page.",
    url: "https://aahilafraz123.github.io/Zaro-redesign/minimal/",
    concept: true,
  },
  {
    name: "Ryzoe redesign",
    what: "A minimal rebuild of ryzoe.com with Next.js, GSAP and React Three Fiber.",
    url: "https://aahilafraz123.github.io/ryzoe-redesign/",
    concept: true,
  },
]

/**
 * In production. Not embedded: its intro animation never plays inside a frame, and it should
 * read as a link to the real site. Shown as its homepage captured top to bottom, which pans
 * past on hover.
 */
export const production = {
  name: "zarohealth.com",
  what: "Zaro Health's public site. I designed and built every part of it, including the imagery, generated with Higgsfield.",
  url: "https://zarohealth.com/",
  page: { src: "/designs/zarohealth-full.webp", width: 1200, height: 7500 },
}
