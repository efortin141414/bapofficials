(function () {
  let db, profile, regions = [], memberCache = [];
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl = (v = '') => /^https:\/\//i.test(v) ? v : '';

  function setLoading(text, error = false) {
    const el = $('#master-loading-message');
    if (el) {
      el.textContent = text;
      el.className = error ? 'form-error' : '';
    }
  }
  function dashboardStatus(text, error = false) {
    const el = $('#dashboard-status');
    if (!el) return;
    if (!text) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.textContent = text;
    el.className = 'dashboard-status ' + (error ? 'error' : 'success');
  }
  function msg(form, text, ok = true) {
    const el = form.querySelector('.form-message');
    if (el) { el.textContent = text; el.className = 'form-message ' + (ok ? 'form-success' : 'form-error'); }
  }
  function friendly(err) {
    const m = (err?.message || String(err) || 'Unknown error').trim();
    if (/row-level security|permission denied/i.test(m)) return `Permission problem: ${m}. Check the Supabase RLS policies in database.sql.`;
    if (/failed to fetch|network|load failed/i.test(m)) return 'Cannot reach Supabase. Check the project status and internet connection.';
    return m;
  }
  function fileExt(file) {
    const p = file.name.split('.');
    return (p.pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  }
  async function upload(file, prefix) {
    if (!file) return null;
    const path = `${prefix}/${Date.now()}-${crypto.randomUUID()}.${fileExt(file)}`;
    const { error } = await db.storage.from('media').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data } = db.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  }
  function canManageRegion(regionId) {
    return profile.role === 'master_admin' || (profile.role === 'regional_admin' && profile.region_id === regionId);
  }
  function show(view) {
    $$('.admin-view').forEach(x => x.classList.toggle('active', x.id === `view-${view}`));
    $$('#admin-nav button').forEach(x => x.classList.toggle('active', x.dataset.view === view));
    const title = $(`#admin-nav button[data-view="${view}"]`)?.textContent || 'Dashboard';
    if ($('#view-title')) $('#view-title').textContent = title;
  }

  async function requireSessionAndProfile() {
    setLoading('Checking your Supabase session…');
    const { data: { session }, error: sessionError } = await db.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) {
      window.location.replace('/admin');
      return false;
    }

    setLoading('Verifying Master Admin access…');
    const { data, error } = await db
      .from('profiles')
      .select('id,full_name,role,region_id')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) throw new Error(`Could not read admin profile: ${error.message}`);
    if (!data) throw new Error('No admin profile exists for this signed-in account. Run FIX_ADMIN_LOGIN.sql.');
    if (!['master_admin', 'regional_admin'].includes(data.role)) throw new Error(`This account has role "${data.role}" and does not have admin access.`);

    profile = data;
    $('#admin-user').textContent = `${data.full_name || session.user.email} • ${data.role.replace('_', ' ')}`;
    return true;
  }

  async function loadRegions() {
    const { data, error } = await db.from('regions').select('id,code,name,sort_order').eq('active', true).order('sort_order');
    if (error) throw error;
    regions = data || [];
    $$('.region-select').forEach(s => {
      const keep = s.querySelector('option[value=""]')?.outerHTML || '';
      s.innerHTML = keep + regions
        .filter(r => profile.role === 'master_admin' || r.id === profile.region_id)
        .map(r => `<option value="${r.id}">${esc(r.code)} — ${esc(r.name)}</option>`)
        .join('');
    });
  }

  async function stats() {
    const tables = ['announcements', 'gallery', 'regional_posters', 'members'];
    const els = $$('#stats .stat strong');
    for (let i = 0; i < tables.length; i++) {
      try {
        let q = db.from(tables[i]).select('*', { count: 'exact', head: true });
        if (profile.role === 'regional_admin' && tables[i] !== 'announcements') q = q.eq('region_id', profile.region_id);
        const { count, error } = await q;
        if (error) throw error;
        els[i].textContent = count ?? '0';
      } catch (_) {
        els[i].textContent = '—';
      }
    }
  }

  async function loadAnnouncements() {
    const { data, error } = await db.from('announcements').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    $('#announcement-list').innerHTML = (data || []).map(r => {
      const imageUrl = safeUrl(r.image_url);
      const image = imageUrl
        ? `<a class="announcement-thumb-link" href="${esc(imageUrl)}" target="_blank" rel="noopener" title="Open full poster"><img class="announcement-thumb" src="${esc(imageUrl)}" alt="${esc(r.title)} poster" loading="lazy" onerror="this.closest('a').classList.add('image-load-failed'); this.remove();"></a>`
        : `<div class="announcement-no-image">No image</div>`;
      return `<div class="record-row announcement-record">${image}<div class="grow"><strong>${esc(r.title)}</strong><small>${esc(r.category || 'Announcement')} • ${r.published ? 'Published' : 'Draft'}</small>${imageUrl ? `<small class="image-status">Poster uploaded ✓</small>` : `<small class="image-status warning">No poster attached</small>`}</div><button data-del-ann="${r.id}">Delete</button></div>`;
    }).join('') || '<p>No announcements yet.</p>';
  }

  async function loadGallery() {
    let q = db.from('gallery').select('*,regions(code)').order('created_at', { ascending: false }).limit(100);
    if (profile.role === 'regional_admin') q = q.eq('region_id', profile.region_id);
    const { data, error } = await q;
    if (error) throw error;
    $('#gallery-list').innerHTML = (data || []).map(r => `<article class="record-card"><img src="${esc(safeUrl(r.image_url))}" alt=""><div><strong>${esc(r.album_name)}</strong><small>${esc(r.regions?.code || 'National')}</small><br><button data-del-gallery="${r.id}">Delete</button></div></article>`).join('') || '<p>No gallery photos yet.</p>';
  }

  async function loadPosters() {
    let q = db.from('regional_posters').select('*,regions(code,name)').order('created_at', { ascending: false });
    if (profile.role === 'regional_admin') q = q.eq('region_id', profile.region_id);
    const { data, error } = await q;
    if (error) throw error;
    $('#region-poster-list').innerHTML = (data || []).map(r => `<article class="record-card"><img src="${esc(safeUrl(r.image_url))}" alt=""><div><strong>${esc(r.person_name || r.title)}</strong><small>${esc(r.position || '')} • ${esc(r.regions?.code || '')}</small><br><button data-del-poster="${r.id}">Delete</button></div></article>`).join('') || '<p>No regional posters yet.</p>';
  }

  function renderAdminMembers() {
    const q = ($('#admin-member-search')?.value || '').toLowerCase();
    const rows = memberCache.filter(r => `${r.member_id} ${r.first_name} ${r.middle_name || ''} ${r.last_name}`.toLowerCase().includes(q));
    $('#member-list').innerHTML = rows.map(r => `<div class="record-row">${r.photo_url ? `<img src="${esc(safeUrl(r.photo_url))}" alt="">` : ''}<div class="grow"><strong>${esc([r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' '))}</strong><small>${esc(r.member_id)} • ${esc(r.regions?.code || '')} • ${r.active ? 'Active' : 'Inactive'}</small></div><button data-del-member="${r.id}">Delete</button></div>`).join('') || '<p>No members found.</p>';
  }

  async function loadMembers() {
    let q = db.from('members').select('id,member_id,first_name,middle_name,last_name,photo_url,active,region_id,regions(code)').order('last_name');
    if (profile.role === 'regional_admin') q = q.eq('region_id', profile.region_id);
    const { data, error } = await q;
    if (error) throw error;
    memberCache = data || [];
    renderAdminMembers();
  }

  async function refreshNonBlocking() {
    const jobs = [
      ['statistics', stats],
      ['announcements', loadAnnouncements],
      ['gallery', loadGallery],
      ['regional posters', loadPosters],
      ['members', loadMembers]
    ];
    const results = await Promise.allSettled(jobs.map(([, fn]) => fn()));
    const failed = results.map((r, i) => r.status === 'rejected' ? `${jobs[i][0]}: ${friendly(r.reason)}` : null).filter(Boolean);
    if (failed.length) dashboardStatus(`Master Page opened, but some data could not load yet. ${failed.join(' | ')}`, true);
    else dashboardStatus('Master Page connected to Supabase successfully.', false);
  }

  function bindForms() {
    $('#admin-member-search')?.addEventListener('input', renderAdminMembers);

    // Show the announcement poster immediately after choosing a file.
    const announcementImageInput = $('#announcement-form input[name="image"]');
    announcementImageInput?.addEventListener('change', () => {
      const file = announcementImageInput.files?.[0];
      const preview = $('#announcement-image-preview');
      if (!preview) return;
      if (!file) { preview.hidden = true; preview.removeAttribute('src'); return; }
      const oldUrl = preview.dataset.objectUrl;
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      const objectUrl = URL.createObjectURL(file);
      preview.dataset.objectUrl = objectUrl;
      preview.src = objectUrl;
      preview.hidden = false;
    });

    $('#announcement-form')?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; msg(f, 'Saving…');
      try {
        const fd = new FormData(f);
        const selectedFile = fd.get('image');
        const image = selectedFile?.size ? await upload(selectedFile, 'announcements') : null;
        if (selectedFile?.size && !image) throw new Error('The poster upload did not return a public image URL.');
        const { error } = await db.from('announcements').insert({ title: fd.get('title'), category: fd.get('category') || null, event_date: fd.get('event_date') || null, body: fd.get('body') || null, image_url: image, published: fd.get('published') === 'on', published_at: fd.get('published') === 'on' ? new Date().toISOString() : null, created_by: profile.id });
        if (error) throw error;
        f.reset();
        const preview = $('#announcement-image-preview');
        if (preview) {
          const oldUrl = preview.dataset.objectUrl;
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          preview.hidden = true;
          preview.removeAttribute('src');
          delete preview.dataset.objectUrl;
        }
        msg(f, image ? 'Announcement saved and poster uploaded.' : 'Announcement saved without a poster.');
        await refreshNonBlocking();
      } catch (err) { msg(f, friendly(err), false); }
    });

    $('#gallery-form')?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; msg(f, 'Uploading…');
      try {
        const fd = new FormData(f); const regionId = fd.get('region_id') || null;
        if (regionId && !canManageRegion(regionId)) throw new Error('You cannot manage this region.');
        const image = await upload(fd.get('image'), 'gallery');
        const { error } = await db.from('gallery').insert({ album_name: fd.get('album_name'), region_id: regionId, event_date: fd.get('event_date') || null, caption: fd.get('caption') || null, image_url: image, published: fd.get('published') === 'on', created_by: profile.id });
        if (error) throw error; f.reset(); msg(f, 'Gallery photo uploaded.'); await refreshNonBlocking();
      } catch (err) { msg(f, friendly(err), false); }
    });

    $('#region-poster-form')?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; msg(f, 'Uploading…');
      try {
        const fd = new FormData(f); const regionId = fd.get('region_id');
        if (!canManageRegion(regionId)) throw new Error('You cannot manage this region.');
        const image = await upload(fd.get('image'), 'regional-posters');
        const { error } = await db.from('regional_posters').insert({ region_id: regionId, person_name: fd.get('person_name'), position: fd.get('position') || null, caption: fd.get('caption') || null, image_url: image, published: fd.get('published') === 'on', created_by: profile.id });
        if (error) throw error; f.reset(); msg(f, 'Regional poster uploaded.'); await refreshNonBlocking();
      } catch (err) { msg(f, friendly(err), false); }
    });

    $('#member-form')?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; msg(f, 'Saving…');
      try {
        const fd = new FormData(f); const regionId = fd.get('region_id');
        if (!canManageRegion(regionId)) throw new Error('You cannot manage this region.');
        const image = fd.get('image')?.size ? await upload(fd.get('image'), 'member-photos') : null;
        const payload = { member_id: fd.get('member_id'), region_id: regionId, first_name: fd.get('first_name'), middle_name: fd.get('middle_name') || null, last_name: fd.get('last_name'), position: fd.get('position') || null, accreditation_level: fd.get('accreditation_level') || null, valid_until: fd.get('valid_until') || null, photo_url: image, active: fd.get('active') === 'on', public_profile: fd.get('public_profile') === 'on', created_by: profile.id };
        const { error } = await db.from('members').insert(payload);
        if (error) throw error; f.reset(); msg(f, 'Member saved.'); await refreshNonBlocking();
      } catch (err) { msg(f, friendly(err), false); }
    });

    document.body.addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return;
      let table, id;
      if (b.dataset.delAnn) { table = 'announcements'; id = b.dataset.delAnn; }
      if (b.dataset.delGallery) { table = 'gallery'; id = b.dataset.delGallery; }
      if (b.dataset.delPoster) { table = 'regional_posters'; id = b.dataset.delPoster; }
      if (b.dataset.delMember) { table = 'members'; id = b.dataset.delMember; }
      if (!table) return;
      if (!confirm('Delete this record?')) return;
      const { error } = await db.from(table).delete().eq('id', id);
      if (error) alert(friendly(error)); else await refreshNonBlocking();
    });
  }

  async function boot() {
    try {
      db = window.getBaptoSupabase();
      const ok = await requireSessionAndProfile();
      if (!ok) return;

      // Important fix: show the Master Page immediately after session + role are verified.
      // Optional data loading can no longer trap the user on the login page.
      $('#master-loading').hidden = true;
      $('#app-view').hidden = false;
      bindForms();
      $$('#admin-nav button').forEach(b => b.addEventListener('click', () => show(b.dataset.view)));
      $('#logout-btn')?.addEventListener('click', async () => { await db.auth.signOut(); window.location.replace('/admin'); });

      try { await loadRegions(); }
      catch (err) { dashboardStatus(`Master Page opened, but regions could not load: ${friendly(err)}`, true); }

      await refreshNonBlocking();
    } catch (err) {
      setLoading(friendly(err), true);
      const back = document.createElement('p');
      back.innerHTML = '<a href="/admin">← Return to Admin Login</a>';
      document.querySelector('.master-loading-card')?.appendChild(back);
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
