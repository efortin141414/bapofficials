// BAPTO Supabase browser configuration
// Public values only. Never place a service_role/secret key in frontend files.
(function () {
  const SUPABASE_URL = 'https://fizyesuapokjgfviwulr.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5A_bGnTjTsr81-wjS2sQSg_0Qk1PwkR';

  window.BAPTO_SUPABASE_URL = SUPABASE_URL;
  window.BAPTO_SUPABASE_ANON_KEY = SUPABASE_PUBLISHABLE_KEY;
  window.BAPTO_SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;

  window.getBaptoSupabase = function getBaptoSupabase() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase library did not load. Check your internet connection and reload the page.');
    }

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('Supabase configuration is missing.');
    }

    if (!window.__baptoSupabase) {
      window.__baptoSupabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
    }

    return window.__baptoSupabase;
  };
})();
