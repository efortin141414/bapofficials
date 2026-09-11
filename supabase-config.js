// BAPTO Supabase public configuration.
// Replace the two placeholder values with your Supabase Project URL and anon/public key.
// NEVER place the service_role key in this file.
window.BAPTO_SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
window.BAPTO_SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

window.getBaptoSupabase = function getBaptoSupabase() {
  if (!window.supabase) throw new Error('Supabase library did not load.');
  const url = window.BAPTO_SUPABASE_URL;
  const key = window.BAPTO_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('YOUR-PROJECT') || key.includes('YOUR_SUPABASE')) {
    throw new Error('Supabase is not configured yet. Update supabase-config.js.');
  }
  if (!window.__baptoSupabase) {
    window.__baptoSupabase = window.supabase.createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
  return window.__baptoSupabase;
};
