import { useLocation } from "react-router"

/** "/work/aircast" -> "work". Sub-routes (like project dialogs) don't count as page changes. */
export function useSectionKey() {
  const { pathname } = useLocation()
  return pathname.split("/")[1] || "home"
}
