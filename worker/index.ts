/**
 * Cloudflare Worker: serves the static site from ./dist and handles POST /api/contact.
 * Secrets (set with `wrangler secret put`): RESEND_API_KEY, CONTACT_TO.
 * Optional var: CONTACT_FROM (a sender on a domain verified in Resend).
 */
interface Env {
  ASSETS: Fetcher
  RESEND_API_KEY?: string
  CONTACT_TO?: string
  CONTACT_FROM?: string
}

type Payload = {
  name?: string
  email?: string
  company?: string
  kind?: string
  budget?: string
  message?: string
  website?: string // honeypot
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)

// Best-effort per-isolate rate limit: 5 submissions per IP per 10 minutes.
const hits = new Map<string, number[]>()
function limited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 5
}

async function contact(req: Request, env: Env): Promise<Response> {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return json({ error: "Expected JSON" }, 415)

  let data: Payload
  try {
    data = await req.json()
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }

  // Bots fill the hidden field. Pretend it worked.
  if (data.website) return json({ ok: true })

  const name = (data.name ?? "").trim().slice(0, 120)
  const email = (data.email ?? "").trim().slice(0, 200)
  const message = (data.message ?? "").trim().slice(0, 5000)
  const company = (data.company ?? "").trim().slice(0, 120)
  const kind = (data.kind ?? "").trim().slice(0, 300)
  const budget = (data.budget ?? "").trim().slice(0, 40)

  if (!name || !EMAIL.test(email) || message.length < 10) {
    return json({ error: "Please include your name, a valid email and a short message." }, 422)
  }

  const ip = req.headers.get("cf-connecting-ip") ?? "unknown"
  if (limited(ip)) return json({ error: "Too many messages. Try again in a few minutes." }, 429)

  if (!env.RESEND_API_KEY || !env.CONTACT_TO) {
    return json({ error: "The contact form isn't configured yet. Reach me on LinkedIn." }, 503)
  }

  const rows: [string, string][] = [
    ["Name", name],
    ["Email", email],
    ["Company", company || "—"],
    ["Looking for", kind || "—"],
    ["Budget", budget || "—"],
  ]
  const html = `
    <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:560px">
      <h2 style="margin:0 0 16px">New inquiry from ${esc(name)}</h2>
      <table style="border-collapse:collapse;width:100%">
        ${rows.map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#666">${k}</td><td style="padding:6px 0">${esc(v)}</td></tr>`).join("")}
      </table>
      <p style="white-space:pre-wrap;border-top:1px solid #eee;margin-top:16px;padding-top:16px">${esc(message)}</p>
    </div>`

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.CONTACT_FROM ?? "Portfolio <onboarding@resend.dev>",
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `Portfolio inquiry: ${name}${company ? ` (${company})` : ""}`,
      html,
      text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${message}`,
    }),
  })

  if (!res.ok) {
    console.error("Resend error", res.status, await res.text())
    return json({ error: "Couldn't send right now. Try again or reach me on LinkedIn." }, 502)
  }
  return json({ ok: true })
}

export default {
  async fetch(req, env): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname === "/api/contact") return contact(req, env)
    return env.ASSETS.fetch(req)
  },
} satisfies ExportedHandler<Env>
