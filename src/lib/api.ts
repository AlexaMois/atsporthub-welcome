import { FUNC_URL } from "@/lib/config";

const REQUEST_TIMEOUT_MS = 15_000;

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

/**
 * Safe fetch wrapper for bpium-api edge function calls.
 * - AbortController timeout
 * - Safe JSON parsing (non-JSON bodies won't crash)
 * - Unified result format
 */
export async function apiCall<T = any>(
  action: string,
  body?: Record<string, unknown>,
  method: "GET" | "POST" = "POST",
  token?: string
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${FUNC_URL}?action=${action}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    let data: any = null;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      // non-JSON response
    }

    return { ok: res.ok, status: res.status, data, error: null };
  } catch (err: any) {
    const error =
      err.name === "AbortError"
        ? "Превышено время ожидания. Проверьте интернет."
        : "Нет связи с сервером. Проверьте интернет.";
    return { ok: false, status: 0, data: null, error };
  } finally {
    clearTimeout(timer);
  }
}

/** Safe JSON parse with fallback */
export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export async function askRag(question: string): Promise<{ answer: string }> {
  const token = localStorage.getItem("user_token");
  const result = await apiCall<{ answer: string }>("ask-rag", { question }, "POST", token ?? undefined);
  if (!result.ok || !result.data) {
    throw new Error(result.error ?? (result.data as any)?.error ?? "RAG service unavailable");
  }
  return { answer: result.data.answer };
}
