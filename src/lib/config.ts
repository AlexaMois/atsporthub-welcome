// Supabase project configuration
// NOTE: VITE_SUPABASE_URL from env may be stale after project migration.
// We derive the URL from the known project ref to guarantee correctness.
const PROJECT_REF = "piivkjefugxyagwxriok";
export const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const FUNC_URL = `${SUPABASE_URL}/functions/v1/bpium-api`;
