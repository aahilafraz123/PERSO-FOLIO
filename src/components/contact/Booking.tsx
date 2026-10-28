import { useEffect } from "react"
import Cal, { getCalApi } from "@calcom/embed-react"
import { CalendarDays } from "lucide-react"
import { profile } from "@/content/profile"

export function Booking() {
  const link = profile.calLink

  useEffect(() => {
    if (!link) return
    ;(async () => {
      const cal = await getCalApi()
      cal("ui", {
        theme: "light",
        hideEventTypeDetails: false,
        layout: "month_view",
        cssVarsPerTheme: {
          light: {
            "cal-brand": "#1d1d1f",
            "cal-brand-emphasis": "#000000",
            "cal-brand-text": "#ffffff",
            "cal-bg": "#ffffff",
            "cal-bg-emphasis": "#f5f5f7",
            "cal-bg-subtle": "#fafafa",
            "cal-border": "#e5e5ea",
            "cal-border-subtle": "#f0f0f2",
            "cal-border-booker": "#e5e5ea",
            "cal-text": "#424245",
            "cal-text-emphasis": "#1d1d1f",
            "cal-text-subtle": "#6e6e73",
          },
          dark: {
            "cal-brand": "#f5f5f7",
            "cal-brand-emphasis": "#ffffff",
            "cal-brand-text": "#050505",
            "cal-bg": "#0a0a0b",
            "cal-bg-emphasis": "#1c1c1f",
            "cal-bg-subtle": "#141416",
            "cal-bg-muted": "#0d0d0f",
            "cal-border": "#232326",
            "cal-border-subtle": "#1c1c1f",
            "cal-border-booker": "#1c1c1f",
            "cal-text": "#d2d2d7",
            "cal-text-emphasis": "#f5f5f7",
            "cal-text-subtle": "#a1a1a6",
            "cal-text-muted": "#6e6e73",
          },
        },
      })
    })()
  }, [link])

  if (!link) {
    return (
      <div className="flex h-full min-h-[520px] flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-hairline p-10 text-center">
        <CalendarDays className="size-10 text-dim" />
        <p className="text-xl font-semibold">Booking calendar goes here.</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Add your Cal.com link to <code className="font-mono text-foreground">calLink</code> in <code className="font-mono text-foreground">src/content/profile.ts</code>.
        </p>
      </div>
    )
  }

  return (
    // Cal's page inside the iframe reports color-scheme: dark even with theme "light", and Cal's
    // embed CSS makes the iframe inherit its scheme from here (`color-scheme: unset !important`).
    // When the two differ, Chrome paints an opaque black backdrop around the booker card on wide
    // screens. Matching them keeps the iframe transparent; this wrapper has no background, so
    // nothing else changes.
    <div data-lenis-prevent className="relative min-h-[520px] [color-scheme:dark]">
      <Cal calLink={link} style={{ width: "100%", height: "100%", overflow: "auto" }} config={{ layout: "month_view", theme: "light", overlayCalendar: "true" }} />
    </div>
  )
}
