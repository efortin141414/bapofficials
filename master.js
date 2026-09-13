(function () {
  let db, profile, regions = [], chapters = [];
  let announcementCache = [], galleryCache = [], posterCache = [], memberCache = [];
  let regionCache = [], chapterCache = [];
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl = (v = '') => /^https:\/\//i.test(String(v)) ? String(v) : '';
  const fmtDate = (v) => {
    if (!v) return '';
    const raw = String(v);
    const d = new Date(raw + (raw.length === 10 ? 'T00:00:00' : ''));
    return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
  };

  function setLoading(text, error = false) {
    const el = $('#master-loading-message');
    if (el) { el.textContent = text; el.className = error ? 'form-error' : ''; }
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
    if (/duplicate key.*member_id/i.test(m)) return 'That Member ID already exists. Use a unique Member ID.';
    if (/duplicate key.*regions.*code|duplicate key.*code/i.test(m)) return 'That region code already exists. Edit the existing region or use another code.';
    if (/duplicate key.*chapters|duplicate key.*region_id.*name/i.test(m)) return 'That chapter name already exists in the selected region.';
    if (/foreign key constraint/i.test(m)) return 'This record is already linked to other data. Edit it and turn off Active instead of deleting it.';
    return m;
  }
  function fileExt(file) {
    const p = file.name.split('.');
    return (p.pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  }
  async function upload(file, prefix) {
    if (!file?.size) return null;
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

  // Safe, deliberately small Markdown subset for announcements.
  function inlineFormat(text) {
    let s = esc(text);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    return s;
  }
  function renderMarkdown(text = '') {
    const lines = String(text).replace(/\r/g,'').split('\n');
    let html = '', inList = false;
    const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { closeList(); continue; }
      if (/^###\s+/.test(trimmed)) { closeList(); html += `<h4>${inlineFormat(trimmed.replace(/^###\s+/,''))}</h4>`; continue; }
      if (/^##\s+/.test(trimmed)) { closeList(); html += `<h3>${inlineFormat(trimmed.replace(/^##\s+/,''))}</h3>`; continue; }
      if (/^#\s+/.test(trimmed)) { closeList(); html += `<h2>${inlineFormat(trimmed.replace(/^#\s+/,''))}</h2>`; continue; }
      if (/^[-*]\s+/.test(trimmed)) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${inlineFormat(trimmed.replace(/^[-*]\s+/,''))}</li>`;
        continue;
      }
      closeList(); html += `<p>${inlineFormat(line)}</p>`;
    }
    closeList();
    return html || '<p class="format-empty">Your formatted announcement preview appears here.</p>';
  }

  async function requireSessionAndProfile() {
    setLoading('Checking your Supabase session…');
    const { data: { session }, error: sessionError } = await db.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) { window.location.replace('/admin'); return false; }
    setLoading('Verifying Master Admin access…');
    const { data, error } = await db.from('profiles').select('id,full_name,role,region_id').eq('id', session.user.id).maybeSingle();
    if (error) throw new Error(`Could not read admin profile: ${error.message}`);
    if (!data) throw new Error('No admin profile exists for this signed-in account. Run FIX_ADMIN_LOGIN.sql.');
    if (!['master_admin', 'regional_admin'].includes(data.role)) throw new Error(`This account has role "${data.role}" and does not have admin access.`);
    profile = data;
    $('#admin-user').textContent = `${data.full_name || session.user.email} • ${data.role.replace('_', ' ')}`;
    return true;
  }

  async function loadRegions() {
    let q = db.from('regions').select('id,code,name,sort_order,active').order('sort_order').order('name');
    if (profile.role === 'regional_admin') q = q.or(`active.eq.true,id.eq.${profile.region_id}`);
    const { data, error } = await q;
    if (error) throw error;
    regions = data || [];
    regionCache = regions;
    $$('.region-select').forEach(s => {
      const current = s.value;
      const keep = s.querySelector('option[value=""]')?.outerHTML || '';
      const allowed = regions.filter(r => (r.active || r.id === current) && (profile.role === 'master_admin' || r.id === profile.region_id));
      s.innerHTML = keep + allowed.map(r => `<option value="${r.id}">${esc(r.code)} — ${esc(r.name)}${r.active ? '' : ' (Inactive)'}</option>`).join('');
      if (current && [...s.options].some(o => o.value === current)) s.value = current;
    });
    renderRegionsAdmin();
  }

  async function loadChapters() {
    let q = db.from('chapters').select('id,region_id,name,chapter_type,active,created_at,regions(code,name)').order('name');
    if (profile.role === 'regional_admin') q = q.eq('region_id', profile.region_id);
    const { data, error } = await q;
    if (error) throw error;
    chapters = data || [];
    chapterCache = chapters;
    renderChaptersAdmin();
    populateMemberChapterSelect($('#member-region-select')?.value || '', $('#member-chapter-select')?.value || '');
    populateGalleryChapterSelect($('#gallery-region-select')?.value || '', $('#gallery-chapter-select')?.value || '');
    populatePosterChapterSelect($('#poster-region-select')?.value || '', $('#poster-chapter-select')?.value || '');
    populateAdminMemberChapterFilter($('#admin-member-region-filter')?.value || '', $('#admin-member-chapter-filter')?.value || '');
  }

  function chapterTypeLabel(type='chapter') {
    return ({provincial:'Provincial',city:'City',municipal:'Municipal',area:'Area',chapter:'Local'})[type] || 'Local';
  }

  function renderRegionsAdmin() {
    const target = $('#region-list'); if (!target) return;
    const q = ($('#admin-region-search')?.value || '').trim().toLowerCase();
    const rows = regionCache.filter(r => !q || `${r.code} ${r.name}`.toLowerCase().includes(q));
    target.innerHTML = rows.map(r => `<div class="record-row"><div class="grow"><strong>${esc(r.code)} — ${esc(r.name)}</strong><small>Sort ${Number(r.sort_order)||999} • ${r.active ? 'Active / Public' : 'Inactive / Hidden'}</small></div>${profile.role === 'master_admin' ? recordActions('region',r.id) : ''}</div>`).join('') || '<p>No regions found.</p>';
  }

  function renderChaptersAdmin() {
    const target = $('#chapter-list'); if (!target) return;
    const q = ($('#admin-chapter-search')?.value || '').trim().toLowerCase();
    const rows = chapterCache.filter(r => !q || `${r.name} ${r.chapter_type} ${r.regions?.code||''} ${r.regions?.name||''}`.toLowerCase().includes(q));
    target.innerHTML = rows.map(r => `<div class="record-row"><div class="grow"><strong>${esc(r.name)}</strong><small>${esc(r.regions?.code || '')} — ${esc(r.regions?.name || '')} • ${chapterTypeLabel(r.chapter_type)} Chapter • ${r.active ? 'Active / Public' : 'Inactive / Hidden'}</small></div>${recordActions('chapter',r.id)}</div>`).join('') || '<p>No chapters found.</p>';
  }

  function populateChapterSelect(select, regionId, selected='', emptyLabel='No chapter / regional only') {
    if (!select) return;
    const rows = chapters.filter(c => c.region_id === regionId && (c.active || c.id === selected));
    select.innerHTML = `<option value="">${esc(emptyLabel)}</option>` + rows.map(c => `<option value="${c.id}">${esc(c.name)} — ${chapterTypeLabel(c.chapter_type)}</option>`).join('');
    select.disabled = !regionId;
    if (selected && [...select.options].some(o => o.value === selected)) select.value = selected;
  }
  function populateMemberChapterSelect(regionId, selected='') { populateChapterSelect($('#member-chapter-select'), regionId, selected, 'No chapter / regional only'); }
  function populateGalleryChapterSelect(regionId, selected='') { populateChapterSelect($('#gallery-chapter-select'), regionId, selected, regionId ? 'Regional gallery / no chapter' : 'Choose a region first'); }
  function populatePosterChapterSelect(regionId, selected='') { populateChapterSelect($('#poster-chapter-select'), regionId, selected, regionId ? 'Regional level / no chapter' : 'Choose a region first'); }
  function populateAdminMemberChapterFilter(regionId, selected='') {
    const select = $('#admin-member-chapter-filter'); if (!select) return;
    const rows = chapters.filter(c => (!regionId || c.region_id === regionId) && c.active);
    select.innerHTML = '<option value="">All Chapters</option><option value="__regional__">Regional / No Chapter</option>' + rows.map(c => `<option value="${c.id}">${esc(c.name)} — ${chapterTypeLabel(c.chapter_type)}</option>`).join('');
    if (selected && [...select.options].some(o => o.value === selected)) select.value = selected;
  }
  function validateChapterRegion(regionId, chapterId) {
    if (!chapterId) return;
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) throw new Error('Selected chapter was not found. Refresh the page and try again.');
    if (chapter.region_id !== regionId) throw new Error('The selected chapter does not belong to the selected region.');
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
      } catch (_) { els[i].textContent = '—'; }
    }
  }

  function recordActions(type, id, extra = '') {
    return `<div class="record-actions">${extra}<button class="edit-btn" data-edit-${type}="${id}">Edit</button><button class="delete-btn" data-del-${type}="${id}">Delete</button></div>`;
  }

  async function loadAnnouncements() {
    const { data, error } = await db.from('announcements').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    announcementCache = data || [];
    $('#announcement-list').innerHTML = announcementCache.map(r => {
      const imageUrl = safeUrl(r.image_url);
      const image = imageUrl ? `<a class="announcement-thumb-link" href="${esc(imageUrl)}" target="_blank" rel="noopener" title="Open poster"><img class="announcement-thumb" src="${esc(imageUrl)}" alt="${esc(r.title)} poster" loading="lazy"></a>` : `<div class="announcement-no-image">No image</div>`;
      const open = `<a class="record-link-btn" href="/announcement?id=${encodeURIComponent(r.id)}" target="_blank" rel="noopener">Open</a>`;
      return `<div class="record-row announcement-record">${image}<div class="grow"><strong>${esc(r.title)}</strong><small>${esc(r.category || 'Announcement')} • ${fmtDate(r.event_date || r.created_at)} • <span class="status-text ${r.published ? 'is-live' : 'is-draft'}">${r.published ? 'Published' : 'Draft'}</span></small>${imageUrl ? `<small class="image-status">Poster uploaded ✓</small>` : `<small class="image-status warning">No poster attached</small>`}</div>${recordActions('ann', r.id, open)}</div>`;
    }).join('') || '<p>No announcements yet.</p>';
  }

  async function loadGallery() {
    let q = db.from('gallery').select('*,regions(code,name),chapters(name,chapter_type)').order('created_at', { ascending: false }).limit(100);
    if (profile.role === 'regional_admin') q = q.eq('region_id', profile.region_id);
    const { data, error } = await q;
    if (error) throw error;
    galleryCache = data || [];
    $('#gallery-list').innerHTML = galleryCache.map(r => `<article class="record-card"><div class="record-image-wrap"><img src="${esc(safeUrl(r.image_url))}" alt="${esc(r.caption || r.album_name)}"></div><div class="record-card-body"><strong>${esc(r.album_name)}</strong><small>${esc(r.regions?.code || 'National')}${r.chapters?.name ? ` • ${esc(r.chapters.name)}` : ''} • ${fmtDate(r.event_date || r.created_at)} • ${r.published ? 'Published' : 'Draft'}</small>${r.caption ? `<p>${esc(r.caption)}</p>`:''}${recordActions('gallery',r.id)}</div></article>`).join('') || '<p>No gallery photos yet.</p>';
  }

  async function loadPosters() {
    let q = db.from('regional_posters').select('*,regions(code,name),chapters(name,chapter_type)').order('created_at', { ascending: false });
    if (profile.role === 'regional_admin') q = q.eq('region_id', profile.region_id);
    const { data, error } = await q;
    if (error) throw error;
    posterCache = data || [];
    $('#region-poster-list').innerHTML = posterCache.map(r => `<article class="record-card"><div class="record-image-wrap poster"><img src="${esc(safeUrl(r.image_url))}" alt="${esc(r.person_name)} regional poster"></div><div class="record-card-body"><strong>${esc(r.person_name || r.title)}</strong><small>${esc(r.position || '')} • ${esc(r.regions?.code || '')}${r.chapters?.name ? ` • ${esc(r.chapters.name)}` : ' • Regional'} • ${r.published ? 'Published' : 'Draft'}</small>${r.caption ? `<p>${esc(r.caption)}</p>`:''}${recordActions('poster',r.id)}</div></article>`).join('') || '<p>No regional posters yet.</p>';
  }

  function memberLeadershipRank(position='') {
    const p = String(position || '').trim().toLowerCase();
    if (!p) return 100;
    if (/regional\s+director/.test(p)) return 10;
    if (/regional\s+commissioner/.test(p)) return 20;
    if (/(city|provincial|province|municipal|chapter|district|area)\s+commissioner/.test(p)) return 30;
    if (/deputy.*commissioner|commissioner.*deputy/.test(p)) return 40;
    if (/director/.test(p)) return 50;
    if (/commissioner/.test(p)) return 60;
    return 100;
  }

  function memberDirectorySort(a,b) {
    const rank = memberLeadershipRank(a.position) - memberLeadershipRank(b.position);
    if (rank) return rank;
    return `${a.last_name || ''} ${a.first_name || ''}`.localeCompare(`${b.last_name || ''} ${b.first_name || ''}`, undefined, {sensitivity:'base'});
  }

  function renderAdminMembers() {
    const q = ($('#admin-member-search')?.value || '').trim().toLowerCase();
    const regionFilter = $('#admin-member-region-filter')?.value || '';
    const chapterFilter = $('#admin-member-chapter-filter')?.value || '';
    const rows = memberCache.filter(r => {
      const matchesText = !q || `${r.member_id} ${r.first_name} ${r.middle_name || ''} ${r.last_name} ${r.suffix || ''} ${r.regions?.name || ''} ${r.chapters?.name || ''}`.toLowerCase().includes(q);
      const matchesRegion = !regionFilter || r.region_id === regionFilter;
      const matchesChapter = !chapterFilter || (chapterFilter === '__regional__' ? !r.chapter_id : r.chapter_id === chapterFilter);
      return matchesText && matchesRegion && matchesChapter;
    });
    const activeCount = rows.filter(r => r.active).length;
    const publicCount = rows.filter(r => r.active && r.public_profile).length;
    const chapterIds = new Set(rows.filter(r => r.chapter_id).map(r => r.chapter_id));
    const summary = $('#admin-member-summary');
    if (summary) summary.innerHTML = `<strong>${rows.length}</strong> member${rows.length===1?'':'s'} • <strong>${activeCount}</strong> active • <strong>${publicCount}</strong> public • <strong>${chapterIds.size}</strong> chapter${chapterIds.size===1?'':'s'}`;
    const target = $('#member-list');
    if (!rows.length) { target.innerHTML = '<p>No members found for the selected filters.</p>'; return; }
    const groups = new Map();
    for (const r of rows) {
      const regionName = r.regions?.name || r.regions?.code || 'Unassigned Region';
      const chapterName = r.chapters?.name || 'Regional / No Chapter';
      const key = `${r.region_id || 'none'}::${r.chapter_id || 'regional'}`;
      if (!groups.has(key)) groups.set(key,{regionName,chapterName,chapterType:r.chapters?.chapter_type || '',rows:[]});
      groups.get(key).rows.push(r);
    }
    target.innerHTML = [...groups.values()].sort((a,b)=>`${a.regionName} ${a.chapterName}`.localeCompare(`${b.regionName} ${b.chapterName}`)).map(g => {
      const members = g.rows.sort(memberDirectorySort).map(r => {
        const fullName = [r.first_name,r.middle_name,r.last_name,r.suffix].filter(Boolean).join(' ');
        const open = `<a class="record-link-btn" href="/member?id=${encodeURIComponent(r.member_id)}" target="_blank" rel="noopener">View</a>`;
        return `<div class="record-row">${r.photo_url ? `<img class="member-list-photo" src="${esc(safeUrl(r.photo_url))}" alt="${esc(fullName)}">` : '<div class="member-list-photo placeholder">No photo</div>'}<div class="grow"><strong>${esc(fullName)}</strong><small>${esc(r.member_id)} • ${r.active ? 'Active' : 'Inactive'} • ${r.public_profile ? 'Public' : 'Private'}</small><small>${memberLeadershipRank(r.position) < 100 ? '<span class="leadership-order-badge">LEADERSHIP</span> ' : ''}${esc(r.position || 'Technical Official')}${r.valid_until ? ` • Valid until ${fmtDate(r.valid_until)}` : ''}</small></div>${recordActions('member',r.id,open)}</div>`;
      }).join('');
      return `<section class="admin-member-group"><div class="admin-member-group-head"><div><span>${esc(g.regionName)}</span><h3>${esc(g.chapterName)}</h3></div><strong>${g.rows.length} member${g.rows.length===1?'':'s'}</strong></div>${members}</section>`;
    }).join('');
  }

  async function loadMembers() {
    let q = db.from('members').select('*,regions(code,name),chapters(name,chapter_type)').order('last_name');
    if (profile.role === 'regional_admin') q = q.eq('region_id', profile.region_id);
    const { data, error } = await q;
    if (error) throw error;
    memberCache = data || [];
    renderAdminMembers();
  }

  async function refreshNonBlocking() {
    const jobs = [['statistics',stats],['regions',loadRegions],['chapters',loadChapters],['announcements',loadAnnouncements],['gallery',loadGallery],['regional posters',loadPosters],['members',loadMembers]];
    const results = await Promise.allSettled(jobs.map(([, fn]) => fn()));
    const failed = results.map((r, i) => r.status === 'rejected' ? `${jobs[i][0]}: ${friendly(r.reason)}` : null).filter(Boolean);
    if (failed.length) dashboardStatus(`Master Page opened, but some data could not load yet. ${failed.join(' | ')}`, true);
    else dashboardStatus('Master Page connected to Supabase successfully.', false);
  }

  function clearObjectPreview(preview) {
    if (!preview) return;
    const old = preview.dataset.objectUrl;
    if (old) URL.revokeObjectURL(old);
    delete preview.dataset.objectUrl;
  }
  function setPreview(kind, url = '', file = null) {
    const wrap = $(`#${kind}-preview-wrap`);
    const img = $(`#${kind}-image-preview`);
    if (!wrap || !img) return;
    clearObjectPreview(img);
    let src = safeUrl(url);
    if (file?.size) {
      src = URL.createObjectURL(file);
      img.dataset.objectUrl = src;
    }
    if (src) { img.src = src; wrap.hidden = false; }
    else { wrap.hidden = true; img.removeAttribute('src'); }
  }
  function setEditMode(kind, editing) {
    const titles = {
      'announcement':['Add Announcement','Edit Announcement','Save Announcement','Update Announcement'],
      'gallery':['Upload Gallery Photo','Edit Gallery Photo','Upload Photo','Update Gallery Photo'],
      'region-poster':['Add Region / Chapter Poster','Edit Region / Chapter Poster','Upload Poster','Update Poster'],
      'member':['Add Member','Edit Member','Save Member','Update Member'],
      'region':['Add Region','Edit Region','Save Region','Update Region'],
      'chapter':['Add Chapter','Edit Chapter','Save Chapter','Update Chapter']
    };
    const [addTitle,editTitle,addSave,editSave] = titles[kind];
    $(`#${kind}-form-title`).textContent = editing ? editTitle : addTitle;
    $(`#${kind}-mode-badge`).textContent = editing ? 'EDITING' : 'NEW';
    $(`#${kind}-mode-badge`).classList.toggle('editing', editing);
    const form = $(`#${kind}-form`);
    form.querySelector('.save-label').textContent = editing ? editSave : addSave;
    $$(`[data-cancel="${kind}"]`).forEach(b => b.hidden = !editing);
    $(`#${kind}-form-panel`)?.classList.toggle('editing-panel', editing);
  }
  function resetForm(kind) {
    const form = $(`#${kind}-form`);
    if (!form) return;
    form.reset();
    form.elements.edit_id.value = '';
    if (form.elements.existing_image_url) form.elements.existing_image_url.value = '';
    if (form.elements.published) form.elements.published.checked = true;
    if (form.elements.active) form.elements.active.checked = true;
    if (form.elements.public_profile) form.elements.public_profile.checked = true;
    setPreview(kind);
    setEditMode(kind,false);
    msg(form,'');
    if (kind === 'gallery') populateGalleryChapterSelect(form.elements.region_id?.value || '', '');
    if (kind === 'region-poster') populatePosterChapterSelect(form.elements.region_id?.value || '', '');
    if (kind === 'member') { populateMemberChapterSelect(form.elements.region_id?.value || '', ''); if ($('#quick-chapter-panel')) $('#quick-chapter-panel').hidden = true; }
    if (kind === 'announcement') updateAnnouncementPreview();
  }
  function scrollToForm(kind) {
    $(`#${kind}-form-panel`)?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function beginAnnouncementEdit(id) {
    const r = announcementCache.find(x => x.id === id); if (!r) return;
    const f = $('#announcement-form'); resetForm('announcement');
    f.elements.edit_id.value = r.id; f.elements.existing_image_url.value = r.image_url || '';
    f.elements.title.value = r.title || ''; f.elements.category.value = r.category || ''; f.elements.event_date.value = r.event_date || ''; f.elements.body.value = r.body || ''; f.elements.published.checked = !!r.published;
    setPreview('announcement',r.image_url); setEditMode('announcement',true); updateAnnouncementPreview(); scrollToForm('announcement');
  }
  function beginGalleryEdit(id) {
    const r = galleryCache.find(x => x.id === id); if (!r) return;
    const f = $('#gallery-form'); resetForm('gallery');
    f.elements.edit_id.value = r.id; f.elements.existing_image_url.value = r.image_url || ''; f.elements.album_name.value = r.album_name || ''; f.elements.region_id.value = r.region_id || ''; populateGalleryChapterSelect(r.region_id || '', r.chapter_id || ''); f.elements.chapter_id.value = r.chapter_id || ''; f.elements.event_date.value = r.event_date || ''; f.elements.caption.value = r.caption || ''; f.elements.published.checked = !!r.published;
    setPreview('gallery',r.image_url); setEditMode('gallery',true); scrollToForm('gallery');
  }
  function beginPosterEdit(id) {
    const r = posterCache.find(x => x.id === id); if (!r) return;
    const f = $('#region-poster-form'); resetForm('region-poster');
    f.elements.edit_id.value = r.id; f.elements.existing_image_url.value = r.image_url || ''; f.elements.region_id.value = r.region_id || ''; populatePosterChapterSelect(r.region_id || '', r.chapter_id || ''); f.elements.chapter_id.value = r.chapter_id || ''; f.elements.person_name.value = r.person_name || ''; f.elements.position.value = r.position || ''; f.elements.caption.value = r.caption || ''; f.elements.published.checked = !!r.published;
    setPreview('region-poster',r.image_url); setEditMode('region-poster',true); scrollToForm('region-poster');
  }
  function beginMemberEdit(id) {
    const r = memberCache.find(x => x.id === id); if (!r) return;
    const f = $('#member-form'); resetForm('member');
    f.elements.edit_id.value = r.id; f.elements.existing_image_url.value = r.photo_url || ''; f.elements.member_id.value = r.member_id || ''; f.elements.region_id.value = r.region_id || ''; populateMemberChapterSelect(r.region_id || '', r.chapter_id || ''); f.elements.chapter_id.value = r.chapter_id || ''; f.elements.first_name.value = r.first_name || ''; f.elements.middle_name.value = r.middle_name || ''; f.elements.last_name.value = r.last_name || ''; f.elements.suffix.value = r.suffix || ''; f.elements.position.value = r.position || ''; f.elements.accreditation_level.value = r.accreditation_level || ''; f.elements.joined_on.value = r.joined_on || ''; f.elements.valid_until.value = r.valid_until || ''; f.elements.active.checked = !!r.active; f.elements.public_profile.checked = !!r.public_profile;
    setPreview('member',r.photo_url); setEditMode('member',true); scrollToForm('member');
  }

  function beginRegionEdit(id) {
    const r = regionCache.find(x => x.id === id); if (!r || profile.role !== 'master_admin') return;
    const f = $('#region-form'); resetForm('region');
    f.elements.edit_id.value = r.id; f.elements.code.value = r.code || ''; f.elements.name.value = r.name || ''; f.elements.sort_order.value = r.sort_order ?? 999; f.elements.active.checked = !!r.active;
    setEditMode('region',true); scrollToForm('region');
  }
  function beginChapterEdit(id) {
    const r = chapterCache.find(x => x.id === id); if (!r) return;
    const f = $('#chapter-form'); resetForm('chapter');
    f.elements.edit_id.value = r.id; f.elements.region_id.value = r.region_id || ''; f.elements.name.value = r.name || ''; f.elements.chapter_type.value = r.chapter_type || 'chapter'; f.elements.active.checked = !!r.active;
    setEditMode('chapter',true); scrollToForm('chapter');
  }

  function updateAnnouncementPreview() {
    const text = $('#announcement-body')?.value || '';
    const target = $('#announcement-format-preview');
    if (target) target.innerHTML = renderMarkdown(text);
  }
  function applyFormat(textarea, type) {
    const start = textarea.selectionStart, end = textarea.selectionEnd;
    const selected = textarea.value.slice(start,end) || (type === 'bullet' ? 'List item' : type === 'heading' ? 'Heading' : 'text');
    let replacement = selected;
    if (type === 'bold') replacement = `**${selected}**`;
    if (type === 'italic') replacement = `*${selected}*`;
    if (type === 'heading') replacement = selected.split('\n').map(x => `## ${x.replace(/^#+\s*/, '')}`).join('\n');
    if (type === 'bullet') replacement = selected.split('\n').map(x => `- ${x.replace(/^[-*]\s*/, '')}`).join('\n');
    textarea.setRangeText(replacement,start,end,'end'); textarea.focus(); updateAnnouncementPreview();
  }

  function bindImageInput(kind) {
    const input = $(`#${kind}-form input[name="image"]`);
    input?.addEventListener('change', () => {
      const existing = $(`#${kind}-form input[name="existing_image_url"]`)?.value || '';
      setPreview(kind,existing,input.files?.[0]);
    });
  }

  function bindForms() {
    $('#admin-member-search')?.addEventListener('input', renderAdminMembers);
    $('#admin-member-region-filter')?.addEventListener('change', e => { populateAdminMemberChapterFilter(e.target.value,''); renderAdminMembers(); });
    $('#admin-member-chapter-filter')?.addEventListener('change', renderAdminMembers);
    $('#admin-region-search')?.addEventListener('input', renderRegionsAdmin);
    $('#admin-chapter-search')?.addEventListener('input', renderChaptersAdmin);
    $('#member-region-select')?.addEventListener('change', e => { populateMemberChapterSelect(e.target.value,''); if ($('#quick-chapter-panel')) $('#quick-chapter-panel').hidden = true; });
    $('#gallery-region-select')?.addEventListener('change', e => populateGalleryChapterSelect(e.target.value,''));
    $('#poster-region-select')?.addEventListener('change', e => populatePosterChapterSelect(e.target.value,''));
    ['announcement','gallery','region-poster','member'].forEach(bindImageInput);
    $$('[data-cancel]').forEach(b => b.addEventListener('click', () => resetForm(b.dataset.cancel)));
    $('#announcement-body')?.addEventListener('input', updateAnnouncementPreview);
    $$('.format-toolbar button[data-format]').forEach(b => b.addEventListener('click', () => applyFormat($('#announcement-body'),b.dataset.format)));
    updateAnnouncementPreview();

    $('#quick-add-chapter-toggle')?.addEventListener('click', () => {
      const regionId = $('#member-region-select')?.value || '';
      const panel = $('#quick-chapter-panel');
      const message = $('#quick-chapter-message');
      if (!regionId) { if (message) { message.textContent = 'Select a region first.'; message.className = 'form-message form-error'; } panel.hidden = false; return; }
      panel.hidden = !panel.hidden;
      if (!panel.hidden) $('#quick-chapter-name')?.focus();
    });
    $('#quick-add-chapter-close')?.addEventListener('click', () => { $('#quick-chapter-panel').hidden = true; });
    $('#quick-add-chapter-save')?.addEventListener('click', async () => {
      const regionId = $('#member-region-select')?.value || '';
      const name = ($('#quick-chapter-name')?.value || '').trim();
      const type = $('#quick-chapter-type')?.value || 'chapter';
      const message = $('#quick-chapter-message');
      try {
        if (!regionId) throw new Error('Select a region first.');
        if (!canManageRegion(regionId)) throw new Error('You cannot create chapters for this region.');
        if (!name) throw new Error('Enter the chapter name.');
        if (message) { message.textContent = 'Saving chapter…'; message.className = 'form-message'; }
        const { data, error } = await db.from('chapters').insert({region_id:regionId,name,chapter_type:type,active:true}).select('id').single();
        if (error) throw error;
        await loadChapters();
        populateMemberChapterSelect(regionId,data.id);
        $('#member-chapter-select').value = data.id;
        $('#quick-chapter-name').value = '';
        if (message) { message.textContent = 'Chapter saved and selected for this member.'; message.className = 'form-message form-success'; }
        setTimeout(()=>{ if ($('#quick-chapter-panel')) $('#quick-chapter-panel').hidden = true; },900);
      } catch (err) { if (message) { message.textContent = friendly(err); message.className = 'form-message form-error'; } }
    });

    $('#region-form')?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; const editing = !!f.elements.edit_id.value; msg(f,editing?'Updating…':'Saving…');
      try {
        if (profile.role !== 'master_admin') throw new Error('Only the Master Admin can create or edit regions.');
        const fd = new FormData(f);
        const payload = { code:String(fd.get('code')||'').trim().toUpperCase(), name:String(fd.get('name')||'').trim(), sort_order:Number(fd.get('sort_order')||999), active:fd.get('active')==='on' };
        if (!payload.code || !payload.name) throw new Error('Region code and region name are required.');
        const { error } = editing ? await db.from('regions').update(payload).eq('id',fd.get('edit_id')) : await db.from('regions').insert(payload);
        if (error) throw error; resetForm('region'); msg(f,editing?'Region updated. Public directory refreshed.':'Region saved. It will appear on the public directory when active.'); await refreshNonBlocking();
      } catch (err) { msg(f,friendly(err),false); }
    });

    $('#chapter-form')?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; const editing = !!f.elements.edit_id.value; msg(f,editing?'Updating…':'Saving…');
      try {
        const fd = new FormData(f); const regionId = fd.get('region_id');
        if (!canManageRegion(regionId)) throw new Error('You cannot manage chapters for this region.');
        const payload = { region_id:regionId, name:String(fd.get('name')||'').trim(), chapter_type:fd.get('chapter_type')||'chapter', active:fd.get('active')==='on' };
        if (!payload.name) throw new Error('Chapter name is required.');
        const { error } = editing ? await db.from('chapters').update(payload).eq('id',fd.get('edit_id')) : await db.from('chapters').insert(payload);
        if (error) throw error; resetForm('chapter'); msg(f,editing?'Chapter updated. Public directory refreshed.':'Chapter saved. It will appear under its region on the public directory when active.'); await refreshNonBlocking();
      } catch (err) { msg(f,friendly(err),false); }
    });

    $('#announcement-form')?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; const editing = !!f.elements.edit_id.value; msg(f, editing ? 'Updating…' : 'Saving…');
      try {
        const fd = new FormData(f); const selectedFile = fd.get('image');
        let image = fd.get('existing_image_url') || null;
        if (selectedFile?.size) image = await upload(selectedFile,'announcements');
        const published = fd.get('published') === 'on';
        const existing = editing ? announcementCache.find(x => x.id === fd.get('edit_id')) : null;
        const payload = { title: fd.get('title'), category: fd.get('category') || null, event_date: fd.get('event_date') || null, body: fd.get('body') || null, image_url: image, published, published_at: published ? (existing?.published_at || new Date().toISOString()) : null };
        let result = editing ? db.from('announcements').update(payload).eq('id',fd.get('edit_id')) : db.from('announcements').insert({...payload,created_by:profile.id});
        const { error } = await result; if (error) throw error;
        resetForm('announcement'); msg(f, editing ? 'Announcement updated.' : 'Announcement saved.'); await refreshNonBlocking();
      } catch (err) { msg(f,friendly(err),false); }
    });

    $('#gallery-form')?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; const editing = !!f.elements.edit_id.value; msg(f,editing?'Updating…':'Uploading…');
      try {
        const fd = new FormData(f); const regionId = fd.get('region_id') || null; const chapterId = fd.get('chapter_id') || null;
        if (regionId && !canManageRegion(regionId)) throw new Error('You cannot manage this region.');
        if (chapterId && !regionId) throw new Error('Choose a region before selecting a chapter.');
        validateChapterRegion(regionId, chapterId);
        let image = fd.get('existing_image_url') || null; const file = fd.get('image'); if (file?.size) image = await upload(file,'gallery');
        if (!image) throw new Error('Please choose a gallery photo.');
        const payload = { album_name:fd.get('album_name'),region_id:regionId,chapter_id:chapterId,event_date:fd.get('event_date')||null,caption:fd.get('caption')||null,image_url:image,published:fd.get('published')==='on' };
        const { error } = editing ? await db.from('gallery').update(payload).eq('id',fd.get('edit_id')) : await db.from('gallery').insert({...payload,created_by:profile.id});
        if (error) throw error; resetForm('gallery'); msg(f,editing?'Gallery item updated.':'Gallery photo uploaded.'); await refreshNonBlocking();
      } catch (err) { msg(f,friendly(err),false); }
    });

    $('#region-poster-form')?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; const editing = !!f.elements.edit_id.value; msg(f,editing?'Updating…':'Uploading…');
      try {
        const fd = new FormData(f); const regionId = fd.get('region_id'); const chapterId = fd.get('chapter_id') || null; if (!canManageRegion(regionId)) throw new Error('You cannot manage this region.');
        validateChapterRegion(regionId, chapterId);
        let image = fd.get('existing_image_url') || null; const file = fd.get('image'); if (file?.size) image = await upload(file,'regional-posters'); if (!image) throw new Error('Please choose a regional poster.');
        const payload = { region_id:regionId,chapter_id:chapterId,person_name:fd.get('person_name'),position:fd.get('position')||null,caption:fd.get('caption')||null,image_url:image,published:fd.get('published')==='on' };
        const { error } = editing ? await db.from('regional_posters').update(payload).eq('id',fd.get('edit_id')) : await db.from('regional_posters').insert({...payload,created_by:profile.id});
        if (error) throw error; resetForm('region-poster'); msg(f,editing?'Regional poster updated.':'Regional poster uploaded.'); await refreshNonBlocking();
      } catch (err) { msg(f,friendly(err),false); }
    });

    $('#member-form')?.addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; const editing = !!f.elements.edit_id.value; msg(f,editing?'Updating…':'Saving…');
      try {
        const fd = new FormData(f); const regionId = fd.get('region_id'); const chapterId = fd.get('chapter_id') || null; if (!canManageRegion(regionId)) throw new Error('You cannot manage this region.');
        if (!chapterId) throw new Error('Select a chapter for this member, or use + Add Chapter to create one first.');
        validateChapterRegion(regionId, chapterId);
        let image = fd.get('existing_image_url') || null; const file = fd.get('image'); if (file?.size) image = await upload(file,'member-photos');
        const payload = { member_id:fd.get('member_id').trim(),region_id:regionId,chapter_id:chapterId,first_name:fd.get('first_name').trim(),middle_name:fd.get('middle_name')||null,last_name:fd.get('last_name').trim(),suffix:fd.get('suffix')||null,position:fd.get('position')||null,accreditation_level:fd.get('accreditation_level')||null,joined_on:fd.get('joined_on')||null,valid_until:fd.get('valid_until')||null,photo_url:image,active:fd.get('active')==='on',public_profile:fd.get('public_profile')==='on' };
        const { error } = editing ? await db.from('members').update(payload).eq('id',fd.get('edit_id')) : await db.from('members').insert({...payload,created_by:profile.id});
        if (error) throw error; resetForm('member'); msg(f,editing?'Member updated.':'Member saved.'); await refreshNonBlocking();
      } catch (err) { msg(f,friendly(err),false); }
    });

    document.body.addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.editAnn) return beginAnnouncementEdit(b.dataset.editAnn);
      if (b.dataset.editGallery) return beginGalleryEdit(b.dataset.editGallery);
      if (b.dataset.editPoster) return beginPosterEdit(b.dataset.editPoster);
      if (b.dataset.editMember) return beginMemberEdit(b.dataset.editMember);
      if (b.dataset.editRegion) return beginRegionEdit(b.dataset.editRegion);
      if (b.dataset.editChapter) return beginChapterEdit(b.dataset.editChapter);

      let table,id;
      if (b.dataset.delAnn) { table='announcements'; id=b.dataset.delAnn; }
      if (b.dataset.delGallery) { table='gallery'; id=b.dataset.delGallery; }
      if (b.dataset.delPoster) { table='regional_posters'; id=b.dataset.delPoster; }
      if (b.dataset.delMember) { table='members'; id=b.dataset.delMember; }
      if (b.dataset.delRegion) { if (profile.role !== 'master_admin') return; table='regions'; id=b.dataset.delRegion; }
      if (b.dataset.delChapter) { table='chapters'; id=b.dataset.delChapter; }
      if (!table) return;
      if (!confirm('Delete this record? This cannot be undone.')) return;
      const { error } = await db.from(table).delete().eq('id',id);
      if (error) alert(friendly(error)); else await refreshNonBlocking();
    });
  }

  async function boot() {
    try {
      db = window.getBaptoSupabase();
      const ok = await requireSessionAndProfile(); if (!ok) return;
      $('#master-loading').hidden = true; $('#app-view').hidden = false;
      bindForms();
      $$('[data-master-only]').forEach(el => el.hidden = profile.role !== 'master_admin');
      $$('#admin-nav button').forEach(b => b.addEventListener('click', () => show(b.dataset.view)));
      $('#logout-btn')?.addEventListener('click', async () => { await db.auth.signOut(); window.location.replace('/admin'); });
      try { await loadRegions(); await loadChapters(); } catch (err) { dashboardStatus(`Master Page opened, but directory data could not load: ${friendly(err)}`,true); }
      await refreshNonBlocking();
    } catch (err) {
      setLoading(friendly(err),true);
      const back = document.createElement('p'); back.innerHTML = '<a href="/admin">← Return to Admin Login</a>'; document.querySelector('.master-loading-card')?.appendChild(back);
    }
  }
  document.addEventListener('DOMContentLoaded',boot);
})();
