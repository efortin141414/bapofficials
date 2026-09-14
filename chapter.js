(() => {
  const esc = v => String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const safeUrl = u => { try { const x=new URL(String(u||''),location.origin); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };
  const params = new URLSearchParams(location.search);
  const chapterId = params.get('id');
  const root = document.getElementById('chapter-page');
  const fmtDate=v=>{ if(!v) return ''; const raw=String(v); const d=new Date(raw.length===10?`${raw}T00:00:00`:raw); return Number.isNaN(d.getTime()) ? raw : d.toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}); };

  function mediaItem(type,r){
    const isPoster=type==='poster';
    const title=isPoster?(r.person_name||r.title||'Chapter Poster'):(r.album_name||r.caption||'Chapter Gallery');
    const caption=isPoster?[r.position,r.caption].filter(Boolean).join(' — '):(r.caption||'');
    const image=safeUrl(r.image_url);
    if(!image) return '';
    const date=fmtDate(r.event_date||r.created_at);
    return `<button type="button" class="chapter-media-card ${isPoster?'poster':''}" data-image="${esc(image)}" data-title="${esc(title)}" data-caption="${esc(caption)}"><div class="chapter-media-frame"><img src="${esc(image)}" alt="${esc(title)}" loading="lazy"></div><div class="chapter-media-copy"><span>${isPoster?'Leadership / Poster':'Gallery Photo'}</span><strong>${esc(title)}</strong>${date?`<small>${esc(date)}</small>`:''}</div></button>`;
  }

  async function init(){
    if(!chapterId){ root.innerHTML='<section class="chapter-error-card"><div><strong>Chapter not specified.</strong>Open this page from the Regional Chapters or Membership directory.</div></section>'; return; }
    try{
      const db=window.getBaptoSupabase();
      const {data:chapter,error}=await db.from('chapters').select('id,name,chapter_type,locality_code,locality_name,locality_type,region_id,regions(code,name)').eq('id',chapterId).eq('active',true).maybeSingle();
      if(error) throw error;
      if(!chapter){ root.innerHTML='<section class="chapter-error-card"><div><strong>Chapter not found.</strong>This chapter may be inactive or unavailable.</div></section>'; return; }
      const [galleryRes,posterRes]=await Promise.all([
        db.from('gallery').select('id,album_name,caption,event_date,image_url,created_at').eq('chapter_id',chapterId).eq('published',true).order('event_date',{ascending:false,nullsFirst:false}),
        db.from('regional_posters').select('id,title,person_name,position,caption,image_url,created_at').eq('chapter_id',chapterId).eq('published',true).order('created_at',{ascending:false})
      ]);
      if(galleryRes.error) throw galleryRes.error;
      if(posterRes.error) throw posterRes.error;
      const gallery=galleryRes.data||[];
      const posters=posterRes.data||[];
      const total=gallery.length+posters.length;
      document.title=`${chapter.name} Gallery | BAPTO`;
      root.innerHTML=`
        <section class="chapter-hero">
          <span class="chapter-kicker">${esc(chapter.regions?.code||'BAPTO')} • Official Chapter Gallery</span>
          <h1>${esc(chapter.name)}</h1>
          <p>${esc(chapter.locality_name||chapter.regions?.name||'Philippines')} — official posters, accreditation activities, seminars, tournaments and chapter events.</p>
          <div class="chapter-breadcrumbs"><span>${esc(chapter.regions?.name||'Region')}</span>${chapter.locality_name?`<span>${esc(chapter.locality_name)}${chapter.locality_type?` • ${esc(chapter.locality_type)}`:''}</span>`:''}<span>${esc(String(chapter.chapter_type||'chapter').replace(/(^|\s)\S/g,m=>m.toUpperCase()))} Chapter</span></div>
        </section>
        <section class="chapter-stats gallery-only-stats">
          <div class="chapter-stat"><strong>${total}</strong><span>Published Gallery Items</span></div>
          <div class="chapter-stat"><strong>${posters.length}</strong><span>Official Posters</span></div>
          <div class="chapter-stat"><strong>${gallery.length}</strong><span>Event Photos</span></div>
        </section>
        <section class="chapter-section" id="gallery">
          <div class="chapter-section-head"><div><h2>Chapter Gallery</h2><p>All published chapter posters and activity photos are displayed here. Member profiles are kept in the Membership Directory.</p></div><span class="chapter-section-badge">${total} Published</span></div>
          ${total?`<div class="chapter-gallery-grid">${posters.map(r=>mediaItem('poster',r)).join('')}${gallery.map(r=>mediaItem('gallery',r)).join('')}</div>`:'<div class="chapter-empty">No published chapter gallery items yet.</div>'}
        </section>
        <div class="chapter-footer-actions"><a class="primary" href="/#regional-chapters">Browse Regional Galleries</a><a class="secondary" href="/#member-directory">Membership Directory</a></div>`;
    } catch(err){ console.error(err); root.innerHTML=`<section class="chapter-error-card"><div><strong>Unable to load chapter gallery.</strong>${esc(err.message||'Please try again later.')}</div></section>`; }
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
  init();
})();
