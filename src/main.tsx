import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import App from "./App"
import "./index.css"

// Every visit starts at the hero; Lenis owns scroll position after that.
if ("scrollRestoration" in history) history.scrollRestoration = "manual"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
