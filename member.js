(function(){
 const esc=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
 const safeUrl=(v='')=>/^https:\/\//i.test(v)?v:'';
 const placeholder='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="100%" height="100%" fill="#e9edf4"/><circle cx="200" cy="145" r="72" fill="#b7c2d3"/><rect x="80" y="240" width="240" height="120" rx="60" fill="#b7c2d3"/></svg>');
 document.addEventListener('DOMContentLoaded',async()=>{
  const box=document.getElementById('member-profile'); const id=new URLSearchParams(location.search).get('id');
  if(!id){box.innerHTML='<p>No member ID was provided.</p>';return;}
  try{
   const db=window.getBaptoSupabase();
   const {data,error}=await db.from('members').select('member_id,first_name,middle_name,last_name,position,accreditation_level,photo_url,valid_until,active,public_profile,locality_name,locality_type,regions(name),chapters(name,locality_name,locality_type)').eq('member_id',id).eq('public_profile',true).maybeSingle();
   if(error) throw error; if(!data){box.innerHTML='<p>Member record not found or is not public.</p>';return;}
   const name=[data.first_name,data.middle_name,data.last_name].filter(Boolean).join(' ');
   box.innerHTML=`<img class="verify-photo" src="${esc(safeUrl(data.photo_url)||placeholder)}" alt="Member photo"><div style="text-align:center"><span class="verify-status">${data.active?'✓ ACTIVE MEMBER':'INACTIVE'}</span><h2>${esc(name)}</h2><p><strong>${esc(data.member_id)}</strong></p></div><div class="verify-grid"><div class="verify-field"><small>Region</small>${esc(data.regions?.name||'—')}</div><div class="verify-field"><small>City / Municipality</small>${esc(data.locality_name||data.chapters?.locality_name||'—')}</div><div class="verify-field"><small>Chapter</small>${esc(data.chapters?.name||'—')}</div><div class="verify-field"><small>Position</small>${esc(data.position||'Technical Official')}</div><div class="verify-field"><small>Accreditation</small>${esc(data.accreditation_level||'—')}</div><div class="verify-field"><small>Valid Until</small>${esc(data.valid_until||'—')}</div><div class="verify-field"><small>Verification</small>${data.active?'Verified':'Not active'}</div></div><div class="verify-actions"><a href="/" class="btn btn-gold">Return to BAPTO Website</a></div>`;
  }catch(e){box.innerHTML='<p>Member verification is not available yet. Please check the Supabase configuration.</p>';console.error(e);}
 });
})();
