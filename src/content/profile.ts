export const profile = {
  name: "Aahil Afraz",
  first: "Aahil",
  role: "Software Engineer & Designer",
  location: "Philadelphia, PA",
  school: "Drexel University · B.S. Software Engineering · 2028",
  email: "", // public inquiry address, optional. The contact form works without it.
  artistName: "Azrael",

  /** Cal.com booking link, e.g. "aahilafraz/intro". Empty = placeholder panel. */
  calLink: "aahil-afraz-ihgw0f/book-a-time-with-aahil",

  /** Optional portrait. Drop a file in src/assets/ and import it here. */
  portrait: null as string | null,

  links: {
    github: "https://github.com/aahilafraz123",
    linkedin: "https://www.linkedin.com/in/aahil-afraz-21512826a/",
    resume: "/resume.pdf",
    spotify: "https://open.spotify.com/artist/7DexnXucyQOJVgTRN8o5Pm",
    appleMusic: "https://music.apple.com/us/artist/azrael/1879744334",
  },

  embeds: {
    spotifyArtist: "https://open.spotify.com/embed/artist/7DexnXucyQOJVgTRN8o5Pm?utm_source=generator&theme=0",
  },

  services: [
    { title: "Product and UI design", body: "User flows, interface design and design systems." },
    { title: "Web apps", body: "Full-stack builds with React, Node, Python and Postgres." },
    { title: "AI features", body: "LLM features, agents and RAG added to your product." },
    { title: "Photo and music", body: "Photography and original music for launches and content." },
  ],

  skills: [
    "Java", "JavaScript", "Python", "SQL", "C", "GraphQL", "React", "Node.js", "Express", "Flask",
    "LangChain", "MCP", "Docker", "Kubernetes", "AWS", "Azure", "PostgreSQL", "Redis", "GitHub Actions",
  ],

  certs: ["Azure AI Fundamentals (AI-900)", "Azure Fundamentals (AZ-900)", "Security, Compliance & Identity (SC-900)"],
}

/** Home page About section. Plain facts, no taglines. */
export const about = {
  /** Photos I took (filenames without .jpg in src/assets/photos). Scenes only, no subjects. First is the wide one. */
  photos: [
    { name: "img-3059", place: "Paris", region: "France", coords: "48.86° N, 2.35° E" },
    { name: "img-3215", place: "Amsterdam", region: "Netherlands", coords: "52.37° N, 4.90° E" },
    { name: "img-2466", place: "Houston", region: "Texas", coords: "29.76° N, 95.37° W" },
  ],
  statement:
    "I co-founded LearnFlow, a study app with 150+ beta users, and just wrapped my co-op on Comcast's DevX Protect team. Now I'm starting at Zaro Health, a fast-moving startup, where I want to bring fresh eyes and keep making the kind of impact I made at Comcast.",
  paragraphs: [
    "I study software engineering at Drexel. I just finished my co-op on Comcast's DevX Protect team, where I built a security analytics platform for engineering leaders.",
    "Now I'm at Zaro Health, a preventive health startup. It's a small team that ships fast, which is exactly the pace I want to be building at.",
  ],
  /** Rendered after the paragraphs, followed by a pointer to the photos beside it. */
  outside: "Outside of work I take photos and release music as Azrael.",
  facts: [
    { label: "Now", value: "Zaro Health, preventive health startup", href: "https://zarohealth.com/" },
    { label: "Previously", value: "Software engineering co-op, DevX Protect team, Comcast" },
    { label: "Studying", value: "B.S. Software Engineering, Drexel University, 2028" },
    { label: "Outside work", value: "Photography, and music as Azrael" },
    { label: "Based in", value: "Philadelphia, PA" },
  ] as { label: string; value: string; href?: string }[],
}
