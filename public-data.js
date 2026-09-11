(function () {
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl = (v='') => /^https:\/\//i.test(v) ? v : '';
  const fmtDate = (v) => {
    if (!v) return '';
    const d = new Date(v + (v.length === 10 ? 'T00:00:00' : ''));
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
  };
  const placeholder = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="100%" height="100%" fill="#e9edf4"/><circle cx="400" cy="300" r="120" fill="#b7c2d3"/><rect x="210" y="455" width="380" height="180" rx="90" fill="#b7c2d3"/></svg>`);

  function showConfigNotice(err) {
    if (!String(err?.message || err).includes('not configured')) return;
    console.info('BAPTO dynamic content is waiting for Supabase configuration.');
  }

  async function loadAnnouncements(db) {
    const target = document.getElementById('dynamic-announcements');
    if (!target) return;
    const { data, error } = await db.from('announcements').select('*').eq('published', true).order('published_at', {ascending:false}).limit(9);
    if (error) throw error;
    if (!data?.length) return;
    document.getElementById('static-announcements')?.setAttribute('hidden','');
    target.innerHTML = data.map(a => `<article class="dynamic-card">
      ${a.image_url ? `<img src="${esc(safeUrl(a.image_url))}" alt="${esc(a.title)} poster" loading="lazy">` : ''}
      <div class="dynamic-card-body"><div class="dynamic-meta">${esc(a.category || 'Announcement')} • ${esc(fmtDate(a.event_date || a.published_at))}</div><h3>${esc(a.title)}</h3><p>${esc(a.body || '')}</p></div>
    </article>`).join('');
  }

  async function loadGallery(db) {
    const target = document.getElementById('dynamic-gallery');
    if (!target) return;
    const { data, error } = await db.from('gallery').select('*').eq('published', true).order('event_date', {ascending:false}).limit(16);
    if (error) throw error;
    if (!data?.length) return;
    document.getElementById('static-gallery')?.setAttribute('hidden','');
    target.innerHTML = data.map(g => `<figure class="gallery-live-item"><img src="${esc(safeUrl(g.image_url))}" alt="${esc(g.caption || g.album_name || 'BAPTO gallery photo')}" loading="lazy"><figcaption>${esc(g.caption || g.album_name || 'BAPTO Activity')}</figcaption></figure>`).join('');
  }

  async function loadRegionPosters(db) {
    const target = document.getElementById('dynamic-region-posters');
    if (!target) return;
    const { data, error } = await db.from('regional_posters').select('*, regions(code,name)').eq('published', true).order('created_at', {ascending:false});
    if (error) throw error;
    if (!data?.length) return;
    target.innerHTML = data.map(p => `<article class="region-live-card">
      <img src="${esc(safeUrl(p.image_url))}" alt="${esc(p.person_name || p.title)} regional poster" loading="lazy">
      <div class="dynamic-card-body"><div class="dynamic-meta">${esc(p.regions?.code || '')} • ${esc(p.regions?.name || '')}</div><h3>${esc(p.person_name || p.title || 'Regional Leadership')}</h3><p><strong>${esc(p.position || '')}</strong></p>${p.caption ? `<p>${esc(p.caption)}</p>`:''}</div>
    </article>`).join('');
  }

  let allMembers = [];
  function renderMembers() {
    const target = document.getElementById('dynamic-members');
    if (!target) return;
    const q = (document.getElementById('member-search')?.value || '').trim().toLowerCase();
    const region = document.getElementById('member-region-filter')?.value || '';
    const rows = allMembers.filter(m => (!region || m.region_id === region) && (!q || `${m.member_id} ${m.first_name} ${m.middle_name||''} ${m.last_name}`.toLowerCase().includes(q)));
    target.innerHTML = rows.length ? rows.slice(0,80).map(m => `<article class="member-card">
      <img src="${esc(safeUrl(m.photo_url) || placeholder)}" alt="Member photo" loading="lazy">
      <div class="dynamic-card-body"><span class="status-badge">✓ ACTIVE</span><h3>${esc([m.first_name,m.middle_name,m.last_name].filter(Boolean).join(' '))}</h3><div class="member-id">${esc(m.member_id)}</div><p>${esc(m.position || 'Technical Official')}<br>${esc(m.regions?.name || '')}</p><a href="/member?id=${encodeURIComponent(m.member_id)}">View verification profile</a></div>
    </article>`).join('') : '<div class="dynamic-empty">No matching published members found.</div>';
  }

  async function loadMembers(db) {
    const target = document.getElementById('dynamic-members');
    if (!target) return;
    const [membersRes, regionsRes] = await Promise.all([
      db.from('members').select('id,member_id,first_name,middle_name,last_name,position,photo_url,region_id,regions(name)').eq('active',true).eq('public_profile',true).order('last_name'),
      db.from('regions').select('id,code,name').eq('active',true).order('sort_order')
    ]);
    if (membersRes.error) throw membersRes.error;
    if (regionsRes.error) throw regionsRes.error;
    allMembers = membersRes.data || [];
    const select = document.getElementById('member-region-filter');
    if (select) select.innerHTML = '<option value="">All Regions</option>' + (regionsRes.data||[]).map(r=>`<option value="${esc(r.id)}">${esc(r.code)} — ${esc(r.name)}</option>`).join('');
    document.getElementById('member-search')?.addEventListener('input', renderMembers);
    select?.addEventListener('change', renderMembers);
    renderMembers();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const db = window.getBaptoSupabase();
      await Promise.allSettled([loadAnnouncements(db), loadGallery(db), loadRegionPosters(db), loadMembers(db)]);
    } catch (err) { showConfigNotice(err); }
  });
})();
