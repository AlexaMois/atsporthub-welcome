// Build: 2026-03-13
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";

// Глобальный обработчик устаревших динамических импортов (после деплоя / рестарта Vite).
// Показываем пользователю понятное сообщение и подсказку: сделать hard reload.
const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|error loading dynamically imported module/i;

let notified = false;
const notifyStaleChunk = () => {
  if (notified) return;
  notified = true;
  console.warn("[app] Stale module detected — prompting user to hard reload.");
  try {
    toast.error("Обновите страницу", {
      description:
        "Приложение было обновлено. Нажмите Ctrl+Shift+R (или Cmd+Shift+R на Mac), чтобы загрузить новую версию.",
      duration: 15000,
      action: {
        label: "Обновить",
        onClick: () => window.location.reload(),
      },
    });
  } catch {
    // Если toast недоступен (ранний этап загрузки) — показываем нативный alert
    if (confirm("Приложение обновлено. Перезагрузить страницу?")) {
      window.location.reload();
    }
  }
};

window.addEventListener("error", (event) => {
  const msg = event?.message || String(event?.error || "");
  if (CHUNK_ERROR_RE.test(msg)) notifyStaleChunk();
});

window.addEventListener("unhandledrejection", (event) => {
  const reason: any = event?.reason;
  const msg = reason?.message || String(reason || "");
  if (CHUNK_ERROR_RE.test(msg)) notifyStaleChunk();
});

createRoot(document.getElementById("root")!).render(<App />);
