// Build: 2026-03-13
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";

// Глобальная обработка устаревших динамических импортов (после деплоя / рестарта Vite).
// Стратегия:
//  1) Пытаемся автоматически очистить клиентский кеш: service workers + Cache Storage.
//  2) Делаем одну повторную попытку динамического импорта того же модуля (retry).
//  3) Если не получилось — показываем toast с кнопкой hard reload.

const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|error loading dynamically imported module/i;

const STORAGE_FLAG = "__sw_cache_cleared_at";

let handling = false;
let toastShown = false;

/** Снимаем все SW и чистим Cache Storage. Безопасно, даже если SW нет. */
async function clearClientCaches(): Promise<void> {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
    }
  } catch (e) {
    console.warn("[app] SW unregister failed", e);
  }

  try {
    if (typeof caches !== "undefined" && caches?.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
    }
  } catch (e) {
    console.warn("[app] Cache Storage clear failed", e);
  }
}

/** Извлечь URL модуля из сообщения об ошибке, если возможно. */
function extractModuleUrl(message: string): string | null {
  const m = message.match(/https?:\/\/\S+?\.(?:m?js|tsx?|jsx?)(?:\?[^\s"')]+)?/i);
  return m ? m[0] : null;
}

/** Попробовать перезагрузить модуль с cache-busting параметром. */
async function retryDynamicImport(url: string): Promise<boolean> {
  try {
    const bust = `cb=${Date.now()}`;
    const sep = url.includes("?") ? "&" : "?";
    await import(/* @vite-ignore */ `${url}${sep}${bust}`);
    console.info("[app] Module re-imported successfully:", url);
    return true;
  } catch (e) {
    console.warn("[app] Retry import failed:", e);
    return false;
  }
}

function showReloadToast() {
  if (toastShown) return;
  toastShown = true;
  try {
    toast.error("Обновите страницу", {
      description:
        "Приложение было обновлено. Нажмите Ctrl+Shift+R (или Cmd+Shift+R на Mac), чтобы загрузить новую версию.",
      duration: 20000,
      action: {
        label: "Обновить",
        onClick: () => window.location.reload(),
      },
    });
  } catch {
    if (confirm("Приложение обновлено. Перезагрузить страницу?")) {
      window.location.reload();
    }
  }
}

async function handleStaleChunk(message: string) {
  if (handling) return;
  handling = true;
  console.warn("[app] Stale dynamic module detected — clearing caches & retrying.", message);

  // Защита от цикла: если недавно уже чистили кеш в этой сессии — сразу показываем toast.
  const lastCleared = Number(sessionStorage.getItem(STORAGE_FLAG) || 0);
  const recentlyCleared = Date.now() - lastCleared < 30_000;

  if (!recentlyCleared) {
    await clearClientCaches();
    sessionStorage.setItem(STORAGE_FLAG, String(Date.now()));

    const url = extractModuleUrl(message);
    if (url) {
      const ok = await retryDynamicImport(url);
      if (ok) {
        toast.success("Модуль успешно перезагружен");
        handling = false;
        return;
      }
    }
  }

  showReloadToast();
  handling = false;
}

window.addEventListener("error", (event) => {
  const msg = event?.message || String(event?.error || "");
  if (CHUNK_ERROR_RE.test(msg)) void handleStaleChunk(msg);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason: any = event?.reason;
  const msg = reason?.message || String(reason || "");
  if (CHUNK_ERROR_RE.test(msg)) void handleStaleChunk(msg);
});

createRoot(document.getElementById("root")!).render(<App />);
