import { useEffect, useRef, useState } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { AlignLeft, Image as ImageIcon, Maximize2, Minimize2, X } from "lucide-react"
import type { Email, Receipt } from "@/content/projects"
import { cn } from "@/lib/utils"

/** The screenshot, framed like a mail window. Click it to read it full size. */
export function ProofShot({ receipt, className }: { receipt: Receipt; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn("group block w-full overflow-hidden rounded-2xl bg-white text-left ring-1 ring-black/[0.08] shadow-[0_20px_50px_-24px_rgb(0_0_0/0.35)]", className)}
        aria-label={`Enlarge: ${receipt.alt}`}
      >
        <span className="flex items-center gap-2 border-b border-black/[0.06] bg-[#f5f5f7] px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate font-mono text-[11px] text-[#6e6e73]">{receipt.caption}</span>
        </span>
        <span className="relative block overflow-hidden">
          <img src={receipt.src} alt={receipt.alt} width={receipt.width} height={receipt.height} className="block h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
          <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors duration-500 group-hover:bg-black/25">
            <span className="inline-flex translate-y-2 items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2.5 text-sm font-semibold text-white opacity-0 shadow-lg transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
              <Maximize2 className="size-4" /> Enlarge to read
            </span>
          </span>
        </span>
      </button>
      <ProofLightbox receipt={open ? receipt : null} onClose={() => setOpen(false)} />
    </>
  )
}

/**
 * Full-screen reader for a proof screenshot. "Fit" shows the whole email as large as the
 * screen allows (never past its legible width); "Actual size" shows it at the legible width
 * and lets you drag to pan, which is what phones need. "Text" swaps in a transcription.
 */
export function ProofLightbox({
  receipt,
  onClose,
  initialMode,
}: {
  receipt: Receipt | null
  onClose: () => void
  /** Open straight to a view, e.g. "text" for reading the note. */
  initialMode?: "fit" | "actual" | "text"
}) {
  const [mode, setMode] = useState<"fit" | "actual" | "text">("fit")
  const scroller = useRef<HTMLDivElement>(null)

  // Default per screen: wide screens can fit it legibly, narrow ones need actual size.
  useEffect(() => {
    if (!receipt) return
    if (initialMode === "text" && receipt.email) setMode("text")
    else setMode(initialMode && initialMode !== "text" ? initialMode : window.innerWidth >= 1100 ? "fit" : "actual")
  }, [receipt, initialMode])

  // Drag to pan at actual size.
  useEffect(() => {
    const el = scroller.current
    if (!el || mode !== "actual") return
    let sx = 0, sy = 0, sl = 0, st = 0, down = false
    const start = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return // touch pans natively
      down = true
      sx = e.clientX; sy = e.clientY; sl = el.scrollLeft; st = el.scrollTop
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!down) return
      el.scrollLeft = sl - (e.clientX - sx)
      el.scrollTop = st - (e.clientY - sy)
    }
    const end = () => (down = false)
    el.addEventListener("pointerdown", start)
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", end)
    el.addEventListener("pointercancel", end)
    return () => {
      el.removeEventListener("pointerdown", start)
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerup", end)
      el.removeEventListener("pointercancel", end)
    }
  }, [mode, receipt])

  const tab = (m: typeof mode, label: string, Icon: typeof Maximize2) => (
    <button
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors",
        mode === m ? "bg-white text-[#1d1d1f]" : "text-white/70 hover:text-white",
      )}
    >
      <Icon className="size-3.5" /> {label}
    </button>
  )

  return (
    <DialogPrimitive.Root open={!!receipt} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-[#050505]/90 backdrop-blur-md duration-300 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          data-lenis-prevent
          className="fixed inset-0 z-[80] flex flex-col outline-none duration-300 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0"
        >
          {receipt && (
            <>
              <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
                <div className="min-w-0">
                  <DialogPrimitive.Title className="truncate text-[15px] font-semibold text-white">{receipt.caption}</DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-xs text-white/50">{receipt.description ?? "The original email, unedited."}</DialogPrimitive.Description>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-full bg-white/10 p-1">
                    {tab("fit", "Fit", Minimize2)}
                    {tab("actual", "Actual size", Maximize2)}
                    {receipt.email && tab("text", "Text", AlignLeft)}
                  </div>
                  <DialogPrimitive.Close className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" aria-label="Close">
                    <X className="size-4" />
                  </DialogPrimitive.Close>
                </div>
              </header>

              <div
                ref={scroller}
                className={cn(
                  "min-h-0 flex-1 overflow-auto overscroll-contain px-3 pb-8 md:px-6",
                  mode === "actual" && "cursor-grab active:cursor-grabbing",
                )}
                onClick={(e) => e.target === e.currentTarget && onClose()}
              >
                <div className={cn("flex min-h-full flex-col justify-center", mode === "actual" && "w-max min-w-full")} onClick={(e) => e.target === e.currentTarget && onClose()}>
                {mode === "text" && receipt.email ? (
                  <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 md:p-12">
                    <EmailText email={receipt.email} />
                  </div>
                ) : (
                  <div className={cn("rounded-xl p-2 shadow-2xl md:p-4", receipt.dark ? "bg-[#1f1f1f]" : "bg-white", mode === "fit" ? "mx-auto w-full" : "w-max")} style={mode === "fit" ? { maxWidth: receipt.width + 32 } : undefined}>
                    <img
                      src={receipt.src}
                      alt={receipt.alt}
                      draggable={false}
                      width={receipt.width}
                      height={receipt.height}
                      className="block h-auto select-none"
                      style={mode === "fit" ? { width: "100%" } : { width: receipt.width, maxWidth: "none" }}
                    />
                  </div>
                )}
                {mode !== "text" && (
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-white/40">
                    <ImageIcon className="size-3.5" />
                    {mode === "fit" ? "Too small? Switch to Actual size." : "Drag or scroll to move around."}
                  </p>
                )}
                </div>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Transcription of a proof email, for screen readers and anyone who'd rather read text. */
export function EmailText({ email }: { email: Email }) {
  return (
    <div className="text-[#1d1d1f]">
      <header className="flex items-start gap-4 border-b border-black/[0.08] pb-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#1d1d1f] text-sm font-semibold text-white">
          {email.from
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[17px] font-semibold">{email.from}</p>
            {email.date && <p className="text-sm text-[#6e6e73]">{email.date}</p>}
          </div>
          {email.address && <p className="text-sm text-[#6e6e73]">{email.address}</p>}
          {email.to && <p className="mt-1 text-sm text-[#6e6e73]">To: {email.to}</p>}
        </div>
      </header>

      <div className="space-y-5 pt-6 text-[17px] leading-[1.7]">
        {email.body.map((line, i) => {
          switch (line.kind) {
            case "strong":
              return (
                <p key={i} className="font-semibold">
                  {line.text}
                </p>
              )
            case "heading":
              return (
                <p key={i} className="pt-2 text-lg font-semibold">
                  {line.text}
                </p>
              )
            case "quote":
              return (
                <blockquote key={i} className="border-l-2 border-[#1d1d1f] pl-5">
                  {line.text}
                </blockquote>
              )
            case "note":
              return (
                <p key={i} className="text-[15px] italic text-[#6e6e73]">
                  {line.text}
                </p>
              )
            default:
              return (
                <p key={i} className="whitespace-pre-line text-[#3a3a3c]">
                  {line.text}
                </p>
              )
          }
        })}
      </div>
    </div>
  )
}
