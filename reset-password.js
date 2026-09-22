(function () {
  const $ = (s) => document.querySelector(s);
  let db;

  function status(text, ok = null) {
    const el = $('#reset-message');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'form-message' + (ok === true ? ' form-success' : ok === false ? ' form-error' : '');
  }

  async function boot() {
    try {
      db = window.getBaptoSupabase();
      const { data: { session } } = await db.auth.getSession();
      if (session) status('Recovery session verified. Enter your new password.', true);
      else status('Open this page from the password-reset email link.', false);
    } catch (err) {
      status(err?.message || String(err), false);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    boot();
    $('#reset-password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.currentTarget.querySelector('button[type="submit"]');
      const p1 = $('#new-password').value;
      const p2 = $('#confirm-password').value;
      if (p1.length < 8) return status('Use at least 8 characters.', false);
      if (p1 !== p2) return status('Passwords do not match.', false);

      btn.disabled = true;
      btn.textContent = 'Updating…';
      status('Updating password…');
      try {
        db = db || window.getBaptoSupabase();
        const { error } = await db.auth.updateUser({ password: p1 });
        if (error) throw error;
        status('Password updated. Redirecting to admin login…', true);
        await db.auth.signOut();
        setTimeout(() => window.location.replace('/admin'), 1200);
      } catch (err) {
        status(err?.message || String(err), false);
        btn.disabled = false;
        btn.textContent = 'Update Password';
      }
    });
  });
})();
