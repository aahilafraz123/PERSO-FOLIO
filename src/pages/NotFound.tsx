import { Link } from "react-router"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function NotFound() {
  usePageMeta("Not found — Aahil Afraz")
  return (
    <main className="theme-light container-x flex min-h-[80svh] flex-col items-center justify-center text-center">
      <p className="display-xl text-titanium">404</p>
      <p className="mt-6 text-lg text-muted-foreground">This page doesn't exist.</p>
      <Link to="/work" className="mt-10 inline-flex h-12 items-center rounded-full bg-foreground px-6 text-[15px] font-semibold text-background">
        See my projects
      </Link>
    </main>
  )
}
