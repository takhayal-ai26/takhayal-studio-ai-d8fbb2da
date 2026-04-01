import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

function clearCorruptLocalStorage() {
  if (typeof window === "undefined") return;

  const jsonKeys = [
    "takhayal-admin-media",
    "takhayal-admin-tools",
    "takhayal-admin-templates",
    "takhayal-translation-overrides",
    "dashboard_home_hero_config_cache",
  ];

  for (const key of jsonKeys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      JSON.parse(raw);
    } catch {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore storage access issues
      }
    }
  }
}

clearCorruptLocalStorage();

createRoot(document.getElementById("root")!).render(<App />);
