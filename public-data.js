(function () {
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl = (v='') => /^https:\/\//i.test(v) ? v : '';
  const fmtDate = (v) => {
    if (!v) return '';
    const d = new Date(v + (v.length === 10 ? 'T00:00:00' : ''));
    return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
  };
  const plainExcerpt = (v='') => String(v).replace(/^#{1,3}\s+/gm,'').replace(/\*\*|\*/g,'').replace(/^[-*]\s+/gm,'').replace(/\s+/g,' ').trim();
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
    target.innerHTML = data.map(a => `<a class="dynamic-card announcement-card-link" href="/announcement?id=${encodeURIComponent(a.id)}" aria-label="Open full announcement: ${esc(a.title)}">
      ${safeUrl(a.image_url) ? `<img src="${esc(safeUrl(a.image_url))}" alt="${esc(a.title)} poster" loading="lazy" onerror="this.classList.add('image-load-error'); this.removeAttribute('src'); this.alt='Poster image could not be loaded';">` : ''}
      <div class="dynamic-card-body"><div class="dynamic-meta">${esc(a.category || 'Announcement')} • ${esc(fmtDate(a.event_date || a.published_at))}</div><h3>${esc(a.title)}</h3><p>${esc(plainExcerpt(a.body || ''))}</p><span class="announcement-read-more">Open full announcement →</span></div>
    </a>`).join('');
  }

  async function loadGallery(db) {
    const target = document.getElementById('dynamic-gallery');
    if (!target) return;
    const { data, error } = await db.from('gallery').select('*,regions(code,name),chapters(name,chapter_type)').eq('published', true).order('event_date', {ascending:false}).limit(16);
    if (error) throw error;
    if (!data?.length) return;
    document.getElementById('static-gallery')?.setAttribute('hidden','');
    target.innerHTML = data.map(g => `<figure class="gallery-live-item"><img src="${esc(safeUrl(g.image_url))}" alt="${esc(g.caption || g.album_name || 'BAPTO gallery photo')}" loading="lazy"><figcaption><strong>${esc(g.caption || g.album_name || 'BAPTO Activity')}</strong>${g.regions?.name ? `<small>${esc(g.regions.code || '')}${g.chapters?.name ? ` • ${esc(g.chapters.name)}` : ' • Regional Gallery'}</small>` : '<small>National Gallery</small>'}</figcaption></figure>`).join('');
  }

  async function loadRegionPosters(db) {
    const target = document.getElementById('dynamic-region-posters');
    if (!target) return;
    const { data, error } = await db.from('regional_posters').select('*, regions(code,name), chapters(name,chapter_type)').eq('published', true).order('created_at', {ascending:false});
    if (error) throw error;
    if (!data?.length) return;
    target.innerHTML = data.map(p => `<article class="region-live-card">
      <img src="${esc(safeUrl(p.image_url))}" alt="${esc(p.person_name || p.title)} regional poster" loading="lazy">
      <div class="dynamic-card-body"><div class="dynamic-meta">${esc(p.regions?.code || '')} • ${esc(p.regions?.name || '')}${p.chapters?.name ? ` • ${esc(p.chapters.name)}` : ' • Regional'}</div><h3>${esc(p.person_name || p.title || 'Regional Leadership')}</h3><p><strong>${esc(p.position || '')}</strong></p>${p.caption ? `<p>${esc(p.caption)}</p>`:''}</div>
    </article>`).join('');
  }

  function chapterGroupLabel(type) {
    return ({provincial:'Provincial Chapters',city:'City Chapters',municipal:'Municipal Chapters',area:'Area Chapters',chapter:'Local Chapters'})[type] || 'Local Chapters';
  }

  function directoryMediaCard(item) {
    const image = safeUrl(item.image_url);
    if (!image) return '';
    const isPoster = item._kind === 'poster';
    const title = isPoster ? (item.person_name || item.title || 'Regional Poster') : (item.caption || item.album_name || 'Gallery Photo');
    const subtitle = isPoster ? (item.position || 'Leadership Poster') : (item.album_name || 'Gallery');
    return `<figure class="directory-media-card ${isPoster ? 'is-poster' : 'is-gallery'}">
      <img src="${esc(image)}" alt="${esc(title)}" loading="lazy">
      <figcaption><strong>${esc(title)}</strong><small>${esc(subtitle)}</small></figcaption>
    </figure>`;
  }

  function mediaSection(title, items, emptyText='') {
    const cards = items.map(directoryMediaCard).filter(Boolean).join('');
    if (!cards) return emptyText ? `<div class="directory-media-section empty"><h4>${esc(title)}</h4><p>${esc(emptyText)}</p></div>` : '';
    return `<section class="directory-media-section"><div class="directory-media-title"><h4>${esc(title)}</h4><span>${items.length} item${items.length===1?'':'s'}</span></div><div class="directory-media-grid">${cards}</div></section>`;
  }

  async function loadChapterDirectory(db) {
    const target = document.getElementById('regionDirectory');
    if (!target) return;
    const [regionsRes, chaptersRes, galleryRes, postersRes] = await Promise.all([
      db.from('regions').select('id,code,name,sort_order').eq('active',true).order('sort_order').order('name'),
      db.from('chapters').select('id,region_id,name,chapter_type').eq('active',true).order('name'),
      db.from('gallery').select('id,album_name,caption,region_id,chapter_id,event_date,image_url,created_at').eq('published',true).order('event_date',{ascending:false}),
      db.from('regional_posters').select('id,title,person_name,position,caption,region_id,chapter_id,image_url,created_at').eq('published',true).order('created_at',{ascending:false})
    ]);
    if (regionsRes.error) throw regionsRes.error;
    if (chaptersRes.error) throw chaptersRes.error;
    if (galleryRes.error) throw galleryRes.error;
    if (postersRes.error) throw postersRes.error;
    const regions = regionsRes.data || [], chapters = chaptersRes.data || [];
    const media = [
      ...(galleryRes.data || []).map(x => ({...x,_kind:'gallery'})),
      ...(postersRes.data || []).map(x => ({...x,_kind:'poster'}))
    ];
    const regionCount = document.getElementById('region-count'); if (regionCount) regionCount.textContent = String(regions.length);
    const chapterCount = document.getElementById('chapter-count'); if (chapterCount) chapterCount.textContent = String(chapters.length);
    target.innerHTML = regions.map(r => {
      const rs = chapters.filter(c => c.region_id === r.id);
      const groups = ['provincial','city','municipal','area','chapter'].map(type => {
        const items = rs.filter(c => (c.chapter_type || 'chapter') === type);
        if (!items.length) return '';
        return `<p class="subchapter-label">${chapterGroupLabel(type)}</p><div class="subchapter-chips">${items.map(c=>`<a class="subchapter-chip" href="#chapter-${esc(c.id)}">${esc(c.name)}</a>`).join('')}</div>`;
      }).join('');
      const regionMedia = media.filter(m => m.region_id === r.id && !m.chapter_id);
      const chapterGalleries = rs.map(c => {
        const cm = media.filter(m => m.chapter_id === c.id);
        if (!cm.length) return '';
        return `<section class="chapter-gallery-block" id="chapter-${esc(c.id)}"><div class="chapter-gallery-heading"><div><span>${esc(chapterGroupLabel(c.chapter_type).replace(' Chapters',''))}</span><h4>${esc(c.name)} Gallery</h4></div><strong>${cm.length}</strong></div><div class="directory-media-grid">${cm.map(directoryMediaCard).join('')}</div></section>`;
      }).join('');
      const search = [r.code,r.name,...rs.map(c=>c.name)].join(' ').toLowerCase();
      return `<article class="region-directory-card" data-region="${esc(search)}">
        <button aria-expanded="false" class="region-directory-head" type="button">
          <span class="region-code">${esc(r.code)}</span>
          <span class="region-title-wrap"><strong>${esc(r.name)}</strong><small>${rs.length} active chapter${rs.length===1?'':'s'} • ${media.filter(m=>m.region_id===r.id).length} gallery item${media.filter(m=>m.region_id===r.id).length===1?'':'s'}</small></span>
          <span aria-hidden="true" class="region-toggle">＋</span>
        </button>
        <div class="region-directory-body" hidden>
          ${groups || '<p class="region-structure-note">No active local chapters published yet.</p>'}
          ${mediaSection(`${r.name} Regional Gallery`, regionMedia)}
          ${chapterGalleries || '<p class="chapter-gallery-empty">No chapter-specific gallery items have been published yet.</p>'}
        </div>
      </article>`;
    }).join('') || '<div class="dynamic-empty">No active regions are published yet.</div>';
    document.getElementById('regionNoResults')?.removeAttribute('hidden');
    if (document.getElementById('regionNoResults')) document.getElementById('regionNoResults').hidden = true;
    document.getElementById('regionSearch')?.dispatchEvent(new Event('input'));
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
      <div class="dynamic-card-body"><span class="status-badge">✓ ACTIVE</span><h3>${esc([m.first_name,m.middle_name,m.last_name].filter(Boolean).join(' '))}</h3><div class="member-id">${esc(m.member_id)}</div><p>${esc(m.position || 'Technical Official')}<br>${esc(m.regions?.name || '')}${m.chapters?.name ? `<br><strong>${esc(m.chapters.name)}</strong>` : ''}</p><a href="/member?id=${encodeURIComponent(m.member_id)}">View verification profile</a></div>
    </article>`).join('') : '<div class="dynamic-empty">No matching published members found.</div>';
  }

  async function loadMembers(db) {
    const target = document.getElementById('dynamic-members');
    if (!target) return;
    const [membersRes, regionsRes] = await Promise.all([
      db.from('members').select('id,member_id,first_name,middle_name,last_name,position,photo_url,region_id,chapter_id,regions(name),chapters(name)').eq('active',true).eq('public_profile',true).order('last_name'),
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
      await Promise.allSettled([loadAnnouncements(db), loadGallery(db), loadRegionPosters(db), loadChapterDirectory(db), loadMembers(db)]);
    } catch (err) { showConfigNotice(err); }
  });
})();
