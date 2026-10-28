const nasaEmail = "/receipts/nasa_email.png"
const comcastOffer = "/receipts/comcast_offer.png"

export type Category = "Enterprise" | "Hackathon" | "Product" | "Tool" | "Experience"

/** `value` then `label` should read as one plain-English phrase: "150+ people signed up for the beta". */
export type Metric = { value: string; label: string }

/** A line of an email body. `kind` controls styling only. */
export type EmailLine = { text: string; kind?: "p" | "strong" | "heading" | "quote" | "note" }
/** The text of a proof email, transcribed so it reads at a normal size. */
export type Email = { from: string; address?: string; date?: string; to?: string; body: EmailLine[] }

/**
 * Screenshot proof. `width` is the CSS width (px) at which the screenshot's body text
 * reads at about 15px; the enlarged view never shows it smaller than it has to.
 * `description` replaces the lightbox's "The original email, unedited." line;
 * `dark` frames a dark-mode screenshot in a dark mat instead of a white one.
 */
export type Receipt = {
  src: string
  width: number
  height: number
  alt: string
  caption: string
  email?: Email
  description?: string
  dark?: boolean
}

export type Project = {
  slug: string
  title: string
  org: string
  period: string
  category: Category
  /** One line that lands the result. Shown first everywhere. */
  headline: string
  summary: string
  role: string
  highlights: string[]
  metrics: Metric[]
  stack: string[]
  links?: { label: string; href: string }[]
  receipt?: Receipt
  note?: string
  /** Accent gradient used for the card art. */
  hue: string
  featured?: boolean
}

export const projects: Project[] = [
  {
    slug: "aircast",
    title: "AirCast",
    org: "NASA Space Apps Challenge 2025",
    period: "Oct 2025",
    category: "Hackathon",
    headline: "Named a NASA Space Apps Global Nominee (top 1,290 of 11,500+ teams worldwide).",
    summary:
      "An air-quality forecasting app built in a weekend for NASA Space Apps 2025. It combines NASA TEMPO satellite data, OpenAQ ground sensors and OpenWeather to predict AQI six hours ahead, shown on a map with a chat assistant.",
    role: "Full-stack development: the data pipeline that cleans the TEMPO and OpenAQ feeds, the AI integrations, the map and chart interface, and the automated deploy to Azure.",
    highlights: [
      "Atmospheric-to-ground comparison with 6-hour AQI predictions using weather and traffic emissions",
      "Interactive Google Maps interface with geospatial clustering and NO2 / O3 / PM2.5 filters",
      "Deployed on Microsoft Azure with GitHub Actions CI/CD",
    ],
    metrics: [
      { value: "11,500+", label: "teams entered worldwide" },
      { value: "1,290", label: "named Global Nominees, ours included" },
      { value: "48h", label: "from idea to live on Azure" },
    ],
    stack: ["Azure", "GitHub Actions", "NASA TEMPO", "OpenAQ", "OpenWeather", "Google Maps", "Chart.js"],
    links: [
      { label: "Source on GitHub", href: "https://github.com/allenvarghese05/aircast-nasa-hackathon" },
      { label: "View on NASA Space Apps", href: "https://www.spaceappschallenge.org/2025/find-a-team/relentless/?tab=project" },
    ],
    receipt: {
      src: nasaEmail,
      width: 1640,
      height: 783,
      alt: "Email from NASA Space Apps naming Team Relentless a Global Nominee",
      caption: "NASA Space Apps · Global Nominee notice · Nov 5, 2025",
      email: {
        from: "NASA Space Apps Challenge",
        address: "community@spaceappschallenge.org",
        date: "Nov 5, 2025, 12:26 PM",
        to: "Aahil Afraz",
        body: [
          { text: "Congratulations!" },
          { text: "Due to the ongoing U.S. government shutdown, NASA Space Apps will not be able to update spaceappschallenge.org or our social media channels to publicly announce this year's Global Nominees. In the absence of our public announcement, we are writing directly to inform the following teams of their Global Nominee status:" },
          { text: "Team: Relentless", kind: "strong" },
          { text: "Event: Universal Event", kind: "strong" },
          { text: "We have included copy and a graphic for optional use if you'd like to optionally post on your channels. Feel free to adjust the copy to share your personal thoughts and reflections on this exciting honor!" },
          { text: "I am excited to share that my team has been chosen as one of the 1,290+ Global Nominees selected from Local Events and the Universal Event! #SpaceApps participants submitted over 11,500 projects and mine stood out as a Global Nominee in the 2025 NASA Space Apps Challenge!", kind: "quote" },
          { text: "Although we may not be able to publically share at this time, please be assured that we were incredibly impressed by this year's Global Nominees. Congratulations!" },
          { text: "Thank you for your continued flexibility and understanding during this time. We recognize that the U.S. government shutdown has required extra patience and adaptability, and we truly appreciate your involvement in the 2025 NASA Space Apps Challenge." },
          { text: "NASA Space Apps is funded by NASA's Earth Science Division through a contract with Booz Allen Hamilton, Mindgrub, and SecondMuse.", kind: "note" },
          { text: "Thank you,\nCommunity Management Team\nNASA Space Apps Global Organizing (GO) Team" },
        ],
      },
    },
    hue: "from-[#0b3d91] via-[#0a1a3f] to-[#050505]",
    featured: true,
  },
  {
    slug: "security-analytics",
    title: "Security Analytics Platform",
    org: "Comcast · Software Engineering Co-op, DevSecOps",
    period: "Mar – Sep 2026",
    category: "Enterprise",
    headline: "An LLM-powered security analytics platform covering 9,000+ applications, in one view for engineering leaders.",
    summary:
      "Leaders were checking five or more dashboards to understand security risk across their portfolio. This platform puts that data for 9,000+ applications in one place. An LLM agent reads live security and infrastructure data and writes a summary, and leaders can act from the page, for example emailing every app owner affected by a vulnerability.",
    role: "I presented the platform concept to VPs and executive leadership, which led to it being integrated into the main developer portal. We worked as an AI-native pod rather than in traditional Agile sprints. I built the agent and its tools, the GraphQL API and the data pipeline behind it, and turned feedback from managers into features. I also built Top Hotspot, which is still in the product: it shows which vulnerability categories make up most of a leader's portfolio and who to contact about them.",
    highlights: [
      "Top Hotspot: groups a leader's vulnerabilities by category and volume, e.g. 6,000 of 10,000 coming from one outdated SSH package, with the SDL leaders to contact and a button to email all of them",
      "LangChain agent using the A2A protocol and a custom MCP toolset of 5+ tools for real-time security data, deployed to internal Kubernetes within 2 months",
      "Agent pipeline tuned to sub-3-second responses with Langfuse tracing",
      "GraphQL schema over Aurora MySQL materialized views, filled by an AWS Batch pipeline that unifies 4 security sources",
      "Presented to VPs and executive leadership, then integrated into the primary developer portal used by 30,000+ engineers company-wide",
    ],
    metrics: [
      { value: "5+ → 1", label: "separate dashboards replaced by one view" },
      { value: "30,000+", label: "engineers use the portal it ships inside" },
      { value: "9,000+", label: "applications covered" },
    ],
    stack: ["LangChain", "A2A", "MCP", "Langfuse", "GraphQL", "AWS Batch", "Aurora MySQL", "Kubernetes", "Python"],
    receipt: {
      src: comcastOffer,
      width: 1900,
      height: 387,
      alt: "Comcast University Relations co-op offer email",
      caption: "Comcast University Relations · Co-op offer",
      email: {
        from: "Comcast University Relations",
        to: "Aahil Afraz",
        body: [
          { text: "Congratulations!" },
          { text: "On behalf of the Comcast University Relations Team, we are thrilled to welcome you to the Spring 2026 Co-op Program. We are so excited that you've accepted our offer and look forward to an engaging, educational, and fun summer together." },
          { text: "What's Next?", kind: "heading" },
          { text: "If you've signed your offer letter:", kind: "strong" },
          { text: "Our onboarding team will be reaching out shortly to begin the background check process (if they haven't already). Please keep an eye on your email and phone for next steps." },
          { text: "If you haven't received your offer letter yet:", kind: "strong" },
          { text: "Some offer letters are still routing through final approvals and will be sent via email soon. Once your offer letter is signed, the onboarding team will contact you regarding your background check." },
        ],
      },
    },
    note: "Internal tool. Implementation details are confidential.",
    hue: "from-[#6b1d2a] via-[#1f0b10] to-[#050505]",
    featured: true,
  },
  {
    slug: "learnflow",
    title: "LearnFlow",
    org: "Founding engineer",
    period: "Jun – Sep 2025",
    category: "Product",
    headline: "A production AI learning platform I founded and launched to 150+ beta users.",
    summary:
      "A desktop learning platform built with React, Electron and an Express.js backend. An agentic RAG pipeline lets students query their own lecture recordings and slides, using OpenAI Whisper for audio and Cloud Vision OCR for text on screen.",
    role: "Founding engineer. I built the AI pipeline and worked across the full stack. We demoed it at a startup expo, a pitch competition and to faculty.",
    highlights: [
      "Agentic RAG pipeline to query lecture recordings and slides, using OpenAI Whisper and Cloud Vision OCR",
      "System-wide OCR text capture in any desktop app, sub-3s extraction",
      "Six-pipeline context assembly for personalized AI across 10+ threads per project",
      "Express API hardened with Helmet, CORS and rate limiting",
    ],
    metrics: [
      { value: "150+", label: "people signed up for the beta" },
      { value: "<3s", label: "to grab text from any app on screen" },
      { value: "6", label: "AI pipelines feeding every answer" },
    ],
    stack: ["React", "Electron", "Express.js", "RAG", "OpenAI Whisper", "Cloud Vision OCR", "Supabase"],
    hue: "from-[#0f3b2e] via-[#08170f] to-[#050505]",
    featured: true,
  },
  {
    slug: "stock-analyzer",
    title: "StockAnalyzer",
    org: "With Shyam Shah · ex-Goldman Sachs, ex-UBS",
    period: "2025",
    category: "Product",
    headline: "Enter a stock ticker and get a research report in seconds.",
    summary:
      "Pulls SEC filings, earnings call transcripts and insider trades, then uses an agentic RAG pipeline to turn 80k+ characters of source material into one report. Shyam Shah (ex-Goldman Sachs, ex-UBS) defined what the report needs to cover.",
    role: "I built the full stack, including the retrieval and summarization pipeline.",
    highlights: ["10 live data sources, 12 parallel fetches", "SEC EDGAR and Finnhub ingestion", "Claude-powered synthesis"],
    metrics: [
      { value: "10", label: "live data sources pulled per report" },
      { value: "80k+", label: "characters of filings condensed into one read" },
      { value: "12", label: "requests run at once to keep it fast" },
    ],
    stack: ["Python", "FastAPI", "React", "Claude", "SEC EDGAR", "Finnhub"],
    links: [
      { label: "Source on GitHub", href: "https://github.com/aahilafraz123/Stock-Analyst-" },
      { label: "Shyam Shah", href: "https://www.linkedin.com/in/shyam-p-shah/" },
    ],
    hue: "from-[#1d2f57] via-[#0b1224] to-[#050505]",
    featured: true,
  },
  {
    slug: "transcriber",
    title: "Transcriber",
    org: "Solo build",
    period: "2025",
    category: "Tool",
    headline: "A transcription app that runs entirely on your Mac. No audio is uploaded.",
    summary:
      "Made for meetings where audio can't be sent to a cloud service, such as legal, finance or healthcare. Transcription runs locally.",
    role: "Designed and built solo.",
    highlights: ["faster-whisper running locally", "System audio capture via BlackHole", "Enterprise-safe by design"],
    metrics: [
      { value: "100%", label: "of transcription runs on your Mac" },
      { value: "0 bytes", label: "of audio ever uploaded" },
      { value: "Solo", label: "designed and built end to end" },
    ],
    stack: ["Python", "faster-whisper", "BlackHole", "macOS"],
    links: [{ label: "Source on GitHub", href: "https://github.com/aahilafraz123/Transcriber-Fully-Local" }],
    hue: "from-[#2b2b30] via-[#121214] to-[#050505]",
  },
  {
    slug: "enable-games",
    title: "Angular → React migration",
    org: "EnAble Games · SWE co-op",
    period: "Apr – Sep 2025",
    category: "Experience",
    headline: "Moved a production game portal from Angular to React. First load 35% faster.",
    summary: "Led the Angular-to-React migration of a production portal and added a Redis caching layer for game data.",
    role: "Software engineering co-op on an eight-person team.",
    highlights: [
      "Refactored 30+ components with 100% feature parity",
      "Bundle size down 25%, initial load time down 35%",
      "Redis caching layer to cut redundant API calls",
    ],
    metrics: [
      { value: "35%", label: "faster first page load" },
      { value: "25%", label: "smaller JavaScript bundle" },
      { value: "30+", label: "components rebuilt in React, nothing lost" },
    ],
    stack: ["React", "Angular", "Redis", "Hooks"],
    hue: "from-[#3b1f4f] via-[#150b1d] to-[#050505]",
  },
  {
    slug: "phillyfeelsafe",
    title: "PhillyFeelSafe",
    org: "Drexel · 4-person Scrum team",
    period: "Feb – Jun 2024",
    category: "Product",
    headline: "An interactive safety map of Philadelphia, built by a four-person team.",
    summary: "A six-month class project run as Scrum, with sprint planning, code review and user testing.",
    role: "Engineer on a four-person Scrum team.",
    highlights: ["Full Agile cycle: sprints, reviews, UAT"],
    metrics: [
      { value: "6 months", label: "run as real Scrum sprints" },
      { value: "4", label: "engineers on the team" },
      { value: "UAT", label: "user testing before hand-off" },
    ],
    stack: ["JavaScript", "Maps", "Scrum"],
    hue: "from-[#10323a] via-[#081518] to-[#050505]",
  },
]

export const categories: ("All" | Category)[] = ["All", "Enterprise", "Hackathon", "Product", "Tool", "Experience"]

export const bySlug = (slug?: string) => projects.find((p) => p.slug === slug)
