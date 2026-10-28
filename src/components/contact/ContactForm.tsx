import { useState, type FormEvent } from "react"
import { ArrowUpRight, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

const kinds = ["Product / UI design", "Web or app build", "AI integration", "Full-time role", "Something else"]
const budgets = ["< $2k", "$2k – 5k", "$5k – 15k", "$15k+", "Not sure"]

const field =
  "h-12 rounded-xl border-transparent bg-[#f5f5f7] px-4 text-[15px] placeholder:text-dim transition-all duration-300 focus-visible:border-foreground/25 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-foreground/[0.06]"

/** Label that lifts and darkens while its field (or a sibling in the same `group`) has focus. */
const fieldLabel = "transition-all duration-300 group-focus-within:-translate-y-0.5 group-focus-within:text-foreground"

/** Toggle pill: settles in with a stagger, pops slightly when picked. */
const pill = "h-10 animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-full border border-hairline px-4 text-[13px] font-medium text-muted-foreground transition-all duration-300 data-[state=on]:scale-[1.05] data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background active:scale-95"

export function ContactForm() {
  const [kind, setKind] = useState<string[]>([])
  const [budget, setBudget] = useState("")
  const [sending, setSending] = useState(false)
  const [justSent, setJustSent] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    setSending(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, kind: kind.join(", "), budget }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(body.error || "Something went wrong.")
      form.reset()
      setKind([])
      setBudget("")
      toast.success("Message sent. I'll get back to you within a day.")
      // A beat on the button to confirm the click landed, then the full panel takes over.
      setJustSent(true)
      setTimeout(() => setSent(true), 650)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send. Try again or reach me on LinkedIn.")
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[520px] flex-col items-start justify-center rounded-[28px] border border-hairline p-10 animate-in fade-in zoom-in-95 duration-500">
        <p className="text-5xl font-semibold tracking-tighter">Got it.</p>
        <p className="mt-4 max-w-sm text-lg text-muted-foreground">Thanks for reaching out. You'll hear from me within a day.</p>
        <button
          onClick={() => {
            setSent(false)
            setJustSent(false)
          }}
          className="mt-8 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-medium">What do you need?</legend>
        <ToggleGroup type="multiple" value={kind} onValueChange={setKind} className="flex w-full flex-wrap justify-start" spacing={2}>
          {kinds.map((k, i) => (
            <ToggleGroupItem key={k} value={k} style={{ animationDelay: `${i * 60}ms` }} className={pill}>
              {k}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="group space-y-2">
          <Label htmlFor="name" className={fieldLabel}>
            Name
          </Label>
          <Input id="name" name="name" required maxLength={120} autoComplete="name" placeholder="Your name" className={field} />
        </div>
        <div className="group space-y-2">
          <Label htmlFor="email" className={fieldLabel}>
            Email
          </Label>
          <Input id="email" name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@company.com" className={field} />
        </div>
        <div className="group space-y-2 sm:col-span-2">
          <Label htmlFor="company" className={fieldLabel}>
            Company <span className="text-dim">(optional)</span>
          </Label>
          <Input id="company" name="company" maxLength={120} autoComplete="organization" placeholder="Where you work" className={field} />
        </div>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-medium">
          Budget <span className="text-dim">(freelance only)</span>
        </legend>
        <ToggleGroup type="single" value={budget} onValueChange={setBudget} className="flex w-full flex-wrap justify-start" spacing={2}>
          {budgets.map((b, i) => (
            <ToggleGroupItem key={b} value={b} style={{ animationDelay: `${i * 60}ms` }} className={pill}>
              {b}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </fieldset>

      <div className="group space-y-2">
        <Label htmlFor="message" className={fieldLabel}>
          Tell me about it
        </Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder="What are you building, and where can I help?"
          className={cn(field, "h-auto min-h-40 py-3")}
        />
      </div>

      {/* Honeypot: humans never see this. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button
        type="submit"
        disabled={sending || justSent}
        className={cn(
          "group inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-background transition-all duration-500 hover:scale-[1.01] disabled:opacity-100 sm:w-auto sm:px-10",
          justSent ? "bg-[#34c759] scale-[1.03]" : "bg-foreground",
        )}
      >
        {sending && <Loader2 className="size-4 animate-spin" />}
        {justSent && <Check className="size-4 animate-in zoom-in-50 duration-300" />}
        {justSent ? "Sent" : sending ? "Sending" : "Send message"}
        {!sending && !justSent && <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
      </button>
    </form>
  )
}
