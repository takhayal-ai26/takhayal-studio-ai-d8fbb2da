import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppLoader } from "./components/AppLoader";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
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

const prerenderedSeoContent = document.getElementById("seo-static-content");
if (prerenderedSeoContent) {
  prerenderedSeoContent.remove();
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <AppLoader>
      <App />
    </AppLoader>
  </AppErrorBoundary>
);
