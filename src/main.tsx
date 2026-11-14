import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// P6 S1 (DL-P33): self-hosted variable fonts, OFL-1.1 (no requests to Google)
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./index.css";

// A page opened before a new release asks for program parts of the OLD release (e.g. the Word builder), which are no
// longer on the server ("Failed to fetch dynamically imported module", Director 2026-11-14). Load the new release
// once instead of showing an error. At most once a minute, so a real outage cannot cause a reload loop.
window.addEventListener("vite:preloadError", (event) => {
  const KEY = "ibl-reload-after-release";
  let last = 0;
  try { last = Number(sessionStorage.getItem(KEY) ?? 0); } catch { /* storage blocked: reload anyway, once */ }
  if (Date.now() - last < 60_000) return; // already reloaded just now: let the error show
  try { sessionStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ }
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
