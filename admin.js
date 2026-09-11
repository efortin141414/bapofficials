(function(){
 let db, profile, regions=[]; let memberCache=[];
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
 const safeUrl=(v='')=>/^https:\/\//i.test(v)?v:'';
 const MASTER_EMAIL='bapnationalcom@gmail.com';
 const wait=(ms)=>new Promise((_,reject)=>setTimeout(()=>reject(new Error('Connection timed out. The browser could not reach Supabase. Check the Supabase project status, internet connection, and Project URL.')),ms));
 const withTimeout=(promise,ms=20000)=>Promise.race([promise,wait(ms)]);
 function msg(form,text,ok=true){const el=form.querySelector('.form-message');if(el){el.textContent=text;el.className='form-message '+(ok?'form-success':'form-error')}}
 function loginStatus(text,ok=null){const el=$('#login-message');if(!el)return;el.textContent=text||'';el.className='form-message'+(ok===true?' form-success':ok===false?' form-error':'')}
 function fileExt(file){const p=file.name.split('.');return (p.pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg'}
 async function upload(file,prefix){if(!file)return null; const path=`${prefix}/${Date.now()}-${crypto.randomUUID()}.${fileExt(file)}`; const {error}=await withTimeout(db.storage.from('media').upload(path,file,{cacheControl:'3600',upsert:false}),60000);if(error)throw error;const {data}=db.storage.from('media').getPublicUrl(path);return data.publicUrl}
 function canManageRegion(regionId){return profile.role==='master_admin'||(profile.role==='regional_admin'&&profile.region_id===regionId)}
 function show(view){$$('.admin-view').forEach(x=>x.classList.toggle('active',x.id===`view-${view}`));$$('#admin-nav button').forEach(x=>x.classList.toggle('active',x.dataset.view===view));$('#view-title').textContent=$(`#admin-nav button[data-view="${view}"]`)?.textContent||'Dashboard'}
 async function loadProfile(user){
   loginStatus('Authentication successful. Checking Master Admin access…');
   const {data,error}=await withTimeout(db.from('profiles').select('id,full_name,role,region_id').eq('id',user.id).maybeSingle(),15000);
   if(error)throw new Error(`Signed in, but the admin profile could not be read: ${error.message}`);
   if(!data)throw new Error(`Signed in successfully, but no admin profile exists for ${user.email}. Run FIX_ADMIN_LOGIN.sql in Supabase SQL Editor.`);
   if(!['master_admin','regional_admin'].includes(data.role))throw new Error(`Signed in successfully, but this account has role "${data.role}" instead of master_admin.`);
   profile=data;$('#admin-user').textContent=`${data.full_name||user.email} • ${data.role.replace('_',' ')}`;
 }
 async function loadRegions(){const {data,error}=await withTimeout(db.from('regions').select('id,code,name,sort_order').eq('active',true).order('sort_order'),15000);if(error)throw error;regions=data||[];$$('.region-select').forEach(s=>{const keep=s.querySelector('option[value=""]')?.outerHTML||'';s.innerHTML=keep+regions.filter(r=>profile.role==='master_admin'||r.id===profile.region_id).map(r=>`<option value="${r.id}">${esc(r.code)} — ${esc(r.name)}</option>`).join('')})}
 async function stats(){const tables=['announcements','gallery','regional_posters','members'];const els=$$('#stats .stat strong');for(let i=0;i<tables.length;i++){let q=db.from(tables[i]).select('*',{count:'exact',head:true});if(profile.role==='regional_admin'&&tables[i]!=='announcements')q=q.eq('region_id',profile.region_id);const {count}=await withTimeout(q,15000);els[i].textContent=count??'—'}}
 async function loadAnnouncements(){const {data,error}=await withTimeout(db.from('announcements').select('*').order('created_at',{ascending:false}).limit(100),15000);if(error)throw error;$('#announcement-list').innerHTML=(data||[]).map(r=>`<div class="record-row"><div class="grow"><strong>${esc(r.title)}</strong><small>${esc(r.category||'Announcement')} • ${r.published?'Published':'Draft'}</small></div><button data-del-ann="${r.id}">Delete</button></div>`).join('')||'<p>No announcements yet.</p>'}
 async function loadGallery(){let q=db.from('gallery').select('*,regions(code)').order('created_at',{ascending:false}).limit(100);if(profile.role==='regional_admin')q=q.eq('region_id',profile.region_id);const {data,error}=await withTimeout(q,15000);if(error)throw error;$('#gallery-list').innerHTML=(data||[]).map(r=>`<article class="record-card"><img src="${esc(safeUrl(r.image_url))}" alt=""><div><strong>${esc(r.album_name)}</strong><small>${esc(r.regions?.code||'National')}</small><br><button data-del-gallery="${r.id}">Delete</button></div></article>`).join('')||'<p>No gallery photos yet.</p>'}
 async function loadPosters(){let q=db.from('regional_posters').select('*,regions(code,name)').order('created_at',{ascending:false});if(profile.role==='regional_admin')q=q.eq('region_id',profile.region_id);const {data,error}=await withTimeout(q,15000);if(error)throw error;$('#region-poster-list').innerHTML=(data||[]).map(r=>`<article class="record-card"><img src="${esc(safeUrl(r.image_url))}" alt=""><div><strong>${esc(r.person_name||r.title)}</strong><small>${esc(r.position||'')} • ${esc(r.regions?.code||'')}</small><br><button data-del-poster="${r.id}">Delete</button></div></article>`).join('')||'<p>No regional posters yet.</p>'}
 function renderAdminMembers(){const q=($('#admin-member-search').value||'').toLowerCase();const rows=memberCache.filter(r=>`${r.member_id} ${r.first_name} ${r.middle_name||''} ${r.last_name}`.toLowerCase().includes(q));$('#member-list').innerHTML=rows.map(r=>`<div class="record-row">${r.photo_url?`<img src="${esc(safeUrl(r.photo_url))}" alt="">`:''}<div class="grow"><strong>${esc([r.first_name,r.middle_name,r.last_name].filter(Boolean).join(' '))}</strong><small>${esc(r.member_id)} • ${esc(r.regions?.code||'')} • ${r.active?'Active':'Inactive'}</small></div><button data-del-member="${r.id}">Delete</button></div>`).join('')||'<p>No members found.</p>'}
 async function loadMembers(){let q=db.from('members').select('id,member_id,first_name,middle_name,last_name,photo_url,active,region_id,regions(code)').order('last_name');if(profile.role==='regional_admin')q=q.eq('region_id',profile.region_id);const {data,error}=await withTimeout(q,15000);if(error)throw error;memberCache=data||[];renderAdminMembers()}
 async function refresh(){await Promise.all([stats(),loadAnnouncements(),loadGallery(),loadPosters(),loadMembers()])}
 async function initApp(user){await loadProfile(user);await loadRegions();$('#login-view').hidden=true;$('#app-view').hidden=false;await refresh();loginStatus('')}
 function friendlyAuthError(err){
   const m=(err?.message||String(err)||'Unknown error').trim();
   if(/invalid login credentials/i.test(m))return 'Invalid email or password. Check the Supabase Authentication user and reset the password if needed.';
   if(/email not confirmed/i.test(m))return 'The Supabase user email is not confirmed. Confirm the user in Supabase Authentication → Users.';
   if(/failed to fetch|network|timed out|load failed/i.test(m))return 'Cannot reach Supabase. Check that the Supabase project is active and that the Project URL is exactly https://fizyesuapokjgfviwulr.supabase.co.';
   return m;
 }
 async function testConnection(){
   loginStatus('Testing Supabase connection…');
   const btn=$('#test-connection-btn'); if(btn)btn.disabled=true;
   try{
     db=db||window.getBaptoSupabase();
     const controller=new AbortController(); const t=setTimeout(()=>controller.abort(),10000);
     const res=await fetch(`${window.BAPTO_SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:window.BAPTO_SUPABASE_PUBLISHABLE_KEY||window.BAPTO_SUPABASE_ANON_KEY},signal:controller.signal});
     clearTimeout(t);
     if(!res.ok)throw new Error(`Supabase returned HTTP ${res.status}.`);
     loginStatus('Supabase connection is working. You can sign in.',true);
   }catch(err){loginStatus(friendlyAuthError(err),false)}finally{if(btn)btn.disabled=false}
 }
 async function boot(){
   try{db=window.getBaptoSupabase()}catch(e){loginStatus(e.message,false);return}
   try{
     const {data:{session}}=await withTimeout(db.auth.getSession(),8000);
     if(session)await initApp(session.user);
   }catch(e){
     // Do not block a fresh login if restoring a previous session times out/fails.
     loginStatus(friendlyAuthError(e),false);
   }
 }
 document.addEventListener('DOMContentLoaded',()=>{
  const email=$('#login-email'); if(email&&!email.value)email.value=MASTER_EMAIL;
  boot();
  $('#test-connection-btn')?.addEventListener('click',testConnection);
  $('#login-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const submit=e.currentTarget.querySelector('button[type="submit"]');
    submit.disabled=true; submit.textContent='Signing In…'; loginStatus('Connecting to Supabase…');
    try{
      db=db||window.getBaptoSupabase();
      const email=$('#login-email').value.trim();
      const password=$('#login-password').value;
      const {data,error}=await withTimeout(db.auth.signInWithPassword({email,password}),20000);
      if(error)throw error;
      if(!data?.user)throw new Error('Supabase did not return a signed-in user.');
      await initApp(data.user);
    }catch(err){
      loginStatus(friendlyAuthError(err),false);
      try{await db?.auth?.signOut()}catch(_){/* ignore */}
    }finally{
      submit.disabled=false; submit.textContent='Sign In';
    }
  });
  $('#logout-btn').addEventListener('click',async()=>{await db.auth.signOut();location.reload()});
  $$('#admin-nav button').forEach(b=>b.addEventListener('click',()=>show(b.dataset.view)));
  $('#admin-member-search').addEventListener('input',renderAdminMembers);
  $('#announcement-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;msg(f,'Saving…');try{const fd=new FormData(f);const image=await upload(fd.get('image'),'announcements');const {error}=await withTimeout(db.from('announcements').insert({title:fd.get('title'),category:fd.get('category')||null,event_date:fd.get('event_date')||null,body:fd.get('body')||null,image_url:image,published:fd.get('published')==='on',published_at:fd.get('published')==='on'?new Date().toISOString():null,created_by:profile.id}),20000);if(error)throw error;f.reset();msg(f,'Announcement saved.');await refresh()}catch(err){msg(f,friendlyAuthError(err),false)}});
  $('#gallery-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;msg(f,'Uploading…');try{const fd=new FormData(f);const regionId=fd.get('region_id')||null;if(regionId&&!canManageRegion(regionId))throw new Error('You cannot manage this region.');const image=await upload(fd.get('image'),'gallery');const {error}=await withTimeout(db.from('gallery').insert({album_name:fd.get('album_name'),region_id:regionId,event_date:fd.get('event_date')||null,caption:fd.get('caption')||null,image_url:image,published:fd.get('published')==='on',created_by:profile.id}),20000);if(error)throw error;f.reset();msg(f,'Gallery photo uploaded.');await refresh()}catch(err){msg(f,friendlyAuthError(err),false)}});
  $('#region-poster-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;msg(f,'Uploading…');try{const fd=new FormData(f);const regionId=fd.get('region_id');if(!canManageRegion(regionId))throw new Error('You cannot manage this region.');const image=await upload(fd.get('image'),'regional-posters');const {error}=await withTimeout(db.from('regional_posters').insert({region_id:regionId,person_name:fd.get('person_name'),position:fd.get('position')||null,caption:fd.get('caption')||null,image_url:image,published:fd.get('published')==='on',created_by:profile.id}),20000);if(error)throw error;f.reset();msg(f,'Regional poster uploaded.');await refresh()}catch(err){msg(f,friendlyAuthError(err),false)}});
  $('#member-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;msg(f,'Saving…');try{const fd=new FormData(f);const regionId=fd.get('region_id');if(!canManageRegion(regionId))throw new Error('You cannot manage this region.');const image=fd.get('image')?.size?await upload(fd.get('image'),'member-photos'):null;const payload={member_id:fd.get('member_id'),region_id:regionId,first_name:fd.get('first_name'),middle_name:fd.get('middle_name')||null,last_name:fd.get('last_name'),position:fd.get('position')||null,accreditation_level:fd.get('accreditation_level')||null,valid_until:fd.get('valid_until')||null,photo_url:image,active:fd.get('active')==='on',public_profile:fd.get('public_profile')==='on',created_by:profile.id};const {error}=await withTimeout(db.from('members').insert(payload),20000);if(error)throw error;f.reset();msg(f,'Member saved.');await refresh()}catch(err){msg(f,friendlyAuthError(err),false)}});
  document.body.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;let table,id;if(b.dataset.delAnn){table='announcements';id=b.dataset.delAnn}if(b.dataset.delGallery){table='gallery';id=b.dataset.delGallery}if(b.dataset.delPoster){table='regional_posters';id=b.dataset.delPoster}if(b.dataset.delMember){table='members';id=b.dataset.delMember}if(!table)return;if(!confirm('Delete this record?'))return;const {error}=await withTimeout(db.from(table).delete().eq('id',id),20000);if(error)alert(error.message);else await refresh()});
 });
})();
