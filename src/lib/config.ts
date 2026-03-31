// Supabase project configuration — pulled from environment variables
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
export const FUNC_URL = `${SUPABASE_URL}/functions/v1/bpium-api`;
