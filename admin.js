(function () {
  let db;
  const $ = (s) => document.querySelector(s);
  const MASTER_EMAIL = 'bapnationalcom@gmail.com';

  function status(text, ok = null) {
    const el = $('#login-message');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'form-message' + (ok === true ? ' form-success' : ok === false ? ' form-error' : '');
  }

  function friendly(err) {
    const m = (err?.message || String(err) || 'Unknown error').trim();
    if (/invalid login credentials/i.test(m)) return 'Invalid email or password. Use “Forgot password?” to set a new password.';
    if (/email not confirmed/i.test(m)) return 'This Supabase user is not confirmed yet. Confirm it in Authentication → Users.';
    if (/failed to fetch|network|timed out|load failed/i.test(m)) return 'Cannot reach Supabase. Check the project status and internet connection.';
    return m;
  }

  async function verifyAdmin(user) {
    const { data, error } = await db
      .from('profiles')
      .select('id,full_name,role,region_id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw new Error(`Authentication worked, but the admin profile could not be read: ${error.message}`);
    if (!data) throw new Error(`Authentication worked, but no admin profile exists for ${user.email}. Run FIX_ADMIN_LOGIN.sql.`);
    if (!['master_admin', 'regional_admin'].includes(data.role)) {
      throw new Error(`Authentication worked, but this account has role "${data.role}" instead of master_admin.`);
    }
    return data;
  }

  async function testConnection() {
    const btn = $('#test-connection-btn');
    if (btn) btn.disabled = true;
    status('Testing Supabase connection…');
    try {
      db = db || window.getBaptoSupabase();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${window.BAPTO_SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: window.BAPTO_SUPABASE_PUBLISHABLE_KEY || window.BAPTO_SUPABASE_ANON_KEY },
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Supabase returned HTTP ${res.status}.`);
      status('Supabase connection is working. You can sign in.', true);
    } catch (err) {
      status(friendly(err), false);
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function sendResetEmail() {
    const btn = $('#forgot-password-btn');
    const email = ($('#login-email')?.value || MASTER_EMAIL).trim();
    if (!email) {
      status('Enter your admin email first.', false);
      return;
    }

    btn.disabled = true;
    status('Sending password reset email…');
    try {
      db = db || window.getBaptoSupabase();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      status(`Password reset email requested for ${email}. Check the inbox and spam folder.`, true);
    } catch (err) {
      status(friendly(err), false);
    } finally {
      btn.disabled = false;
    }
  }

  async function boot() {
    try {
      db = window.getBaptoSupabase();
      const { data: { session } } = await db.auth.getSession();
      if (session?.user) {
        status('Existing session found. Opening Master Page…', true);
        try {
          await verifyAdmin(session.user);
          window.location.replace('/master');
        } catch (err) {
          await db.auth.signOut();
          status(friendly(err), false);
        }
      }
    } catch (err) {
      status(friendly(err), false);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const email = $('#login-email');
    if (email && !email.value) email.value = MASTER_EMAIL;
    boot();
    $('#test-connection-btn')?.addEventListener('click', testConnection);
    $('#forgot-password-btn')?.addEventListener('click', sendResetEmail);

    $('#login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submit = e.currentTarget.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Signing In…';
      status('Signing in to Supabase…');

      try {
        db = db || window.getBaptoSupabase();
        const emailValue = $('#login-email').value.trim();
        const password = $('#login-password').value;
        const { data, error } = await db.auth.signInWithPassword({ email: emailValue, password });
        if (error) throw error;
        if (!data?.user) throw new Error('Supabase did not return a signed-in user.');

        status('Authentication successful. Checking Master Admin access…', true);
        await verifyAdmin(data.user);

        status('Access confirmed. Opening Master Page…', true);
        window.location.replace('/master');
      } catch (err) {
        status(friendly(err), false);
        try { await db?.auth?.signOut(); } catch (_) {}
        submit.disabled = false;
        submit.textContent = 'Sign In';
      }
    });
  });
})();
