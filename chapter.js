(() => {
  const esc = v => String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl = u => { try { const x=new URL(String(u||''),location.origin); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };
  const placeholder = 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="280" height="360"><rect width="100%" height="100%" fill="#e7edf5"/><circle cx="140" cy="118" r="56" fill="#aebacc"/><path d="M42 330c10-90 62-128 98-128s88 38 98 128" fill="#aebacc"/><text x="140" y="346" text-anchor="middle" font-family="Arial" font-size="18" fill="#66758a">BAPTO</text></svg>`);
  const params = new URLSearchParams(location.search);
  const chapterId = params.get('id');
  const root = document.getElementById('chapter-page');

  function rank(position='') {
    const p=String(position||'').toLowerCase();
    if(/regional\s+director/.test(p)) return 10;
    if(/regional\s+commissioner/.test(p)) return 20;
    if(/(city|provincial|municipal|chapter|area)\s+(director|commissioner)/.test(p)) return 30;
    if(/deputy.*commissioner|commissioner.*deputy/.test(p)) return 40;
    if(/director/.test(p)) return 50;
    if(/commissioner/.test(p)) return 60;
    return 100;
  }
  const fullName=m=>[m.first_name,m.middle_name,m.last_name,m.suffix].filter(Boolean).join(' ');
  const memberSort=(a,b)=>rank(a.position)-rank(b.position)||String(a.last_name||'').localeCompare(String(b.last_name||''))||String(a.first_name||'').localeCompare(String(b.first_name||''));
  const fmtDate=v=>{ if(!v) return ''; const d=new Date(`${String(v).slice(0,10)}T00:00:00`); return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}); };

  function memberCard(m){
    const leader=rank(m.position)<100;
    const photo=safeUrl(m.photo_url)||placeholder;
    return `<article class="chapter-member-card ${leader?'leadership':''}"><a href="/member?id=${encodeURIComponent(m.member_id)}">${leader?'<span class="lead-badge">LEADERSHIP</span>':''}<div class="chapter-passport"><img src="${esc(photo)}" alt="${esc(fullName(m))}" loading="lazy"></div><h3>${esc(fullName(m))}</h3><p class="member-role">${esc(m.position||'Technical Official')}</p><div class="member-number">${esc(m.member_id)}</div></a></article>`;
  }
  function mediaItem(type,r){
    const isPoster=type==='poster';
    const title=isPoster?(r.person_name||r.title||'Chapter Poster'):(r.album_name||'Chapter Gallery');
    const caption=isPoster?[r.position,r.caption].filter(Boolean).join(' — '):(r.caption||'');
    const image=safeUrl(r.image_url);
    if(!image) return '';
    const date=fmtDate(r.event_date||r.created_at);
    return `<button type="button" class="chapter-media-card ${isPoster?'poster':''}" data-image="${esc(image)}" data-title="${esc(title)}" data-caption="${esc(caption)}"><div class="chapter-media-frame"><img src="${esc(image)}" alt="${esc(title)}" loading="lazy"></div><div class="chapter-media-copy"><span>${isPoster?'Leadership / Poster':'Gallery Photo'}</span><strong>${esc(title)}</strong>${date?`<small>${esc(date)}</small>`:''}</div></button>`;
  }

  async function init(){
    if(!chapterId){ root.innerHTML='<section class="chapter-error-card"><div><strong>Chapter not specified.</strong>Open this page from the Membership or Regional Chapter directory.</div></section>'; return; }
    try{
      const db=window.getBaptoSupabase();
      const {data:chapter,error}=await db.from('chapters').select('id,name,chapter_type,locality_code,locality_name,locality_type,region_id,regions(code,name)').eq('id',chapterId).eq('active',true).maybeSingle();
      if(error) throw error;
      if(!chapter){ root.innerHTML='<section class="chapter-error-card"><div><strong>Chapter not found.</strong>This chapter may be inactive or unavailable.</div></section>'; return; }
      const [membersRes,galleryRes,posterRes]=await Promise.all([
        db.from('members').select('id,member_id,first_name,middle_name,last_name,suffix,position,accreditation_level,photo_url,valid_until,active,public_profile').eq('chapter_id',chapterId).eq('active',true).eq('public_profile',true),
        db.from('gallery').select('id,album_name,caption,event_date,image_url,created_at').eq('chapter_id',chapterId).eq('published',true).order('event_date',{ascending:false,nullsFirst:false}),
        db.from('regional_posters').select('id,title,person_name,position,caption,image_url,created_at').eq('chapter_id',chapterId).eq('published',true).order('created_at',{ascending:false})
      ]);
      if(membersRes.error) throw membersRes.error;
      if(galleryRes.error) throw galleryRes.error;
      if(posterRes.error) throw posterRes.error;
      const members=(membersRes.data||[]).sort(memberSort);
      const leaders=members.filter(m=>rank(m.position)<100);
      const regular=members.filter(m=>rank(m.position)>=100);
      const gallery=galleryRes.data||[];
      const posters=posterRes.data||[];
      document.title=`${chapter.name} | BAPTO`;
      root.innerHTML=`
        <section class="chapter-hero">
          <span class="chapter-kicker">${esc(chapter.regions?.code||'BAPTO')} • Official Chapter</span>
          <h1>${esc(chapter.name)}</h1>
          <p>${esc(chapter.locality_name||chapter.regions?.name||'Philippines')} — verified chapter membership, leadership and official activity gallery.</p>
          <div class="chapter-breadcrumbs"><span>${esc(chapter.regions?.name||'Region')}</span>${chapter.locality_name?`<span>${esc(chapter.locality_name)}${chapter.locality_type?` • ${esc(chapter.locality_type)}`:''}</span>`:''}<span>${esc(String(chapter.chapter_type||'chapter').replace(/(^|\s)\S/g,m=>m.toUpperCase()))} Chapter</span></div>
        </section>
        <section class="chapter-stats"><div class="chapter-stat"><strong>${members.length}</strong><span>Verified Members</span></div><div class="chapter-stat"><strong>${leaders.length}</strong><span>Leadership</span></div><div class="chapter-stat"><strong>${gallery.length+posters.length}</strong><span>Gallery Items</span></div></section>
        <section class="chapter-section" id="members"><div class="chapter-section-head"><div><h2>Membership Directory</h2><p>Commissioners and directors are shown first, followed by chapter members.</p></div><span class="chapter-section-badge">Passport-size member photos</span></div>
          ${members.length ? `${leaders.length?`<div class="chapter-subsection-label">Chapter Leadership</div><div class="chapter-members-grid">${leaders.map(memberCard).join('')}</div>`:''}${regular.length?`<div class="chapter-subsection-label">Members</div><div class="chapter-members-grid">${regular.map(memberCard).join('')}</div>`:''}`:'<div class="chapter-empty">No public members have been assigned to this chapter yet.</div>'}
        </section>
        <section class="chapter-section" id="gallery"><div class="chapter-section-head"><div><h2>Chapter Gallery</h2><p>Official chapter posters, activities, seminars and event photos in one gallery.</p></div><span class="chapter-section-badge">${gallery.length+posters.length} Published</span></div>
          ${(gallery.length||posters.length)?`<div class="chapter-gallery-grid">${posters.map(r=>mediaItem('poster',r)).join('')}${gallery.map(r=>mediaItem('gallery',r)).join('')}</div>`:'<div class="chapter-empty">No published chapter gallery items yet.</div>'}
        </section>
        <div class="chapter-footer-actions"><a class="primary" href="/#member-directory">Browse All Membership</a><a class="secondary" href="/#regional-chapters">Browse Regional Chapters</a></div>`;
    } catch(err){ console.error(err); root.innerHTML=`<section class="chapter-error-card"><div><strong>Unable to load chapter.</strong>${esc(err.message||'Please try again later.')}</div></section>`; }
  }

  document.addEventListener('click',e=>{
    const card=e.target.closest('.chapter-media-card');
    if(!card) return;
    const dialog=document.getElementById('chapter-lightbox');
    document.getElementById('chapter-lightbox-image').src=card.dataset.image||'';
    document.getElementById('chapter-lightbox-title').textContent=card.dataset.title||'';
    document.getElementById('chapter-lightbox-caption').textContent=card.dataset.caption||'';
    if(typeof dialog.showModal==='function') dialog.showModal();
  });
  document.querySelector('.lightbox-close')?.addEventListener('click',()=>document.getElementById('chapter-lightbox')?.close());
  document.getElementById('chapter-lightbox')?.addEventListener('click',e=>{ if(e.target===e.currentTarget) e.currentTarget.close(); });
  document.addEventListener('DOMContentLoaded',init);
})();
