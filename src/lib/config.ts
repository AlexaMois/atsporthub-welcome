// Supabase project configuration — pulled from env
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const FUNC_URL = `${SUPABASE_URL}/functions/v1/bpium-api`;
console.log("[config] FUNC_URL =", FUNC_URL);
