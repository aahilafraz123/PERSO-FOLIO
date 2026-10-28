import { useSyncExternalStore } from "react"

/**
 * Whether the footer's player slot is on screen. While it is, the floating MiniPlayer steps
 * aside and the footer shows the same card inline, so the player "docks" instead of covering
 * the footer's bottom row.
 */
let docked = false
const listeners = new Set<() => void>()

export function setPlayerDocked(v: boolean) {
  if (v === docked) return
  docked = v
  listeners.forEach((l) => l())
}

export function usePlayerDocked() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => docked,
    () => false,
  )
}
