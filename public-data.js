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
      db.from('chapters').select('id,region_id,name,chapter_type,locality_code,locality_name,locality_type').eq('active',true).order('name'),
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
        return `<p class="subchapter-label">${chapterGroupLabel(type)}</p><div class="subchapter-chips">${items.map(c=>`<span class="subchapter-entry"><a class="subchapter-chip" href="/chapter?id=${encodeURIComponent(c.id)}#gallery">${esc(c.name)}${c.locality_name ? ` <small>${esc(c.locality_name)}</small>` : ''}</a><a class="chapter-gallery-jump" href="/chapter?id=${encodeURIComponent(c.id)}#gallery">View Gallery</a></span>`).join('')}</div>`;
      }).join('');
      const regionMedia = media.filter(m => m.region_id === r.id && !m.chapter_id);
      const chapterGalleries = rs.map(c => {
        const cm = media.filter(m => m.chapter_id === c.id);
        if (!cm.length) return '';
        return `<section class="chapter-gallery-block" id="chapter-${esc(c.id)}"><div class="chapter-gallery-heading"><div><span>${esc(chapterGroupLabel(c.chapter_type).replace(' Chapters',''))}${c.locality_name ? ` • ${esc(c.locality_name)}` : ''}</span><h4>${esc(c.name)} Gallery</h4></div><div class="chapter-gallery-actions"><strong>${cm.length}</strong><a href="/chapter?id=${encodeURIComponent(c.id)}#gallery">Open Gallery</a></div></div><div class="directory-media-grid">${cm.slice(0,6).map(directoryMediaCard).join('')}</div></section>`;
      }).join('');
      const search = [r.code,r.name,...rs.flatMap(c=>[c.name,c.locality_name||''])].join(' ').toLowerCase();
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
  let publicMemberChapters = [];

  function populatePublicMemberChapterFilter(regionId='', selected='') {
    const select = document.getElementById('member-chapter-filter');
    if (!select) return;
    const rows = publicMemberChapters.filter(c => !regionId || c.region_id === regionId);
    select.innerHTML = '<option value="">All Chapters</option>' + rows.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}${c.locality_name ? ` — ${esc(c.locality_name)}` : ''}</option>`).join('');
    if (selected && [...select.options].some(o=>o.value===selected)) select.value = selected;
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

  function memberCard(m) {
    const location=m.locality_name || m.chapters?.locality_name || '';
    return `<article class="member-card">
      <div class="passport-photo-frame"><img src="${esc(safeUrl(m.photo_url) || placeholder)}" alt="Member photo" loading="lazy"></div>
      <div class="dynamic-card-body"><div class="member-badge-row"><span class="status-badge">✓ ACTIVE</span>${memberLeadershipRank(m.position) < 100 ? '<span class="leadership-order-badge">LEADERSHIP</span>' : ''}</div><h3>${esc([m.first_name,m.middle_name,m.last_name,m.suffix].filter(Boolean).join(' '))}</h3><div class="member-id">${esc(m.member_id)}</div><p>${esc(m.position || 'Technical Official')}<br>${esc(m.regions?.name || '')}${location ? `<br>${esc(location)}` : ''}${m.chapters?.name ? `<br><strong>${esc(m.chapters.name)}</strong>` : ''}</p><a href="/member?id=${encodeURIComponent(m.member_id)}">View verification profile</a></div>
    </article>`;
  }

  function renderMembers() {
    const target = document.getElementById('dynamic-members');
    if (!target) return;
    const q = (document.getElementById('member-search')?.value || '').trim().toLowerCase();
    const region = document.getElementById('member-region-filter')?.value || '';
    const chapter = document.getElementById('member-chapter-filter')?.value || '';
    const rows = allMembers.filter(m => (!region || m.region_id === region) && (!chapter || m.chapter_id === chapter) && (!q || `${m.member_id} ${m.first_name} ${m.middle_name||''} ${m.last_name} ${m.suffix||''} ${m.locality_name||''} ${m.chapters?.locality_name||''} ${m.chapters?.name||''}`.toLowerCase().includes(q)));
    const summary = document.getElementById('member-directory-summary');
    const chapterCount = new Set(rows.map(m=>m.chapter_id).filter(Boolean)).size;
    if (summary) summary.innerHTML = `<strong>${rows.length}</strong> verified member${rows.length===1?'':'s'} • <strong>${chapterCount}</strong> chapter${chapterCount===1?'':'s'} shown`;
    if (!rows.length) { target.innerHTML = '<div class="dynamic-empty">No matching published members found.</div>'; return; }
    const groups = new Map();
    for (const m of rows) {
      const regionName = m.regions?.name || 'Region';
      const regionCode = m.regions?.code || '';
      const chapterName = m.chapters?.name || 'Regional / No Chapter';
      const key = `${m.region_id || 'none'}::${m.chapter_id || 'regional'}`;
      if (!groups.has(key)) groups.set(key,{regionName,regionCode,chapterName,chapterId:m.chapter_id||'',localityName:m.locality_name||m.chapters?.locality_name||'',rows:[]});
      groups.get(key).rows.push(m);
    }
    target.innerHTML = [...groups.values()].sort((a,b)=>`${a.regionName} ${a.chapterName}`.localeCompare(`${b.regionName} ${b.chapterName}`)).map(g => `<section class="public-member-group">
      <div class="public-member-group-head"><div><span>${esc(g.regionCode)} • ${esc(g.regionName)}${g.localityName ? ` • ${esc(g.localityName)}` : ''}</span><h3>${esc(g.chapterName)}</h3></div><div class="member-group-actions"><strong>${g.rows.length} member${g.rows.length===1?'':'s'}</strong>${g.chapterId ? `<a href="/chapter?id=${encodeURIComponent(g.chapterId)}">Chapter Gallery →</a>` : ''}</div></div>
      <div class="member-grid">${g.rows.sort(memberDirectorySort).map(memberCard).join('')}</div>
    </section>`).join('');
  }

  async function loadMembers(db) {
    const target = document.getElementById('dynamic-members');
    if (!target) return;
    const [membersRes, regionsRes, chaptersRes] = await Promise.all([
      db.from('members').select('id,member_id,first_name,middle_name,last_name,suffix,position,photo_url,region_id,chapter_id,locality_code,locality_name,locality_type,regions(code,name),chapters(id,name,chapter_type,locality_code,locality_name,locality_type)').eq('active',true).eq('public_profile',true).order('last_name'),
      db.from('regions').select('id,code,name').eq('active',true).order('sort_order'),
      db.from('chapters').select('id,region_id,name,chapter_type,locality_code,locality_name,locality_type').eq('active',true).order('name')
    ]);
    if (membersRes.error) throw membersRes.error;
    if (regionsRes.error) throw regionsRes.error;
    if (chaptersRes.error) throw chaptersRes.error;
    allMembers = membersRes.data || [];
    publicMemberChapters = chaptersRes.data || [];
    const select = document.getElementById('member-region-filter');
    if (select) select.innerHTML = '<option value="">All Regions</option>' + (regionsRes.data||[]).map(r=>`<option value="${esc(r.id)}">${esc(r.code)} — ${esc(r.name)}</option>`).join('');
    populatePublicMemberChapterFilter('','');
    document.getElementById('member-search')?.addEventListener('input', renderMembers);
    select?.addEventListener('change', e => { populatePublicMemberChapterFilter(e.target.value,''); renderMembers(); });
    document.getElementById('member-chapter-filter')?.addEventListener('change', renderMembers);
    renderMembers();
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('.chapter-member-jump');
    if (!btn || btn.tagName === 'A') return;
    const regionId = btn.dataset.memberRegion || '';
    const chapterId = btn.dataset.memberChapter || '';
    const regionSelect = document.getElementById('member-region-filter');
    if (regionSelect) regionSelect.value = regionId;
    populatePublicMemberChapterFilter(regionId,chapterId);
    const chapterSelect = document.getElementById('member-chapter-filter');
    if (chapterSelect) chapterSelect.value = chapterId;
    renderMembers();
    document.getElementById('member-directory')?.scrollIntoView({behavior:'smooth',block:'start'});
  });

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const db = window.getBaptoSupabase();
      await Promise.allSettled([loadAnnouncements(db), loadGallery(db), loadRegionPosters(db), loadChapterDirectory(db), loadMembers(db)]);
    } catch (err) { showConfigNotice(err); }
  });
})();
