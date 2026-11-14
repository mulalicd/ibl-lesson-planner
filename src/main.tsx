import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// P6 S1 (DL-P33): self-hosted variable fonts, OFL-1.1 (no requests to Google)
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
