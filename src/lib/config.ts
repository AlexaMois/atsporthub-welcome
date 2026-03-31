// Supabase project configuration — pulled from env
// VITE_SUPABASE_PROJECT_ID is always correct and provided by Lovable Cloud
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
export const SUPABASE_URL: string = `https://${PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const FUNC_URL = `${SUPABASE_URL}/functions/v1/bpium-api`;
