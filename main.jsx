import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { createClient } from '@supabase/supabase-js';
import './styles.css';
import { BAP_LOGO, ID_FRONT, ID_BACK } from './embedded-assets.js';
import {
  PAUL_SABATE_POSTER,
  NORBERTO_SANCHEZ_POSTER,
  RONALD_VELASQUEZ_POSTER,
  ENRIQUE_SIMON_LIM_POSTER,
  ARTURO_CALIWAG_POSTER,
  ARTURO_ROJAS_POSTER,
  CHESTER_ROTA_POSTER
} from './featured-posters.js';
import { BLANK_MEMBERSHIP_PDF_BASE64 } from './blank-form-pdf.js';

const runtimeConfig = typeof window !== 'undefined' ? (window.BAP_SUPABASE_CONFIG || {}) : {};

function cleanConfigValue(value){
  const v=String(value||'').trim();
  if(
    !v ||
    v.includes('PASTE_NEW_') ||
    v.includes('YOUR-NEW-PROJECT') ||
    v.includes('YOUR_NEW_PUBLISHABLE')
  ) return '';
  return v;
}

function browserConfig(){
  if(typeof window==='undefined') return {supabaseUrl:'',supabaseKey:''};
  return {
    supabaseUrl: cleanConfigValue(window.localStorage.getItem('bap_fresh_supabase_url')),
    supabaseKey: cleanConfigValue(window.localStorage.getItem('bap_fresh_supabase_key'))
  };
}

const localConfig = browserConfig();

// Production/global configuration:
// 1. Vercel/Vite environment variables (works on all devices)
// 2. Optional public/supabase-config.js
// 3. Browser-local setup as a fallback only
const envSupabaseUrl = cleanConfigValue(import.meta.env.VITE_SUPABASE_URL);
const envSupabaseKey = cleanConfigValue(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const supabaseUrl = cleanConfigValue(
  envSupabaseUrl ||
  runtimeConfig.supabaseUrl ||
  localConfig.supabaseUrl
).replace(/\/+$/, '');

const supabaseKey = cleanConfigValue(
  envSupabaseKey ||
  runtimeConfig.supabaseKey ||
  localConfig.supabaseKey
);

// V6.53 ORIGINAL VERCEL QR LOCK
// All public membership QR codes and public profile links are intentionally locked
// to the original stable Vercel production domain. This prevents any old/broken
// custom-domain environment value (such as members.bapofficial.ph) from being used.
const STABLE_VERCEL_PUBLIC_URL = 'https://bap-membership-system-fresh-v3.vercel.app';
const PUBLIC_PROFILE_BASE_URL = STABLE_VERCEL_PUBLIC_URL;
const publicSiteUrl = STABLE_VERCEL_PUBLIC_URL;

const validSupabaseUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl);
const validSupabaseKey =
  (supabaseKey.startsWith('sb_publishable_') || supabaseKey.startsWith('eyJ')) &&
  supabaseKey.length >= 30 &&
  !supabaseKey.toLowerCase().includes('secret') &&
  !supabaseKey.toLowerCase().includes('service_role');

const supabaseConfigured = validSupabaseUrl && validSupabaseKey;

const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseKey, {
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
}) : null;

function safeSupabaseHost(){
  try{return new URL(supabaseUrl).host;}catch{return 'Not configured';}
}

async function testConnectionValues(url,key){
  const cleanUrl=cleanConfigValue(url).replace(/\/+$/,'');
  const cleanKey=cleanConfigValue(key);
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cleanUrl)){
    return {ok:false,message:'Project URL must look like https://xxxxxxxx.supabase.co'};
  }
  if(!(cleanKey.startsWith('sb_publishable_') || cleanKey.startsWith('eyJ')) || cleanKey.length<30){
    return {ok:false,message:'Use the Supabase Publishable/anon public key. Do not use a secret or service_role key.'};
  }
  if(cleanKey.toLowerCase().includes('secret') || cleanKey.toLowerCase().includes('service_role')){
    return {ok:false,message:'Secret/service_role keys are not allowed in the website.'};
  }
  try{
    const response=await fetch(`${cleanUrl}/rest/v1/regions?select=id&limit=1`,{
      headers:{apikey:cleanKey,Authorization:`Bearer ${cleanKey}`}
    });
    const body=await response.text();
    if(!response.ok){
      return {ok:false,message:`Supabase HTTP ${response.status}: ${body.slice(0,240)}`};
    }
    return {ok:true,message:`Connected successfully to ${new URL(cleanUrl).host}.`};
  }catch(error){
    return {ok:false,message:`Network connection failed: ${error?.message||'Failed to fetch'}. Check the Project URL and confirm the Supabase project is active.`};
  }
}

async function testSupabaseConnection(){
  if(!supabaseConfigured) return {ok:false,message:'Supabase is not configured yet.'};
  return testConnectionValues(supabaseUrl,supabaseKey);
}

function saveBrowserConnection(url,key){
  if(typeof window==='undefined') return;
  window.localStorage.setItem('bap_fresh_supabase_url',cleanConfigValue(url).replace(/\/+$/,''));
  window.localStorage.setItem('bap_fresh_supabase_key',cleanConfigValue(key));
}

function clearBrowserConnection(){
  if(typeof window==='undefined') return;
  window.localStorage.removeItem('bap_fresh_supabase_url');
  window.localStorage.removeItem('bap_fresh_supabase_key');
}

const money = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(Number(value || 0));

const fmtDate = (value) =>
  value
    ? new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
      }).format(new Date(value))
    : '—';

const statusLabel = (value) =>
  String(value || 'pending').replaceAll('_', ' ').toUpperCase();

function extractControlNumber(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    const verifyIndex = parts.indexOf('verify');
    if (verifyIndex >= 0 && parts[verifyIndex + 1]) return decodeURIComponent(parts[verifyIndex + 1]);
    const profileIndex = parts.indexOf('profile');
    if (profileIndex >= 0 && parts[profileIndex + 1]) return decodeURIComponent(parts[profileIndex + 1]);
  } catch {}
  return value;
}

// V6.51: the in-app scanner can recover identifiers even from old parked-domain QR URLs.
function resolveLookupTarget(raw){
  const value = String(raw || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    const parts = url.pathname.split('/').filter(Boolean);
    const profileIndex = parts.indexOf('profile');
    if (profileIndex >= 0 && parts[profileIndex + 1]) {
      return `/profile/${encodeURIComponent(decodeURIComponent(parts[profileIndex + 1]))}`;
    }
    const verifyIndex = parts.indexOf('verify');
    if (verifyIndex >= 0 && parts[verifyIndex + 1]) {
      // Old /verify QR codes are synchronized to the current public profile.
      return `/profile/${encodeURIComponent(decodeURIComponent(parts[verifyIndex + 1]))}`;
    }
  } catch {}
  const identifier = extractControlNumber(value);
  return identifier ? `/profile/${encodeURIComponent(identifier)}` : '';
}


async function dataUrlToFile(dataUrl, fileName = 'signature.png') {
  if (!dataUrl) return null;
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || 'image/png' });
}

function SignaturePadField({
  name,
  disabled = false,
  existingUrl = '',
  title = 'Draw Signature Online',
  subtitle = 'Use your finger on mobile or your mouse/trackpad on desktop.',
  buttonLabel = 'Clear Drawn Signature'
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState('');
  const dataUrlRef = useRef('');
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    dataUrlRef.current = dataUrl;
  }, [dataUrl]);

  const prepareCanvas = React.useCallback((savedImage = dataUrlRef.current) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const holderWidth = Math.max(Math.floor(wrapRef.current?.clientWidth || 0), 260);
    const width = holderWidth;
    const height = 150;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
    ctx.fillStyle = '#111827';
    if (savedImage) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = savedImage;
    }
  }, []);

  useEffect(() => {
    prepareCanvas();
    const onResize = () => prepareCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [prepareCanvas]);

  function pointFromEvent(event) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function begin(event) {
    if (disabled) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = pointFromEvent(event);
    drawingRef.current = true;
    lastPointRef.current = point;
    canvas.setPointerCapture?.(event.pointerId);
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw(event) {
    if (disabled || !drawingRef.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = pointFromEvent(event);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }

  function end(event) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    event?.currentTarget?.releasePointerCapture?.(event.pointerId);
    const canvas = canvasRef.current;
    const nextUrl = canvas.toDataURL('image/png');
    setDataUrl(nextUrl);
  }

  function clearDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDataUrl('');
  }

  return (
    <div className={`signature-draw-field form-span-full ${disabled ? 'is-disabled' : ''}`}>
      <div className="signature-draw-head">
        <div>
          <b>{title}</b>
          <span>{subtitle}</span>
        </div>
        <button type="button" className="btn signature-clear-btn" onClick={clearDrawing} disabled={disabled && !dataUrl && !existingUrl}>{buttonLabel}</button>
      </div>
      {existingUrl && !dataUrl ? (
        <div className="signature-current-preview">
          <small>Current saved signature</small>
          <img src={existingUrl} alt="Current saved signature" />
        </div>
      ) : null}
      <div ref={wrapRef} className="signature-pad-wrap">
        <canvas
          ref={canvasRef}
          className="signature-pad-canvas"
          onPointerDown={begin}
          onPointerMove={draw}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
      </div>
      <input type="hidden" name={name} value={dataUrl} />
      <div className="signature-draw-meta">
        <span>{dataUrl ? 'Drawn signature captured and ready for upload.' : 'No drawn signature yet.'}</span>
        <span>Tip: Sign inside the box above.</span>
      </div>
    </div>
  );
}


function slugify(value){
  return String(value||'section')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'') || 'section';
}

function memberUniqueId(member){
  return member?.member_id_number || member?.control_number || 'PENDING';
}

function memberProfileIdentifier(member){
  return String(member?.member_id_number || member?.control_number || '').trim();
}

function memberProfilePath(member){
  const identifier=memberProfileIdentifier(member);
  return identifier
    ? `/profile/${encodeURIComponent(identifier)}`
    : '/lookup';
}

function memberQrValue(member){
  // ONE FIXED PUBLIC QR DESTINATION FOR THE WHOLE SYSTEM:
  // ID, certificate, directory, profile page, Excel ID-processing export,
  // and Master-generated QR codes all open the public member profile directly.
  return `${PUBLIC_PROFILE_BASE_URL}${memberProfilePath(member)}`;
}

function MemberProfileQr({member,size=120}){
  const value=memberQrValue(member);
  if(!value)return null;
  return <QRCodeSVG value={value} size={size} level="H" includeMargin bgColor="#FFFFFF" fgColor="#000000"/>;
}

function LegacyQrRedirect(){
  const params=useParams();
  const query=typeof window!=='undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const rawIdentifier =
    params.control ||
    params.identifier ||
    query.get('identifier') ||
    query.get('member_id') ||
    query.get('memberId') ||
    query.get('control') ||
    query.get('id') ||
    '';

  const identifier=extractControlNumber(rawIdentifier);
  return identifier
    ? <Navigate to={`/profile/${encodeURIComponent(identifier)}`} replace/>
    : <Navigate to="/lookup" replace/>;
}


let idTemplateCache=null;
let idTemplateRequest=null;

async function getActiveIdTemplate(){
  if(idTemplateCache)return idTemplateCache;
  if(idTemplateRequest)return idTemplateRequest;
  idTemplateRequest=supabase
    .from('id_templates')
    .select('template_key,front_url,back_url,layout_key,updated_at')
    .eq('template_key','national_membership')
    .maybeSingle()
    .then(({data,error})=>{
      idTemplateRequest=null;
      if(error){
        console.warn('ID template manager is not configured yet:',error.message);
        return null;
      }
      idTemplateCache=data||null;
      return idTemplateCache;
    })
    .catch(error=>{
      idTemplateRequest=null;
      console.warn('Could not load ID template:',error);
      return null;
    });
  return idTemplateRequest;
}

function setActiveIdTemplateCache(template){
  idTemplateCache=template||null;
  idTemplateRequest=null;
}

function useActiveIdTemplate(){
  const[template,setTemplate]=useState(idTemplateCache);
  useEffect(()=>{
    let alive=true;
    getActiveIdTemplate().then(value=>{if(alive)setTemplate(value);});
    return()=>{alive=false;};
  },[]);
  return template;
}

async function qrValueToPngDataUrl(value,size=120){
  if(typeof document==='undefined' || !value) return null;
  const mount=document.createElement('div');
  mount.style.position='fixed';
  mount.style.left='-99999px';
  mount.style.top='-99999px';
  mount.style.width='0';
  mount.style.height='0';
  mount.style.overflow='hidden';
  document.body.appendChild(mount);
  let root;
  try{
    root=ReactDOM.createRoot(mount);
    root.render(
      <QRCodeCanvas
        value={value}
        size={size}
        includeMargin={true}
        level="H"
        bgColor="#FFFFFF"
        fgColor="#000000"
      />
    );
    await new Promise(resolve=>setTimeout(resolve,60));
    const canvas=mount.querySelector('canvas');
    return canvas?.toDataURL('image/png')||null;
  }catch(error){
    console.warn('QR export skipped:',value,error);
    return null;
  }finally{
    try{root?.unmount?.();}catch{}
    mount.remove();
  }
}

async function memberQrPngDataUrl(member,size=120){
  return qrValueToPngDataUrl(memberQrValue(member),size);
}

function safeDownloadName(value){
  return String(value||'BAP-MEMBER')
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g,'-')
    .replace(/-+/g,'-')
    .replace(/^-|-$/g,'') || 'BAP-MEMBER';
}

function imageExtensionFromUrl(url,fallback='png'){
  try{
    const pathname=new URL(url,window.location.origin).pathname.toLowerCase();
    const match=pathname.match(/\.([a-z0-9]{2,5})$/);
    const ext=match?.[1]||'';
    if(['jpg','jpeg','png','webp','gif'].includes(ext))return ext;
  }catch{}
  return fallback;
}

function extensionFromContentType(type,fallback='png'){
  const t=String(type||'').toLowerCase();
  if(t.includes('jpeg'))return 'jpg';
  if(t.includes('png'))return 'png';
  if(t.includes('webp'))return 'webp';
  if(t.includes('gif'))return 'gif';
  return fallback;
}

function triggerBlobDownload(blob,fileName){
  const href=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=href;
  a.download=fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(href),1200);
}

function triggerDataUrlDownload(dataUrl,fileName){
  const a=document.createElement('a');
  a.href=dataUrl;
  a.download=fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function fetchMemberImageAsset(url,baseName,label){
  if(!url)throw new Error(`${label} is not available.`);
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw new Error(`Unable to download ${label.toLowerCase()}.`);
  const blob=await response.blob();
  const ext=extensionFromContentType(blob.type,imageExtensionFromUrl(url,'png'));
  return {blob,fileName:`${baseName}_${label}.${ext}`};
}

async function downloadMemberAsset(member,type){
  const memberId=String(member?.member_id_number||'').trim();
  if(!memberId){
    alert('Membership ID Number must be issued before downloading member assets.');
    return;
  }
  const baseName=safeDownloadName(memberId);
  try{
    if(type==='photo'){
      const asset=await fetchMemberImageAsset(member.photo_url,baseName,'PHOTO');
      triggerBlobDownload(asset.blob,asset.fileName);
      return;
    }
    if(type==='signature'){
      const asset=await fetchMemberImageAsset(member.member_signature_url,baseName,'SIGNATURE');
      triggerBlobDownload(asset.blob,asset.fileName);
      return;
    }
    if(type==='qr'){
      const dataUrl=await memberQrPngDataUrl(member,900);
      if(!dataUrl)throw new Error('Unable to generate QR image.');
      triggerDataUrlDownload(dataUrl,`${baseName}_QR.png`);
      return;
    }
  }catch(error){
    alert(error?.message||'Unable to download member asset.');
  }
}

async function buildMemberAssetZip(selectedMembers,assetMode,onProgress){
  const members=(selectedMembers||[]).filter(m=>m?.member_id_number);
  if(!members.length)throw new Error('Select at least one member with an issued Membership ID Number.');
  const {default:JSZip}=await import('jszip');
  const zip=new JSZip();
  let completed=0;
  const total=members.length;
  for(const member of members){
    const baseName=safeDownloadName(member.member_id_number);
    const folder=zip.folder(baseName);
    const wanted=assetMode==='all'?['photo','qr','signature']:[assetMode];
    for(const type of wanted){
      try{
        if(type==='photo'&&member.photo_url){
          const asset=await fetchMemberImageAsset(member.photo_url,baseName,'PHOTO');
          folder.file(asset.fileName,await asset.blob.arrayBuffer());
        }else if(type==='signature'&&member.member_signature_url){
          const asset=await fetchMemberImageAsset(member.member_signature_url,baseName,'SIGNATURE');
          folder.file(asset.fileName,await asset.blob.arrayBuffer());
        }else if(type==='qr'){
          const dataUrl=await memberQrPngDataUrl(member,900);
          const base64=dataUrl?.split(',')[1];
          if(base64)folder.file(`${baseName}_QR.png`,base64,{base64:true});
        }
      }catch(error){
        console.warn(`Skipped ${type} for ${member.member_id_number}:`,error);
      }
    }
    completed+=1;
    onProgress?.(completed,total);
  }
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});
  const stamp=new Date().toISOString().slice(0,10);
  triggerBlobDownload(blob,`BAP_MEMBER_ASSETS_${assetMode.toUpperCase()}_${stamp}.zip`);
}

function useSession(){
 const [session,setSession]=useState(undefined);
 useEffect(()=>{
   if(!supabase){
     setSession(null);
     return;
   }
   let alive=true;
   supabase.auth.getSession()
     .then(({data})=>alive&&setSession(data.session||null))
     .catch(()=>alive&&setSession(null));
   const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s||null));
   return()=>{
     alive=false;
     data.subscription.unsubscribe();
   };
 },[]);
 return session;
}
function Nav({session}){const nav=useNavigate(); async function logout(){await supabase.auth.signOut();nav('/');}return <header className="topbar website-topbar no-print"><Link className="brand website-brand" to="/"><img src={BAP_LOGO} alt="BAP Technical Officials logo"/><span><b>BAP Technical Officials Inc.</b><small>Official National Website & Membership System</small></span></Link><nav className="website-nav"><Link to="/">Home</Link><Link to="/about">About</Link><Link to="/organization">Leadership</Link><Link to="/membership-directory">Directory</Link><Link to="/posters">Posters</Link><Link to="/membership">Membership</Link><Link to="/lookup">Verify ID</Link>{session?<><Link to="/dashboard">My Dashboard</Link><button onClick={logout}>Logout</button></>:<><Link to="/login">Member Login</Link><Link className="master-nav-link" to="/master-login">Master Access</Link><Link className="nav-cta" to="/register">Apply Now</Link></>}</nav></header>}
function App(){
 const session=useSession();
 if(!supabaseConfigured)return <SupabaseSetupRequired/>;
 return <><Nav session={session}/><Routes><Route path="/" element={<Home/>}/><Route path="/about" element={<AboutWebsite/>}/><Route path="/membership" element={<MembershipWebsite/>}/><Route path="/posters" element={<PublicPosterGallery/>}/><Route path="/contact" element={<ContactWebsite/>}/><Route path="/executive-dashboard" element={<ExecutiveDashboard/>}/><Route path="/organization" element={<OrganizationChart/>}/><Route path="/membership-directory" element={<MembershipDirectory/>}/><Route path="/blank-membership-form" element={<BlankMembershipForm/>}/><Route path="/connection-test" element={<Navigate to="/" replace/>}/><Route path="/login" element={<Login/>}/><Route path="/master-login" element={<MasterLogin session={session}/>}/><Route path="/register" element={<Register/>}/><Route path="/dashboard" element={<Dashboard session={session}/>}/><Route path="/member" element={<Member session={session}/>}/><Route path="/payment/:id" element={<Payment session={session}/>}/><Route path="/application-form/:id" element={<ApplicationForm session={session}/>}/><Route path="/master-access" element={<NationalAdmin session={session} masterMode/>}/><Route path="/national-admin" element={<Navigate to="/master-access" replace/>}/><Route path="/regional-admin" element={<RegionalAdmin session={session}/>}/><Route path="/lookup" element={<Lookup/>}/><Route path="/verify" element={<LegacyQrRedirect/>}/><Route path="/verify/:control" element={<LegacyQrRedirect/>}/><Route path="/qr/:identifier" element={<LegacyQrRedirect/>}/><Route path="/id/:identifier" element={<LegacyQrRedirect/>}/><Route path="/member-profile/:identifier" element={<LegacyQrRedirect/>}/><Route path="/profile/:identifier" element={<PublicMemberProfile/>}/><Route path="/print/id/:id" element={<PrintId session={session}/>}/><Route path="/print/certificate/:id" element={<PrintCertificate session={session}/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes><WebsiteFooter/></>;
}

function SupabaseSetupRequired(){
 const[url,setUrl]=useState('');
 const[key,setKey]=useState('');
 const[busy,setBusy]=useState(false);
 const[result,setResult]=useState(null);

 async function connect(e){
   e.preventDefault();
   setBusy(true);
   setResult(null);
   const test=await testConnectionValues(url,key);
   setResult(test);
   setBusy(false);
   if(test.ok){
     saveBrowserConnection(url,key);
     window.location.href='/';
   }
 }

 return <main className="config-page"><section className="config-card">
   <img src={BAP_LOGO} alt="BAP logo" className="config-logo"/>
   <span className="config-badge">SYSTEM CONFIGURATION</span>
   <h1>Complete System Configuration</h1>
   <p>This one-time configuration is required only when the application has not yet been connected to its database.</p>

   <form className="fresh-connect-form" onSubmit={connect}>
     <label>New Supabase Project URL
       <input
         value={url}
         onChange={e=>setUrl(e.target.value)}
         placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
         autoComplete="off"
         required
       />
     </label>
     <label>Publishable / anon public key
       <input
         value={key}
         onChange={e=>setKey(e.target.value)}
         placeholder="sb_publishable_..."
         autoComplete="off"
         required
       />
     </label>
     <button className="btn btn-gold" disabled={busy}>
       {busy?'Connecting...':'Connect Membership System'}
     </button>
   </form>

   {result&&<div className={result.ok?'connection-result success':'connection-result error'}>{result.message}</div>}

   <div className="config-steps">
     <h2>One-time setup</h2>
     <ol>
       <li>Create a completely new Supabase project.</li>
       <li>Run <code>supabase/01_FRESH_SUPABASE_SETUP.sql</code> one time only.</li>
       <li>Copy the Project URL and Publishable/anon public key from the new project.</li>
       <li>Enter them above. No GitHub editing is required for the first connection.</li>
     </ol>
   </div>

   <div className="config-warning">
     <b>Never enter an sb_secret or service_role key.</b>
     <span>Master passwords are stored only in Supabase Authentication and are never saved by this setup screen.</span>
   </div>
 </section></main>;
}

function ConnectionTest(){
 const[result,setResult]=useState(null);
 const[busy,setBusy]=useState(false);

 async function run(){
   setBusy(true);
   setResult(null);
   const test=await testSupabaseConnection();
   setResult(test);
   setBusy(false);
 }

 function reset(){
   if(!window.confirm('Disconnect this browser from Supabase and return to fresh setup?'))return;
   clearBrowserConnection();
   window.location.href='/';
 }

 return <main className="narrow page">
   <div className="page-title">
     <span className="eyebrow">Fresh System Diagnostics</span>
     <h1>Supabase Connection Test</h1>
     <p>Confirm the new database connection before creating the Master account or registering members.</p>
   </div>

   <section className="panel">
     <div className="diagnostic-row"><span>Supabase Host</span><b>{safeSupabaseHost()}</b></div>
     <div className="diagnostic-row"><span>Project URL</span><b>{validSupabaseUrl?'VALID':'INVALID'}</b></div>
     <div className="diagnostic-row"><span>Publishable Key</span><b>{validSupabaseKey?'DETECTED':'INVALID'}</b></div>
     <div className="mini-actions connection-actions">
       <button className="btn btn-gold" onClick={run} disabled={busy}>
         {busy?'Testing...':'Test Supabase Connection'}
       </button>
       <button className="btn" type="button" onClick={reset}>Reset Connection</button>
       <Link className="btn" to="/">Open Membership System</Link>
     </div>
     {result&&<div className={result.ok?'connection-result success':'connection-result error'}>
       {result.message}
     </div>}
   </section>
 </main>;
}



const FEATURED_LEADERSHIP_POSTERS=[
  {
    id:'featured-paul-sabate',
    poster_type:'commissioner',
    person_name:'Paul Sabate III',
    position_title:'Regional Commissioner',
    region_name:'Region V — Bicol Region',
    area:'Region V',
    caption:'Discipline • Integrity • Fair Play • Stronger Together',
    image_url:PAUL_SABATE_POSTER,
    featured:true
  },
  {
    id:'featured-norberto-sanchez',
    poster_type:'commissioner',
    person_name:'Norberto Sanchez',
    position_title:'Deputy Regional Commissioner',
    region_name:'Region V — Bicol Region',
    area:'Bicol Region',
    caption:'One Region • One Game • One Purpose',
    image_url:NORBERTO_SANCHEZ_POSTER,
    featured:true
  },
  {
    id:'featured-ronald-velasquez',
    poster_type:'commissioner',
    person_name:'Ronald Velasquez',
    position_title:'Municipal Commissioner',
    region_name:'Region III',
    area:'Capas, Tarlac',
    caption:'Leadership • Unity • Development',
    image_url:RONALD_VELASQUEZ_POSTER,
    featured:true
  },
  {
    id:'featured-enrique-simon-lim',
    poster_type:'commissioner',
    person_name:'Enrique Simon Lim',
    position_title:'Regional Commissioner',
    region_name:'Region III',
    area:'San Fernando, Pampanga',
    caption:'Together, We Roll the Ball',
    image_url:ENRIQUE_SIMON_LIM_POSTER,
    featured:true
  },
  {
    id:'featured-arturo-caliwag',
    poster_type:'commissioner',
    person_name:'Arturo Caliwag',
    position_title:'Municipal Commissioner',
    region_name:'Region III',
    area:'San Fernando, Pampanga',
    caption:'Leadership • Unity • Development Through Sports Officiating',
    image_url:ARTURO_CALIWAG_POSTER,
    featured:true
  },
  {
    id:'featured-arturo-rojas',
    poster_type:'director',
    person_name:'Arturo Rojas Jr.',
    position_title:'Regional Director',
    region_name:'Region VIII',
    area:'Western Samar',
    caption:'Together, We Raise the Standard',
    image_url:ARTURO_ROJAS_POSTER,
    featured:true
  },
  {
    id:'featured-chester-rota',
    poster_type:'commissioner',
    person_name:'Chester Bill Raquel Rota',
    position_title:'Regional Commissioner',
    region_name:'Region VIII',
    area:'Region VIII',
    caption:'Together, We Make a Better Game',
    image_url:CHESTER_ROTA_POSTER,
    featured:true
  }
];

function FeaturedPosterStrip({limit=7}){
 const posters=FEATURED_LEADERSHIP_POSTERS.slice(0,limit);
 return <div className="featured-poster-strip">
   {posters.map((p,i)=><Link className={`featured-poster-tile featured-poster-${i+1}`} key={p.id} to="/posters">
     <img src={p.image_url} alt={`${p.person_name} — ${p.position_title}`}/>
     <div className="featured-poster-overlay">
       <span>{p.region_name}</span>
       <b>{p.person_name}</b>
       <small>{p.position_title}</small>
     </div>
   </Link>)}
 </div>;
}

function LeadershipSpotlight(){
 return <section className="leadership-spotlight page">
   <div className="website-section-heading spotlight-heading">
     <div>
       <span className="eyebrow">Leadership Across the Philippines</span>
       <h2>Officials Who Lead, Serve, and Strengthen the Game</h2>
       <p>Meet selected commissioners and directors representing the organization across different regions and local communities.</p>
     </div>
     <Link className="btn" to="/posters">View Leadership Posters</Link>
   </div>
   <FeaturedPosterStrip/>
 </section>;
}

function Home(){return <main className="website-home v636-home">
 <section className="v636-hero">
   <div className="v636-hero-inner page">
     <div className="v636-hero-copy">
       <span className="eyebrow">Basketball Association of the Philippines Technical Officials Inc.</span>
       <h1>One National Community.<br/><span>One Standard of Officiating.</span></h1>
       <p>The official digital home for membership, accreditation, leadership, National ID, certificates, public member verification, and technical officials across the Philippines.</p>
       <div className="v636-hero-actions">
         <Link className="btn btn-gold" to="/register">Apply for Membership</Link>
         <Link className="btn v636-outline-btn" to="/lookup">Verify National ID</Link>
         <Link className="btn v636-outline-btn" to="/membership-directory">Membership Directory</Link>
       </div>
       <div className="v636-hero-points">
         <span><b>✓</b> QR-Verified Profiles</span>
         <span><b>✓</b> Digital Membership ID</span>
         <span><b>✓</b> National Leadership Directory</span>
       </div>
     </div>
     <div className="v636-hero-visual">
       <div className="v636-logo-glow"><img src={BAP_LOGO} alt="BAP Technical Officials logo"/></div>
       <div className="v636-hero-card v636-card-1"><small>OFFICIAL SYSTEM</small><b>National Membership</b></div>
       <div className="v636-hero-card v636-card-2"><small>PUBLIC ACCESS</small><b>Scan • Verify • Confirm</b></div>
     </div>
   </div>
 </section>

 <section className="v636-quick-links page">
   <Link to="/membership"><span>01</span><div><b>Membership</b><small>Fees, application, ID & certificate</small></div></Link>
   <Link to="/organization"><span>02</span><div><b>Leadership</b><small>National and regional officials</small></div></Link>
   <Link to="/membership-directory"><span>03</span><div><b>Directory</b><small>Search active members by name or region</small></div></Link>
   <Link to="/posters"><span>04</span><div><b>Official Posters</b><small>Commissioners and directors</small></div></Link>
 </section>

 <section className="v636-story page">
   <div className="v636-story-copy">
     <span className="eyebrow">Built for Technical Officials</span>
     <h2>Professional. Organized. Verifiable.</h2>
     <p>Our national platform combines public information and secure membership administration so officials can be identified, verified, and connected through one official system.</p>
     <div className="v636-values">
       <span><b>Discipline</b><small>Professional conduct</small></span>
       <span><b>Integrity</b><small>Fairness and accountability</small></span>
       <span><b>Unity</b><small>Stronger together</small></span>
       <span><b>Development</b><small>Better officials, better game</small></span>
     </div>
     <Link className="btn" to="/about">Learn More About Us</Link>
   </div>
   <div className="v636-story-posters">
     <img src={PAUL_SABATE_POSTER} alt="Regional leadership poster"/>
     <img src={ARTURO_ROJAS_POSTER} alt="Regional director poster"/>
     <img src={CHESTER_ROTA_POSTER} alt="Regional commissioner poster"/>
   </div>
 </section>

 <LeadershipSpotlight/>
 <ExecutiveDashboard compact/>

 <section className="v636-membership-banner page">
   <div><span className="eyebrow">National Membership</span><h2>Ready to become part of the official membership system?</h2><p>Apply online, submit your photo and signature, complete processing, and receive your QR-linked digital membership record.</p></div>
   <div><Link className="btn btn-gold" to="/register">Start Application</Link><Link className="btn" to="/blank-membership-form">Blank Form</Link></div>
 </section>
</main>}
function AboutWebsite(){
 return <main className="website-page about-premium-page">
   <section className="website-page-hero about-premium-hero">
     <div>
       <span className="eyebrow">About the Organization</span>
       <h1>United by the Game. Guided by Discipline, Integrity, and Service.</h1>
       <p>Basketball Association of the Philippines Technical Officials Inc. is building a connected national platform for basketball technical officials through organized membership, leadership visibility, accreditation, licensing, development, and public verification.</p>
       <div className="about-hero-actions"><Link className="btn btn-gold" to="/register">Join the Membership</Link><Link className="btn" to="/organization">View National Leadership</Link></div>
     </div>
     <div className="about-hero-collage">
       <img src={NORBERTO_SANCHEZ_POSTER} alt="Region V leadership poster"/>
       <img src={ARTURO_ROJAS_POSTER} alt="Region VIII director poster"/>
     </div>
   </section>

   <section className="about-who-we-are">
     <div className="about-who-copy">
       <span className="eyebrow">Who We Are</span>
       <h2>A National Community for Basketball Technical Officials</h2>
       <p>We provide one digital home where officials can connect to the national membership system, access their membership records, verify official profiles, view organizational leadership, and follow commissioner and director announcements.</p>
       <p>The platform supports clear administration while giving members and the public easier access to official information.</p>
     </div>
     <div className="about-statements">
       <article><b>Our Purpose</b><p>To support organized, professional, and accessible basketball officiating through one national digital platform.</p></article>
       <article><b>Our Commitment</b><p>To strengthen transparency, membership verification, leadership visibility, and development across regions.</p></article>
       <article><b>Our Community</b><p>Officials, commissioners, directors, and members working together for a stronger basketball environment.</p></article>
     </div>
   </section>

   <section className="about-values-section">
     <div className="website-section-heading">
       <span className="eyebrow">What We Stand For</span>
       <h2>Values That Strengthen the Game</h2>
     </div>
     <div className="about-value-grid">
       <article><span>01</span><h3>Discipline</h3><p>Prepared, responsible, and professional in every assignment.</p></article>
       <article><span>02</span><h3>Integrity</h3><p>Fair, accountable, and committed to doing what is right.</p></article>
       <article><span>03</span><h3>Fair Play</h3><p>Respect for the rules, the participants, and the spirit of basketball.</p></article>
       <article><span>04</span><h3>Unity</h3><p>One community working across cities, provinces, and regions.</p></article>
       <article><span>05</span><h3>Leadership</h3><p>Officials who guide, mentor, serve, and set the standard.</p></article>
       <article><span>06</span><h3>Development</h3><p>Continuous growth toward better officials and better games.</p></article>
     </div>
   </section>

   <section className="about-leadership-showcase">
     <div className="website-section-heading spotlight-heading">
       <div><span className="eyebrow">Leadership in Action</span><h2>Representing Communities Across the Philippines</h2><p>Our website can feature high-impact commissioner and director posters like these throughout the public leadership gallery.</p></div>
       <Link className="btn" to="/posters">Open Poster Gallery</Link>
     </div>
     <FeaturedPosterStrip/>
   </section>

   <section className="website-content-grid about-platform-grid">
     <article><span>01</span><h2>National Membership</h2><p>The system maintains official membership records, Membership IDs, Control Numbers, status, validity, and renewals in one national database.</p></article>
     <article><span>02</span><h2>Accreditation & Licensing</h2><p>Membership services are supported by organized accreditation and licensing workflows for authorized administrators.</p></article>
     <article><span>03</span><h2>Digital Verification</h2><p>Active members can use QR-linked public profiles for fast verification through a phone camera or the Verify ID page.</p></article>
     <article><span>04</span><h2>Leadership Visibility</h2><p>The website publishes national officers, organizational structures, and commissioner/director posters across regions and local chapters.</p></article>
   </section>

   <section className="website-info-panel">
     <div><small>Office Location</small><b>Quezon City, Metro Manila 1103</b></div>
     <div><small>Company Registration No.</small><b>2026090266655-01</b></div>
     <div><small>Platform</small><b>National Membership • Accreditation • Licensing</b></div>
   </section>
 </main>;
}
function MembershipWebsite(){
 return <main className="website-page">
   <section className="website-page-hero membership-info-hero">
     <div><span className="eyebrow">Membership Information</span><h1>National Membership Application</h1><p>Apply online, submit your official membership information, complete payment processing, and receive your national membership record after activation.</p></div>
     <img src={BAP_LOGO} alt="BAP Technical Officials logo"/>
   </section>

   <section className="membership-fee-showcase">
     <div><small>National ID / Membership Fee</small><b>₱700.00</b></div>
     <div><small>Accreditation / Licensing Fee</small><b>₱100.00</b></div>
     <div className="membership-total"><small>Total</small><b>₱800.00</b></div>
   </section>

   <section className="website-process">
     <div className="website-section-heading"><span className="eyebrow">Application Process</span><h2>How Membership Works</h2></div>
     <div className="website-process-grid">
       <article><span>1</span><h3>Create Account</h3><p>Register using your email and access the member application portal.</p></article>
       <article><span>2</span><h3>Complete Application</h3><p>Provide your name, designation, region, chapter/city, photo, emergency details, and signature. You may draw your signature online.</p></article>
       <article><span>3</span><h3>Complete Payment</h3><p>Follow the payment instructions for the total membership and accreditation fee.</p></article>
       <article><span>4</span><h3>Membership Activation</h3><p>After authorized verification, your Membership ID, Control Number, issue date, and validity are generated.</p></article>
       <article><span>5</span><h3>Digital ID & Certificate</h3><p>Access the official National Membership ID and certificate from your member account.</p></article>
       <article><span>6</span><h3>QR Verification</h3><p>Your member QR links to the public profile used for official verification.</p></article>
     </div>
   </section>

   <section className="website-membership-cta compact-cta">
     <div><span className="eyebrow">Ready to Apply?</span><h2>Start your national membership application.</h2></div>
     <div className="website-cta-buttons"><Link className="btn btn-gold" to="/register">Apply Online</Link><Link className="btn" to="/blank-membership-form">Download Blank Form</Link></div>
   </section>
 </main>;
}

function PublicPosterGallery({compact=false}){
 const[posters,setPosters]=useState(undefined);
 const[filter,setFilter]=useState('all');
 const[error,setError]=useState('');

 useEffect(()=>{
   let alive=true;
   supabase.rpc('get_public_leadership_posters').then(({data,error})=>{
     if(!alive)return;
     if(error){
       setError(error.message||'Published posters are currently unavailable.');
       setPosters([]);
     }else{
       setPosters(Array.isArray(data)?data:[]);
     }
   });
   return()=>{alive=false;};
 },[]);

 const visible=useMemo(()=>{
   const databasePosters=Array.isArray(posters)?posters:[];
   const seen=new Set();
   const combined=[...databasePosters,...FEATURED_LEADERSHIP_POSTERS].filter(p=>{
     const key=String(p.image_url||p.id||'');
     if(!key||seen.has(key))return false;
     seen.add(key);
     return true;
   });
   const filtered=filter==='all'?combined:combined.filter(p=>p.poster_type===filter);
   return compact?filtered.slice(0,6):filtered;
 },[posters,filter,compact]);

 return <section className={compact?'website-poster-section page':'website-page website-poster-page'}>
   <div className="website-section-heading poster-heading-row">
     <div><span className="eyebrow">Official Announcements</span><h2>{compact?'Commissioners & Directors':'Commissioner & Director Posters'}</h2><p>Official poster gallery. Finished poster images uploaded by the National Master Admin are published here automatically.</p></div>
     {compact?<Link className="btn" to="/posters">View All Posters</Link>:<div className="poster-filter"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>All</button><button className={filter==='commissioner'?'active':''} onClick={()=>setFilter('commissioner')}>Commissioners</button><button className={filter==='director'?'active':''} onClick={()=>setFilter('director')}>Directors</button></div>}
   </div>
   {error&&<div className="poster-gallery-note"><b>Featured leadership posters are available.</b><span>Dynamic poster updates will also appear here when the public poster database is connected.</span></div>}
   {posters===undefined?<div className="dashboard-loading">Loading published posters...</div>:
     visible.length?<div className="website-poster-grid image-only-poster-gallery">{visible.map(p=><article key={p.id} className="website-poster-card image-only-poster-card">
       <a href={p.image_url} target="_blank" rel="noreferrer" aria-label="Open official poster">
         <img
           src={p.image_url}
           alt="Official BAP leadership poster"
           onError={e=>{
             e.currentTarget.style.display='none';
             const fallback=e.currentTarget.nextElementSibling;
             if(fallback)fallback.style.display='grid';
           }}
         />
         <div className="poster-image-fallback" style={{display:'none'}}>
           <img src={BAP_LOGO} alt="BAP logo"/>
           <b>Official Poster</b>
           <span>Image currently unavailable</span>
         </div>
       </a>
     </article>)}</div>:<div className="directory-empty"><h2>No published posters yet</h2><p>Active posters uploaded by the National Master Admin will appear here.</p></div>}
 </section>;
}

function ContactWebsite(){
 return <main className="website-page">
   <section className="website-page-hero contact-hero">
     <div><span className="eyebrow">Contact & Official Access</span><h1>Connect with BAP Technical Officials Inc.</h1><p>Use the official membership website for applications, member verification, leadership information, and national membership services.</p></div>
     <img src={BAP_LOGO} alt="BAP Technical Officials logo"/>
   </section>
   <section className="contact-website-grid">
     <article><small>Office</small><h2>Quezon City, Metro Manila 1103</h2><p>Official national membership and technical officials administration.</p></article>
     <article><small>Email</small><h2>bapnationalcom@gmail.com</h2><p>For official membership and national administration correspondence.</p><a className="btn" href="mailto:bapnationalcom@gmail.com">Send Email</a></article>
     <article><small>Member Services</small><h2>Online Membership Portal</h2><p>Apply, access your digital membership record, and verify official member profiles online.</p><Link className="btn btn-gold" to="/register">Apply for Membership</Link></article>
   </section>
 </main>;
}

function WebsiteFooter(){
 return <footer className="website-footer no-print">
   <div className="website-footer-inner">
     <div className="website-footer-brand"><img src={BAP_LOGO} alt="BAP logo"/><div><b>Basketball Association of the Philippines Technical Officials Inc.</b><span>National Membership • Accreditation • Licensing</span></div></div>
     <div className="website-footer-links"><Link to="/about">About</Link><Link to="/organization">Leadership</Link><Link to="/membership-directory">Directory</Link><Link to="/posters">Posters</Link><Link to="/membership">Membership</Link><Link to="/lookup">Verify ID</Link><Link to="/contact">Contact</Link></div>
     <div className="website-footer-meta"><span>Quezon City, Metro Manila 1103</span><span>Company Reg. No. 2026090266655-01</span></div>
   </div>
 </footer>;
}

function MembershipDirectory(){
 const[regions,setRegions]=useState([]);
 const[records,setRecords]=useState(undefined);
 const[nameSearch,setNameSearch]=useState('');
 const[regionFilter,setRegionFilter]=useState('');
 const[chapterFilter,setChapterFilter]=useState('');
 const[appliedSearch,setAppliedSearch]=useState('');
 const[appliedRegion,setAppliedRegion]=useState('');
 const[appliedChapter,setAppliedChapter]=useState('');
 const[loading,setLoading]=useState(false);
 const[error,setError]=useState('');

 async function loadDirectory(search='',region=''){
   setLoading(true);
   setError('');
   const{data,error}=await supabase.rpc('get_public_member_directory',{
     p_search:search.trim()||null,
     p_region_code:region||null,
     p_limit:500,
     p_offset:0
   });
   if(error){
     console.error(error);
     setError(error.message||'Could not load the membership directory.');
     setRecords([]);
   }else{
     setRecords(Array.isArray(data)?data:[]);
   }
   setLoading(false);
 }

 useEffect(()=>{
   let alive=true;
   async function initial(){
     const{data,error}=await supabase.from('regions').select('code,name,sort_order').order('sort_order');
     if(alive&&!error)setRegions(data||[]);
     if(alive)await loadDirectory('','');
   }
   initial();
   return()=>{alive=false;};
 },[]);

 function search(e){
   e.preventDefault();
   setAppliedSearch(nameSearch.trim());
   setAppliedRegion(regionFilter);
   setAppliedChapter(chapterFilter);
   loadDirectory(nameSearch,regionFilter);
 }

 function clearSearch(){
   setNameSearch('');
   setRegionFilter('');
   setChapterFilter('');
   setAppliedSearch('');
   setAppliedRegion('');
   setAppliedChapter('');
   loadDirectory('','');
 }

 const selectedRegion=regions.find(r=>r.code===appliedRegion);
 const chapterOptions=[...new Set((records||[]).map(m=>String(m.chapter||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 const visibleRecords=(records||[]).filter(member=>!appliedChapter||String(member.chapter||'').trim()===appliedChapter);
 const regionOrder=new Map(regions.map((r,index)=>[String(r.code||'').toUpperCase(),index]));
 const groupedRegions=Object.values(visibleRecords.reduce((acc,member)=>{
   const regionCode=String(member.region_code||'UNASSIGNED').trim()||'UNASSIGNED';
   const regionName=String(member.region_name||'Unassigned Region').trim()||'Unassigned Region';
   const regionKey=regionCode.toUpperCase();
   if(!acc[regionKey])acc[regionKey]={key:regionKey,code:regionCode,name:regionName,members:[],chapters:{}};
   acc[regionKey].members.push(member);
   const chapterName=String(member.chapter||'').trim()||'Unassigned Chapter';
   if(!acc[regionKey].chapters[chapterName])acc[regionKey].chapters[chapterName]=[];
   acc[regionKey].chapters[chapterName].push(member);
   return acc;
 },{})).sort((a,b)=>{
   const ai=regionOrder.has(a.key)?regionOrder.get(a.key):9999;
   const bi=regionOrder.has(b.key)?regionOrder.get(b.key):9999;
   return ai-bi||a.name.localeCompare(b.name);
 });

 function renderDirectoryMember(member){
   return <article className="directory-member-card" key={member.member_id}>
     <div className="directory-member-photo">
       {member.photo_url?<img src={member.photo_url} alt={`${member.full_name} membership photo`}/>:<span>{String(member.full_name||'?').slice(0,1)}</span>}
       <div className="directory-active-badge">ACTIVE</div>
     </div>
     <div className="directory-member-content">
       <small>OFFICIAL NATIONAL MEMBER</small>
       <h3>{member.full_name}</h3>
       <p>{member.position_name||member.designation||'Member'}</p>
       <div className="directory-member-details">
         <span><small>Region</small><b>{member.region_name||'—'}</b></span>
         <span><small>Chapter</small><b>{member.chapter||'—'}</b></span>
         <span><small>Membership ID</small><b>{member.member_id_number||'—'}</b></span>
         <span><small>Control Number</small><b>{member.control_number||'—'}</b></span>
         <span><small>Valid Until</small><b>{fmtDate(member.expires_at)}</b></span>
       </div>
       {(member.member_id_number||member.control_number)&&<div className="directory-member-qr">
         <div className="directory-member-qr-card"><QRCodeSVG value={memberQrValue(member)} size={118} includeMargin={true} level="H"/></div>
         <div className="directory-member-qr-meta"><b>SCAN QR • DIRECT TO OFFICIAL PROFILE</b><span>{member.member_id_number||member.control_number}</span></div>
       </div>}
       <Link className="btn directory-profile-btn" to={memberProfilePath(member)}>View Official Profile</Link>
     </div>
   </article>;
 }

 return <main className="membership-directory-page">
   <section className="directory-hero">
     <div>
       <span className="eyebrow">Official National Membership Registry</span>
       <h1>Membership Directory</h1>
       <p>Browse active BAP National Members organized by Region and Chapter, or search by member name, Membership ID Number, or Control Number.</p>
     </div>
     <img src={BAP_LOGO} alt="BAP logo"/>
   </section>

   <section className="directory-search-panel">
     <form className="directory-search-form" onSubmit={search}>
       <label className="directory-name-search">
         <span>Search Name / Membership ID / Control Number</span>
         <input
           value={nameSearch}
           onChange={e=>setNameSearch(e.target.value)}
           placeholder="Example: Juan, BAP-NCR-2026-000001, or BAP-NTO-NCR-2026-000001"
           autoComplete="off"
         />
       </label>

       <label>
         <span>Region</span>
         <select value={regionFilter} onChange={e=>{setRegionFilter(e.target.value);setChapterFilter('');}}>
           <option value="">All Regions</option>
           {regions.map(r=><option key={r.code} value={r.code}>{r.code} — {r.name}</option>)}
         </select>
       </label>

       <label>
         <span>Chapter</span>
         <select value={chapterFilter} onChange={e=>setChapterFilter(e.target.value)}>
           <option value="">All Chapters</option>
           {chapterOptions.map(chapter=><option key={chapter} value={chapter}>{chapter}</option>)}
         </select>
       </label>

       <div className="directory-search-actions">
         <button className="btn btn-gold" disabled={loading}>{loading?'Searching...':'Search Directory'}</button>
         <button type="button" className="btn" onClick={clearSearch} disabled={loading}>Clear</button>
       </div>
     </form>
   </section>

   <section className="directory-results-head">
     <div>
       <span className="eyebrow">Search Results</span>
       <h2>{records===undefined?'Loading Members...':`${visibleRecords.length} Member${visibleRecords.length===1?'':'s'} Found`}</h2>
       {(appliedSearch||appliedRegion||appliedChapter)&&<p>
         {appliedSearch&&<>Search: <b>“{appliedSearch}”</b></>}
         {appliedSearch&&appliedRegion?' • ':''}
         {appliedRegion&&<>Region: <b>{selectedRegion?.name||appliedRegion}</b></>}
         {(appliedSearch||appliedRegion)&&appliedChapter?' • ':''}
         {appliedChapter&&<>Chapter: <b>{appliedChapter}</b></>}
       </p>}
     </div>
     <Link className="btn" to="/lookup">Verify an ID</Link>
   </section>

   {error&&<div className="dashboard-public-error">{error}</div>}
   {records===undefined||loading?<div className="dashboard-loading">Loading official membership directory...</div>:
    visibleRecords.length?<section className="directory-grouped-list">
      <nav className="directory-region-index" aria-label="Directory regions">
        {groupedRegions.map(region=><a key={region.key} href={`#directory-region-${slugify(region.code)}`}><b>{region.code}</b><span>{region.name}</span><small>{region.members.length} member{region.members.length===1?'':'s'}</small></a>)}
      </nav>
      {groupedRegions.map(region=><section className="directory-region-section" id={`directory-region-${slugify(region.code)}`} key={region.key}>
        <header className="directory-region-heading">
          <div><span className="directory-section-code">{region.code}</span><div><small>REGION</small><h2>{region.name}</h2></div></div>
          <strong>{region.members.length} Active Member{region.members.length===1?'':'s'}</strong>
        </header>
        <div className="directory-chapter-stack">
          {Object.entries(region.chapters).sort(([a],[b])=>a.localeCompare(b)).map(([chapter,members])=><section className="directory-chapter-section" key={`${region.key}-${chapter}`}>
            <header className="directory-chapter-heading">
              <div><span>CHAPTER</span><h3>{chapter}</h3></div>
              <b>{members.length} Member{members.length===1?'':'s'}</b>
            </header>
            <div className="membership-directory-grid">{members.sort((a,b)=>String(a.full_name||'').localeCompare(String(b.full_name||''))).map(renderDirectoryMember)}</div>
          </section>)}
        </div>
      </section>)}
    </section>:
    <section className="directory-empty">
      <div>⌕</div>
      <h2>No Active Member Found</h2>
      <p>Try a different name, Membership ID Number, Control Number, Region, or Chapter.</p>
      <button type="button" className="btn" onClick={clearSearch}>Show All Active Members</button>
    </section>}
   {records?.length===500&&<section className="directory-limit-note">
     <b>Showing the first 500 matching members.</b>
     <span>Use the Name / Membership ID / Control Number search, Region filter, or Chapter filter to narrow the directory.</span>
   </section>}

   <section className="public-profile-privacy directory-privacy">
     <b>Public Directory Privacy</b>
     <span>The directory shows active official membership information only. Mobile numbers, email addresses, emergency contacts, payment information, signatures, and other private administrative data are not displayed.</span>
   </section>
 </main>;
}


function BlankMembershipForm(){
 function blankPdfBlob(){
   const binary=window.atob(BLANK_MEMBERSHIP_PDF_BASE64);
   const bytes=new Uint8Array(binary.length);
   for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   return new Blob([bytes],{type:'application/pdf'});
 }

 function downloadBlankPdf(){
   try{
     const blob=blankPdfBlob();
     const url=URL.createObjectURL(blob);
     const a=document.createElement('a');
     a.href=url;
     a.download='BAP_Blank_Membership_Form.pdf';
     document.body.appendChild(a);
     a.click();
     a.remove();
     setTimeout(()=>URL.revokeObjectURL(url),1500);
   }catch(error){
     alert('Could not download the blank membership form. Please try again.');
   }
 }

 function openBlankPdf(){
   try{
     const blob=blankPdfBlob();
     const url=URL.createObjectURL(blob);
     const win=window.open(url,'_blank','noopener,noreferrer');
     if(!win){
       URL.revokeObjectURL(url);
       alert('Your browser blocked the PDF window. Please allow pop-ups or use Download PDF.');
       return;
     }
     setTimeout(()=>URL.revokeObjectURL(url),60000);
   }catch(error){
     alert('Could not open the PDF. Please use Download PDF instead.');
   }
 }

 function printBlankForm(){
   const form=document.querySelector('.blank-membership-sheet');
   if(!form)return window.print();

   const printWindow=window.open('','_blank','width=900,height=1100');
   if(!printWindow){
     alert('Your browser blocked the print window. Please allow pop-ups and try again.');
     return;
   }

   const styles=Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'))
     .map(node=>node.outerHTML)
     .join('\n');

   printWindow.document.open();
   printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>BAP Blank Membership Form</title>
${styles}
<style>
html,body{background:#fff!important;margin:0!important;padding:0!important}
.blank-membership-sheet{width:210mm!important;min-height:297mm!important;margin:0 auto!important;border:none!important;box-shadow:none!important;box-sizing:border-box!important}
@page{size:A4 portrait;margin:0}
</style>
</head>
<body>${form.outerHTML}</body>
</html>`);
   printWindow.document.close();
   printWindow.focus();
   setTimeout(()=>{
     printWindow.print();
   },700);
 }

 return <main className="blank-form-page">
   <section className="blank-form-hero no-print">
     <div>
       <span className="eyebrow">Downloadable Membership Form</span>
       <h1>Blank National Membership Application Form</h1>
       <p>For applicants who prefer to complete the membership form manually. Download, open, or print the official blank A4 membership form directly from this module.</p>
     </div>
     <img src={BAP_LOGO} alt="BAP logo"/>
   </section>

   <section className="blank-form-actions no-print">
     <button className="btn btn-gold" type="button" onClick={downloadBlankPdf}>Download Blank Form PDF</button>
     <button className="btn" type="button" onClick={openBlankPdf}>Open PDF</button>
     <button className="btn" type="button" onClick={printBlankForm}>Print Blank Form</button>
     <Link className="btn" to="/register">Apply Online Instead</Link>
   </section>

   <section className="blank-form-fix-note no-print">
     <b>V6.18 Embedded PDF</b>
     <span>The blank form PDF is built into the website package. Download and Open PDF no longer depend on a public file URL.</span>
   </section>

   <section className="blank-membership-sheet">
     <header className="blank-membership-head">
       <img src={BAP_LOGO} alt="BAP logo"/>
       <div>
         <div className="application-org">BASKETBALL ASSOCIATION OF THE PHILIPPINES</div>
         <h1>NATIONAL MEMBERSHIP APPLICATION FORM</h1>
         <p>Official Membership • Accreditation • Licensing</p>
       </div>
       <div className="blank-form-code"><small>FORM CODE / OFFICE USE</small><b>__________________</b></div>
     </header>

     <h3 className="application-section-title">Personal & Membership Information</h3>
     <div className="blank-profile-row">
       <div className="blank-photo-box"><b>2 × 2</b><span>PHOTO</span></div>
       <div className="blank-field-grid">
         <BlankLine label="Full Name" wide/>
         <BlankLine label="Position / Designation"/>
         <BlankLine label="Region"/>
         <BlankLine label="Chapter"/>
         <BlankLine label="Mobile Number"/>
         <BlankLine label="Email Address" wide/>
       </div>
     </div>

     <h3 className="application-section-title">In Case of Emergency</h3>
     <div className="blank-field-grid two">
       <BlankLine label="Emergency Contact Name"/>
       <BlankLine label="Relationship"/>
       <BlankLine label="Emergency Mobile"/>
       <BlankLine label="Emergency Email"/>
     </div>

     <h3 className="application-section-title">Membership Fees</h3>
     <div className="blank-fee-grid">
       <div><small>National ID / Membership Fee</small><b>₱700.00</b></div>
       <div><small>Accreditation / Licensing Fee</small><b>₱100.00</b></div>
       <div className="blank-fee-total"><small>Total</small><b>₱800.00</b></div>
     </div>

     <h3 className="application-section-title">Applicant Declaration</h3>
     <p className="blank-declaration">I certify that the information I provided in this application is true and correct. I authorize BAP National Membership administrators to use the information for official membership, accreditation, licensing, verification, ID, certificate and database purposes.</p>

     <div className="blank-signature-row">
       <div><span className="blank-sign-line"/><b>Applicant Signature</b></div>
       <div><span className="blank-sign-line"/><b>Date</b></div>
     </div>

     <h3 className="application-section-title">For Office Use Only</h3>
     <div className="blank-field-grid three">
       <BlankLine label="Received By"/>
       <BlankLine label="Date Received"/>
       <BlankLine label="Payment Reference"/>
     </div>

     <footer className="blank-membership-footer">
       <span>BAP National Membership System</span>
       <span>Blank Membership Application Form • A4</span>
     </footer>
   </section>
 </main>;
}
function BlankLine({label,wide=false}){
 return <div className={`blank-line-field ${wide?'wide':''}`}><small>{label}</small><span/></div>;
}

function ExecutiveDashboard({compact=false}){
 const[stats,setStats]=useState(undefined);
 const[regions,setRegions]=useState([]);
 const[error,setError]=useState('');

 useEffect(()=>{
   let alive=true;
   async function load(){
     const[s,r]=await Promise.all([
       supabase.rpc('get_public_executive_dashboard'),
       supabase.rpc('get_public_region_stats')
     ]);
     if(!alive)return;
     if(s.error){
       setError(s.error.message||'Executive dashboard is unavailable.');
       setStats(null);
       return;
     }
     const row=Array.isArray(s.data)?s.data[0]:null;
     setStats(row||null);
     if(!r.error)setRegions(Array.isArray(r.data)?r.data:[]);
   }
   load();
   return()=>{alive=false;};
 },[]);

 const metrics=stats?[
   {label:'Total Members',value:stats.total_members||0,detail:'Official membership records'},
   {label:'Active Members',value:stats.active_members||0,detail:'Active and within validity'},
   {label:'New Members',value:stats.new_members||0,detail:'First issuance in the last 30 days'},
   {label:'Renewed Members',value:stats.renewed_members||0,detail:'Members with at least one renewal'},
   {label:'Renewal Due',value:stats.renewal_due||0,detail:'Active memberships expiring in 60 days'},
   {label:'Inactive Members',value:stats.inactive_members||0,detail:'Expired, suspended or inactive'}
 ]:[];

 if(compact){
   return <section className="executive-snapshot page">
     <div className="executive-section-heading">
       <div><span className="eyebrow">Public Executive Dashboard</span><h2>National Membership at a Glance</h2><p>Live aggregate figures from the official national membership registry.</p></div>
       <div className="executive-heading-actions"><Link className="btn" to="/executive-dashboard">View Full Dashboard</Link><Link className="btn btn-gold" to="/organization">View Organization</Link></div>
     </div>
     {stats===undefined?<div className="dashboard-loading">Loading national membership statistics...</div>:
      error?<div className="dashboard-public-error">{error}</div>:
      <div className="executive-metrics compact">{metrics.slice(0,5).map(m=><article key={m.label}><small>{m.label}</small><strong>{Number(m.value).toLocaleString()}</strong><span>{m.detail}</span></article>)}</div>}
   </section>;
 }

 return <main className="executive-dashboard-page">
   <section className="executive-dashboard-hero">
     <div><span className="eyebrow">Public Executive Dashboard</span><h1>National Membership Executive Dashboard</h1><p>Live nationwide membership statistics for transparency, planning and organizational visibility.</p></div>
     <img src={BAP_LOGO} alt="BAP logo"/>
   </section>

   {stats===undefined?<div className="dashboard-loading">Loading executive dashboard...</div>:
    error?<div className="dashboard-public-error">{error}</div>:
    <>
      <section className="executive-metrics">{metrics.map(m=><article key={m.label}><small>{m.label}</small><strong>{Number(m.value).toLocaleString()}</strong><span>{m.detail}</span></article>)}</section>

      <section className="executive-panel">
        <div className="executive-section-heading">
          <div><span className="eyebrow">Regional Performance</span><h2>Membership by Region</h2><p>Official member totals and current active membership across all regions.</p></div>
          <Link className="btn" to="/organization">Open Organizational Chart</Link>
        </div>

        <div className="executive-region-grid">
          {regions.map(r=>{
            const total=Number(r.total_members||0);
            const active=Number(r.active_members||0);
            const pct=total?Math.round((active/total)*100):0;
            return <article className="executive-region-card" key={r.region_code}>
              <div className="executive-region-title"><div><b>{r.region_code}</b><span>{r.region_name}</span></div><strong>{active}/{total}</strong></div>
              <div className="executive-progress"><span style={{width:`${Math.min(100,pct)}%`}}/></div>
              <div className="executive-region-meta">
                <span><small>Active</small><b>{active}</b></span>
                <span><small>New</small><b>{Number(r.new_members||0)}</b></span>
                <span><small>Renewed</small><b>{Number(r.renewed_members||0)}</b></span>
                <span><small>Inactive</small><b>{Number(r.inactive_members||0)}</b></span>
              </div>
            </article>;
          })}
        </div>
      </section>

      <section className="dashboard-definition-note">
        <b>Dashboard definitions</b>
        <span>New Members = first membership issuance within the last 30 days. Renewed Members = members with at least one recorded renewal. Renewal Due = active memberships expiring within the next 60 days. Inactive includes expired or non-active official memberships.</span>
      </section>
    </>}
 </main>;
}

function OrgPerson({person}){
 return <article className="org-person-card">
   <div className="org-photo">{person.photo_url?<img src={person.photo_url} alt={`${person.full_name} profile`}/>:<span>{String(person.full_name||'?').slice(0,1)}</span>}</div>
   <div className="org-person-info">
     <small>{person.position_name}</small>
     <b>{person.full_name}</b>
     <span>{person.chapter||person.region_name||'National'}</span>
     {person.member_id_number&&<Link to={`/profile/${encodeURIComponent(person.member_id_number)}`}>View Membership Profile</Link>}
   </div>
 </article>;
}

function orgPositionKey(name){
 const n=String(name||'').trim().toLowerCase();
 if(n==='president'||n==='national president')return'president';
 if(n==='vice president'||n==='national vice president')return'vice_president';
 if(n==='national commissioner')return'national_commissioner';
 if(n==='secretary general'||n==='secretary-general')return'secretary_general';
 if(n.includes('city commissioner')||n.includes('deputy city commissioner'))return'city_commissioner';
 if(n.includes('regional'))return'regional';
 if(n.includes('provincial'))return'provincial';
 if(n.includes('municipal'))return'municipal';
 return'other';
}

function orgRank(person){
 const key=orgPositionKey(person?.position_name);
 return {
   president:10,
   vice_president:20,
   national_commissioner:30,
   secretary_general:40,
   regional:50,
   city_commissioner:55,
   provincial:60,
   municipal:70,
   other:999
 }[key]||999;
}

function OrganizationChart(){
 const[people,setPeople]=useState(undefined);
 const[regions,setRegions]=useState([]);
 const[selectedRegion,setSelectedRegion]=useState('');
 const[error,setError]=useState('');

 useEffect(()=>{
   let alive=true;
   async function load(){
     const[o,r]=await Promise.all([
       supabase.rpc('get_public_organization'),
       supabase.rpc('get_public_region_stats')
     ]);
     if(!alive)return;
     if(o.error){
       setError(o.error.message||'Organizational chart is unavailable.');
       setPeople([]);
       return;
     }
     const org=Array.isArray(o.data)?o.data:[];
     const reg=Array.isArray(r.data)?r.data:[];
     setPeople(org);
     setRegions(reg);
     if(reg.length)setSelectedRegion(reg[0].region_code);
   }
   load();
   return()=>{alive=false;};
 },[]);

 const national=useMemo(()=>{
   if(!Array.isArray(people))return[];
   return people
     .filter(p=>['president','vice_president','national_commissioner','secretary_general'].includes(orgPositionKey(p.position_name)))
     .sort((a,b)=>orgRank(a)-orgRank(b)||(a.position_order||999)-(b.position_order||999)||String(a.full_name).localeCompare(String(b.full_name)));
 },[people]);

 const regionalPeople=useMemo(()=>{
   if(!Array.isArray(people))return[];
   return people
     .filter(p=>p.region_code===selectedRegion&&['regional','city_commissioner','provincial','municipal'].includes(orgPositionKey(p.position_name)))
     .sort((a,b)=>orgRank(a)-orgRank(b)||(a.position_order||999)-(b.position_order||999)||String(a.full_name).localeCompare(String(b.full_name)));
 },[people,selectedRegion]);

 const selectedRegionRow=regions.find(r=>r.region_code===selectedRegion);

 const isNcrRegion=useMemo(()=>{
   const code=String(selectedRegionRow?.region_code||selectedRegion||'').trim().toLowerCase();
   const name=String(selectedRegionRow?.region_name||'').trim().toLowerCase();
   return code==='ncr'||name.includes('national capital region')||name.includes('metro manila');
 },[selectedRegionRow,selectedRegion]);

 const regionalLevels=useMemo(()=>{
   const levels=isNcrRegion?[
     {key:'city_commissioner',label:'City Commissioner',people:[]}
   ]:[
     {key:'regional',label:'Regional Leadership',people:[]},
     {key:'provincial',label:'Provincial Leadership',people:[]},
     {key:'municipal',label:'Municipal Leadership',people:[]}
   ];
   for(const p of regionalPeople){
     const level=levels.find(x=>x.key===orgPositionKey(p.position_name));
     if(level)level.people.push(p);
   }
   return levels;
 },[regionalPeople,isNcrRegion]);

 if(people===undefined)return <main className="page"><div className="dashboard-loading">Loading organizational chart...</div></main>;

 return <main className="organization-page">
   <section className="organization-hero">
     <div><span className="eyebrow">Official Organizational Directory</span><h1>National Officers & Regional Organizational Chart</h1><p>Official hierarchy: National President → National Vice President → National Commissioner, plus the published regional leadership structure per region.</p></div>
     <img src={BAP_LOGO} alt="BAP logo"/>
   </section>

   {error&&<div className="dashboard-public-error">{error}</div>}

   <section className="org-national-section">
     <div className="executive-section-heading">
       <div><span className="eyebrow">National Structure</span><h2>National Leadership</h2><p>The three official national officers are displayed below in the requested order: National President, National Vice President, and National Commissioner.</p></div>
     </div>

     <div className="org-hierarchy org-hierarchy-official">
       {[
         {key:'president',label:'National President'},
         {key:'vice_president',label:'National Vice President'},
         {key:'national_commissioner',label:'National Commissioner'}
       ].map((level,i)=>{
         const members=national.filter(p=>orgPositionKey(p.position_name)===level.key);
         return <React.Fragment key={level.key}>
           <div className="org-official-level">
             <div className="org-official-title">{level.label}</div>
             {members.length?<div className="org-official-people">{members.map((p,j)=><OrgPerson key={`${p.member_id_number||p.full_name}-${j}`} person={p}/>)}</div>:<div className="org-vacant">Position not yet assigned</div>}
           </div>
           {i<2&&<div className="org-connector official">↓</div>}
         </React.Fragment>;
       })}
     </div>
   </section>

   <section className="org-regional-section">
     <div className="org-region-toolbar">
       <div>
         <span className="eyebrow">Regional Structure</span>
         <h2>{isNcrRegion?'NCR City Commissioner Organizational Chart':'Regional → Provincial → Municipal'}</h2>
         <p>{isNcrRegion?'For NCR, the organizational chart shows the City Commissioner level.':'Select a region to view its official hierarchy below the national leadership.'}</p>
       </div>
       <label>Region<select value={selectedRegion} onChange={e=>setSelectedRegion(e.target.value)}>{regions.map(r=><option key={r.region_code} value={r.region_code}>{r.region_code} — {r.region_name}</option>)}</select></label>
     </div>

     <div className="org-region-banner">
       <div><small>Selected Region</small><b>{selectedRegionRow?.region_name||selectedRegion||'—'}</b></div>
       <div><small>Official Members</small><b>{Number(selectedRegionRow?.total_members||0).toLocaleString()}</b></div>
       <div><small>Active Members</small><b>{Number(selectedRegionRow?.active_members||0).toLocaleString()}</b></div>
       <div><small>Published Leaders</small><b>{regionalPeople.length}</b></div>
     </div>

     <div className="org-hierarchy org-regional-hierarchy">
       {regionalLevels.map((level,i)=><React.Fragment key={level.key}>
         <div className="org-official-level">
           <div className="org-official-title">{level.label}</div>
           {level.people.length?<div className="org-official-people">{level.people.map((p,j)=><OrgPerson key={`${p.member_id_number||p.full_name}-${j}`} person={p}/>)}</div>:<div className="org-vacant">No active {level.label.toLowerCase()} record for this region</div>}
         </div>
         {i<regionalLevels.length-1&&<div className="org-connector official">↓</div>}
       </React.Fragment>)}
     </div>
   </section>

   <section className="org-all-regions">
     <div className="executive-section-heading"><div><span className="eyebrow">National Coverage</span><h2>All Regions</h2><p>Select any region below to open its official organizational hierarchy. NCR will display the City Commissioner structure.</p></div></div>
     <div className="org-region-index">{regions.map(r=><button type="button" key={r.region_code} onClick={()=>{setSelectedRegion(r.region_code);window.scrollTo({top:document.querySelector('.org-regional-section')?.offsetTop||0,behavior:'smooth'});}}><b>{r.region_code}</b><span>{r.region_name}</span><small>{Number(r.active_members||0)} active members</small></button>)}</div>
   </section>

   <section className="public-profile-privacy">
     <b>Public organizational information</b>
     <span>Only active official leadership assignments and public membership information are shown. Personal contact and emergency information remain private.</span>
   </section>
 </main>;
}

function Login(){const nav=useNavigate();const[error,setError]=useState('');const[busy,setBusy]=useState(false);async function submit(e){e.preventDefault();setBusy(true);setError('');const f=new FormData(e.currentTarget);const{error}=await supabase.auth.signInWithPassword({email:String(f.get('email')),password:String(f.get('password'))});setBusy(false);if(error)return setError(error.message==='Failed to fetch'?'The membership system is temporarily unable to connect to the database. Please try again shortly.':error.message);nav('/dashboard');}return <main className="narrow page"><Title eyebrow="Secure Access" title="Login"/><form className="form-card" onSubmit={submit}><label>Email<input name="email" type="email" required/></label><label>Password<input name="password" type="password" required/></label>{error&&<p className="error">{error}</p>}<button className="btn btn-gold" disabled={busy}>{busy?'Signing in...':'Sign In'}</button></form><p className="center">No account? <Link to="/register">Apply for membership</Link>.</p></main>}

function MasterLogin({session}){
 const nav=useNavigate();
 const[error,setError]=useState('');
 const[busy,setBusy]=useState(false);
 const[checking,setChecking]=useState(false);

 useEffect(()=>{
   if(!session)return;
   setChecking(true);
   supabase.from('profiles').select('role').eq('id',session.user.id).single().then(({data,error})=>{
     setChecking(false);
     if(!error&&data?.role==='national_admin')nav('/master-access',{replace:true});
   });
 },[session]);

 async function submit(e){
   e.preventDefault();
   setBusy(true);
   setError('');
   const f=new FormData(e.currentTarget);
   const email=String(f.get('email')||'').trim();
   const password=String(f.get('password')||'');

   const{data,error}=await supabase.auth.signInWithPassword({email,password});
   if(error){
     setBusy(false);
     return setError(error.message==='Failed to fetch'?'The membership system is temporarily unable to connect to the database. Please try again shortly.':error.message);
   }

   const user=data?.user;
   if(!user){
     await supabase.auth.signOut();
     setBusy(false);
     return setError('Unable to verify the Master account.');
   }

   const{data:profile,error:profileError}=await supabase
     .from('profiles')
     .select('role')
     .eq('id',user.id)
     .single();

   if(profileError||profile?.role!=='national_admin'){
     await supabase.auth.signOut();
     setBusy(false);
     return setError('Access denied. This account is not authorized as the National Master Administrator.');
   }

   setBusy(false);
   nav('/master-access',{replace:true});
 }

 return <main className="master-login-page">
   <section className="master-login-card">
     <div className="master-login-brand">
       <img src={BAP_LOGO} alt="BAP logo"/>
       <span className="master-badge">MASTER ACCESS</span>
       <h1>National Administrator Login</h1>
       <p>Restricted access for the authorized National Master Administrator. All access is still protected by Supabase Authentication and National Admin role verification.</p>
     </div>
     <form className="master-login-form" onSubmit={submit}>
       <label>Master Admin Email<input name="email" type="email" autoComplete="username" required/></label>
       <label>Password<input name="password" type="password" autoComplete="current-password" required/></label>
       {error&&<p className="error">{error}</p>}
       {checking&&<p className="notice">Checking Master Access...</p>}
       <button className="btn btn-gold master-login-button" disabled={busy}>{busy?'Verifying Master Access...':'Enter Master Access'}</button>
     </form>
     <div className="master-security-note">
       <b>Secure Master Login</b>
       <span>No default or hard-coded Master password is stored in the website. The Master account must exist in Supabase Auth and have the <code>national_admin</code> role.</span>
     </div>
     <Link className="master-back-link" to="/connection-test">Test Supabase Connection</Link><Link className="master-back-link" to="/login">← Return to regular login</Link>
   </section>
 </main>
}

function Register(){
 const nav=useNavigate();
 const[error,setError]=useState('');
 const[busy,setBusy]=useState(false);

 async function submit(e){
   e.preventDefault();
   setBusy(true);
   setError('');

   const f=new FormData(e.currentTarget);
   const full_name=String(f.get('full_name')||'').trim();
   const email=String(f.get('email')||'').trim();
   const password=String(f.get('password')||'');

   try{
     const{data,error}=await supabase.auth.signUp({
       email,
       password,
       options:{data:{full_name}}
     });
     if(error)throw error;

     // With Supabase "Confirm email" disabled, signUp returns a session
     // and the member moves immediately to Step 2.
     if(data?.session){
       nav('/member',{replace:true});
       return;
     }

     // Fallback: try an immediate sign-in. This succeeds when confirmation
     // is disabled but the SDK did not return a session for any reason.
     const{data:loginData,error:loginError}=await supabase.auth.signInWithPassword({
       email,
       password
     });

     if(loginError||!loginData?.session){
       throw new Error(
         'Automatic Step 2 is blocked because email confirmation is still enabled in Supabase. Turn OFF Authentication → Providers → Email → Confirm email, then try again.'
       );
     }

     nav('/member',{replace:true});
   }catch(error){
     setError(error?.message||'Could not create the membership account.');
   }finally{
     setBusy(false);
   }
 }

 return <main className="narrow page membership-registration-page">
   <div className="application-stepper">
     <div className="step active"><span>1</span><b>Create Account</b><small>Current step</small></div>
     <div className="step"><span>2</span><b>Membership Form</b><small>Automatic next step</small></div>
     <div className="step"><span>3</span><b>Payment</b><small>QR payment</small></div>
     <div className="step"><span>4</span><b>Membership</b><small>ID & certificate</small></div>
   </div>

   <Title
     eyebrow="Step 1 of 4 • National Membership"
     title="Create Membership Account"
     subtitle="Create your account once. After successful registration, you will automatically continue to Step 2 — the Membership Application Form."
   />

   <form className="form-card" onSubmit={submit}>
     <label>Full Name<input name="full_name" autoComplete="name" required/></label>
     <label>Email Address<input name="email" type="email" autoComplete="email" required/></label>
     <label>Password<input name="password" type="password" minLength="8" autoComplete="new-password" required/></label>

     <div className="registration-flow-note">
       <b>No email confirmation step</b>
       <span>After your account is created, the system will open the Membership Application Form immediately.</span>
     </div>

     {error&&<p className="error">{error}</p>}

     <button className="btn btn-gold" disabled={busy}>
       {busy?'Creating Account...':'Continue to Step 2'}
     </button>
   </form>
 </main>;
}
function Dashboard({session}){const[role,setRole]=useState(undefined);useEffect(()=>{if(session===null)return setRole(null);if(!session)return;supabase.from('profiles').select('role').eq('id',session.user.id).single().then(({data})=>setRole(data?.role||'member'));},[session]);if(session===undefined||role===undefined)return <Loading/>;if(!session)return <Navigate to="/login" replace/>;return <Navigate to={role==='national_admin'?'/master-access':role==='regional_admin'?'/regional-admin':'/member'} replace/>}
function Member({session}){
 const nav=useNavigate();
 const[memberRole,setMemberRole]=useState(undefined);
 const[member,setMember]=useState();
 const[regions,setRegions]=useState([]);
 const[positions,setPositions]=useState([]);
 const[msg,setMsg]=useState('');
 const[saving,setSaving]=useState(false);

 async function load(){
   if(!session)return;
   const[profile,m,r,p]=await Promise.all([
     supabase.from('profiles').select('role').eq('id',session.user.id).single(),
     supabase.from('members').select('*,regions(*),positions(*)').eq('user_id',session.user.id).single(),
     supabase.from('regions').select('*').order('sort_order'),
     supabase.from('positions').select('*').eq('active',true).order('sort_order').order('name')
   ]);
   setMemberRole(profile.data?.role||'member');
   setMember(m.data||null);
   setRegions(r.data||[]);
   setPositions(p.data||[]);
 }

 useEffect(()=>{if(session)load();},[session]);

 if(session===undefined||member===undefined||memberRole===undefined)return <Loading/>;
 if(!session)return <Navigate to="/login"/>;
 if(memberRole!=='member')return <Denied/>;
 if(!member)return <main className="page"><div className="notice">Member record not found.</div></main>;

 const editable=['pending','rejected'].includes(member.status);

 async function upload(file,kind){
   if(!file?.size)return'';
   const allowed=['image/png','image/jpeg','image/webp'];
   if(file.type&&!allowed.includes(file.type)){
     throw new Error('Photo and signature must be PNG, JPG/JPEG, or WebP.');
   }
   if(file.size>5*1024*1024)throw new Error('Image is too large. Maximum file size is 5 MB.');
   const ext=(file.name.split('.').pop()||'png').toLowerCase().replace('jpeg','jpg');
   const path=`${session.user.id}/${kind}-${Date.now()}.${ext}`;
   const{error}=await supabase.storage.from('member-assets').upload(path,file,{
     upsert:false,
     contentType:file.type||'image/png',
     cacheControl:'3600'
   });
   if(error)throw error;
   return supabase.storage.from('member-assets').getPublicUrl(path).data.publicUrl;
 }

 async function save(e){
   e.preventDefault();
   const form=e.currentTarget;
   setSaving(true);
   setMsg('');
   try{
     const f=new FormData(form);
     const photoInput=f.get('photo');
     const drawnSignatureData=String(f.get('member_signature_drawn')||'').trim();
     let signatureInput=f.get('member_signature');
     if(!(signatureInput && signatureInput.size) && drawnSignatureData){
       signatureInput=await dataUrlToFile(drawnSignatureData, `member-signature-${Date.now()}.png`);
     }
     if(!(photoInput && photoInput.size) && !member.photo_url){
       throw new Error('Please upload a member photo.');
     }
     if(!(signatureInput && signatureInput.size) && !member.member_signature_url){
       throw new Error('Please upload or draw your signature before submitting.');
     }
     const photo=await upload(photoInput,'photo');
     const sig=await upload(signatureInput,'signature');

     const{error:updateError}=await supabase.rpc('update_my_application',{
       p_full_name:String(f.get('full_name')||'').trim(),
       p_position_id:String(f.get('position_id')||'')||null,
       p_region_id:String(f.get('region_id')||'')||null,
       p_chapter:String(f.get('chapter')||'').trim(),
       p_phone:String(f.get('phone')||'').trim(),
       p_email:String(f.get('email')||'').trim(),
       p_photo_url:photo||member.photo_url||'',
       p_member_signature_url:sig||member.member_signature_url||'',
       p_emergency_name:String(f.get('emergency_name')||'').trim(),
       p_emergency_relationship:String(f.get('emergency_relationship')||'').trim(),
       p_emergency_mobile:String(f.get('emergency_mobile')||'').trim(),
       p_emergency_email:String(f.get('emergency_email')||'').trim()
     });
     if(updateError)throw updateError;

     const{data:submitted,error:submitError}=await supabase.rpc('submit_membership_application');
     if(submitError)throw submitError;

     const result=Array.isArray(submitted)?submitted[0]:submitted;
     setMsg(`Application completed. Form Code: ${result?.application_form_code||'Generated'}`);
     await load();
     nav(`/application-form/${member.id}`);
   }catch(error){
     setMsg(error?.message||'Could not submit membership application.');
   }finally{
     setSaving(false);
   }
 }

 const positionName=member.positions?.name||member.designation||'—';

 return <main className="page">
   <div className="application-stepper member-stepper">
     <div className="step complete"><span>✓</span><b>Create Account</b><small>Completed</small></div>
     <div className={`step ${member.application_form_code?'complete':'active'}`}><span>{member.application_form_code?'✓':'2'}</span><b>Membership Form</b><small>{member.application_form_code?'Completed':'Current step'}</small></div>
     <div className={`step ${member.payment_status==='paid'||member.payment_status==='waived'?'complete':member.application_form_code?'active':''}`}><span>{member.payment_status==='paid'||member.payment_status==='waived'?'✓':'3'}</span><b>Payment</b><small>{member.payment_status==='paid'||member.payment_status==='waived'?'Completed':member.application_form_code?'Next step':'Pending'}</small></div>
     <div className={`step ${member.status==='active'?'complete':''}`}><span>{member.status==='active'?'✓':'4'}</span><b>Membership</b><small>{member.status==='active'?'Active':'Pending'}</small></div>
   </div>
   <div className="dashboard-head">
     <div>
       <span className="eyebrow">Member Module</span>
       <h1>{member.full_name}</h1>
       <p>{member.application_form_code||member.control_number||'Complete the membership application to generate your Form Code.'}</p>
     </div>
     <span className={`status status-${member.status}`}>{statusLabel(member.status)}</span>
   </div>

   <section className="stats">
     <Stat label="Status" value={statusLabel(member.status)}/>
     <Stat label="Position" value={positionName}/>
     <Stat label="Form Code" value={member.application_form_code||'Not submitted'}/>
     <Stat label="Total Fees" value={money(Number(member.membership_fee)+Number(member.accreditation_fee))}/>
   </section>

   {member.application_form_code&&<section className="panel application-ready-panel">
     <div className="panel-heading">
       <div>
         <h2>Completed Membership Application</h2>
         <p>Your official application form has been generated and assigned a unique Form Code.</p>
       </div>
       <div className="actions">
         <Link className="btn btn-gold" to={`/application-form/${member.id}`}>View / Download Form</Link>
         {member.payment_status!=='paid'&&<Link className="btn" to={`/payment/${member.id}`}>Proceed to Payment</Link>}
       </div>
     </div>
   </section>}

   {member.application_form_code&&member.payment_status!=='paid'&&<section className="panel payment-reminder-panel">
     <div className="panel-heading">
       <div><h2>Membership Payment</h2><p>Complete your payment using BDO, UnionBank, GCash, or Maya QR. No separate membership approval is required.</p></div>
       <Link className="btn btn-gold" to={`/payment/${member.id}`}>Proceed to Payment</Link>
     </div>
   </section>}

   {member.status==='active'&&<section className="panel">
     <h2>Your Official Membership Documents</h2>
     <div className="actions">
       <Link className="btn btn-gold" to={`/print/id/${member.id}`}>Open / Print National ID</Link>
       <Link className="btn btn-gold" to={`/print/certificate/${member.id}`}>Open / Print Certificate</Link>
       <Link className="btn" to="/lookup">Scan / Verify Member ID</Link>
     </div>
   </section>}

   <section className="panel member-application-panel">
     <div className="panel-heading">
       <div><h2>National Membership Application Form</h2><p>Complete all required information, upload a clear photo and signature or draw the signature online, then submit the form for direct processing.</p></div>
     </div>

     {!editable&&<p className="notice">This submitted application is locked. Use the generated application form for your official record.</p>}

     <form className="form-grid member-application-form" onSubmit={save}>
       <div className="form-subtitle">Personal & Membership Information</div>
       <label>Full Name<input name="full_name" defaultValue={member.full_name||''} disabled={!editable} required/></label>
       <label>Position / Designation<select name="position_id" defaultValue={member.position_id||''} disabled={!editable} required><option value="">Select Position</option>{positions.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
       <label>Region<select name="region_id" defaultValue={member.region_id||''} disabled={!editable} required><option value="">Select Region</option>{regions.map(r=><option value={r.id} key={r.id}>{r.code} — {r.name}</option>)}</select></label>
       <label>Chapter<input name="chapter" defaultValue={member.chapter||''} disabled={!editable} required/></label>
       <label>Mobile Number<input name="phone" defaultValue={member.phone||''} disabled={!editable} required/></label>
       <label>Email<input name="email" type="email" defaultValue={member.email||''} disabled={!editable} required/></label>

       <div className="form-subtitle">Required Photo & Signature</div>
       <label>Member Photo {member.photo_url&&<small className="field-saved">Current photo saved</small>}<input name="photo" type="file" accept="image/png,image/jpeg,image/webp" disabled={!editable} required={editable&&!member.photo_url}/></label>
       <label>Member Signature Upload {member.member_signature_url&&<small className="field-saved">Current signature saved</small>}<input name="member_signature" type="file" accept="image/png,image/jpeg,image/webp" disabled={!editable}/></label>
       <SignaturePadField name="member_signature_drawn" disabled={!editable} existingUrl={member.member_signature_url||''} />

       <div className="form-subtitle">In Case of Emergency</div>
       <label>Emergency Contact Name<input name="emergency_name" defaultValue={member.emergency_name||''} disabled={!editable} required/></label>
       <label>Relationship<input name="emergency_relationship" defaultValue={member.emergency_relationship||''} disabled={!editable} required/></label>
       <label>Emergency Mobile<input name="emergency_mobile" defaultValue={member.emergency_mobile||''} disabled={!editable} required/></label>
       <label>Emergency Email<input name="emergency_email" type="email" defaultValue={member.emergency_email||''} disabled={!editable}/></label>

       {editable&&<div className="application-submit-wrap">
         <p>By submitting, the application is sent directly for processing. A unique Form Code will be generated automatically.</p>
         <button className="btn btn-gold" disabled={saving}>{saving?'Submitting Application...':'Complete & Submit Membership Form'}</button>
       </div>}
     </form>

     {msg&&<p className="notice">{msg}</p>}
   </section>
 </main>;
}


function downloadApplicationHtml(member){
 const safe=(v)=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const position=member.positions?.name||member.designation||'—';
 const region=member.regions?.name||'—';
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>${safe(member.application_form_code||'BAP Membership Form')}</title>
 <style>
 body{font-family:Arial,sans-serif;color:#102a4e;margin:0;padding:30px;background:#fff} .sheet{max-width:850px;margin:auto;border:2px solid #cfa426;padding:28px}
 .head{text-align:center;border-bottom:2px solid #102a4e;padding-bottom:12px;margin-bottom:18px}.head img{width:80px}.head h1{font-size:22px;margin:8px 0 4px}.code{font-weight:700}
 .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}.row{border-bottom:1px solid #cfd8e5;padding:7px 0}.row small{display:block;color:#667085;font-size:10px}.row b{font-size:13px}
 .photo{width:120px;height:145px;object-fit:cover;border:1px solid #ccc}.sig{max-width:180px;height:60px;object-fit:contain}.footer{margin-top:22px;font-size:11px;color:#667085}
 @media print{body{padding:0}.sheet{border:none}}
 </style></head><body><div class="sheet"><div class="head"><img src="${BAP_LOGO}"><h1>BAP NATIONAL MEMBERSHIP APPLICATION FORM</h1><div class="code">FORM CODE: ${safe(member.application_form_code)}</div></div>
 <div style="display:flex;gap:22px;margin-bottom:18px">${member.photo_url?`<img class="photo" src="${member.photo_url}">`:''}<div style="flex:1"><div class="grid">
 <div class="row"><small>FULL NAME</small><b>${safe(member.full_name)}</b></div><div class="row"><small>POSITION</small><b>${safe(position)}</b></div>
 <div class="row"><small>REGION</small><b>${safe(region)}</b></div><div class="row"><small>CHAPTER</small><b>${safe(member.chapter)}</b></div>
 <div class="row"><small>MOBILE</small><b>${safe(member.phone)}</b></div><div class="row"><small>EMAIL</small><b>${safe(member.email)}</b></div>
 </div></div></div>
 <h3>Emergency Contact</h3><div class="grid"><div class="row"><small>NAME</small><b>${safe(member.emergency_name)}</b></div><div class="row"><small>RELATIONSHIP</small><b>${safe(member.emergency_relationship)}</b></div><div class="row"><small>MOBILE</small><b>${safe(member.emergency_mobile)}</b></div><div class="row"><small>EMAIL</small><b>${safe(member.emergency_email)}</b></div></div>
 <h3>Applicant Signature</h3>${member.member_signature_url?`<img class="sig" src="${member.member_signature_url}">`:''}
 <div class="footer">Submitted: ${safe(fmtDate(member.application_submitted_at))} • BAP National Membership System</div></div></body></html>`;
 const blob=new Blob([html],{type:'text/html;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;
 a.download=`${member.application_form_code||'BAP-Membership-Application'}.html`;
 document.body.appendChild(a);
 a.click();
 a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),500);
}

function ApplicationForm({session}){
 const{id}=useParams();
 const[member,setMember]=useState(undefined);
 const[profile,setProfile]=useState(undefined);

 useEffect(()=>{
   if(!session)return;
   Promise.all([
     supabase.from('members').select('*,regions(*),positions(*)').eq('id',id).single(),
     supabase.from('profiles').select('role,region_id').eq('id',session.user.id).single()
   ]).then(([m,p])=>{
     setMember(m.data||null);
     setProfile(p.data||null);
   });
 },[session,id]);

 if(session===undefined||member===undefined||profile===undefined)return <Loading/>;
 if(!session)return <Navigate to="/login" replace/>;
 if(!member)return <Denied/>;

 const canView=
   member.user_id===session.user.id ||
   profile?.role==='national_admin';

 if(!canView)return <Denied/>;
 if(!member.application_form_code)return <main className="narrow page"><div className="verification invalid"><h1>APPLICATION FORM NOT YET GENERATED</h1><p>The membership application must be completed first.</p></div></main>;

 return <main className="application-form-page">
   <div className="application-form-toolbar no-print">
     <div><b>Official Membership Application Form</b><small>{member.application_form_code}</small></div>
     <div className="actions">
       <button className="btn" onClick={()=>downloadApplicationHtml(member)}>Download Form</button>
       <button className="btn btn-gold" onClick={()=>window.print()}>Print / Save as PDF</button>
       {member.user_id===session.user.id&&member.payment_status!=='paid'&&<Link className="btn" to={`/payment/${member.id}`}>Proceed to Payment</Link>}
       {profile?.role==='national_admin'&&<Link className="btn" to="/master-access">Back to Master Access</Link>}
     </div>
   </div>

   <section className="application-form-sheet">
     <header className="application-form-head">
       <img src={BAP_LOGO} alt="BAP logo"/>
       <div><div className="application-org">BASKETBALL ASSOCIATION OF THE PHILIPPINES</div><h1>NATIONAL MEMBERSHIP APPLICATION FORM</h1><p>Official Membership • Accreditation • Licensing</p></div>
       <div className="application-code-box"><small>FORM CODE</small><b>{member.application_form_code}</b><span>{fmtDate(member.application_submitted_at)}</span></div>
     </header>

     <div className="application-profile-row">
       <div className="application-photo-box">{member.photo_url?<img src={member.photo_url} alt="Applicant"/>:<span>PHOTO</span>}</div>
       <div className="application-fields">
         <div><small>Full Name</small><b>{member.full_name||'—'}</b></div>
         <div><small>Position / Designation</small><b>{member.positions?.name||member.designation||'—'}</b></div>
         <div><small>Region</small><b>{member.regions?.name||'—'}</b></div>
         <div><small>Chapter</small><b>{member.chapter||'—'}</b></div>
         <div><small>Mobile Number</small><b>{member.phone||'—'}</b></div>
         <div><small>Email Address</small><b>{member.email||'—'}</b></div>
       </div>
     </div>

     <h3 className="application-section-title">Emergency Contact</h3>
     <div className="application-fields four">
       <div><small>Contact Name</small><b>{member.emergency_name||'—'}</b></div>
       <div><small>Relationship</small><b>{member.emergency_relationship||'—'}</b></div>
       <div><small>Mobile</small><b>{member.emergency_mobile||'—'}</b></div>
       <div><small>Email</small><b>{member.emergency_email||'—'}</b></div>
     </div>

     <h3 className="application-section-title">Membership Processing</h3>
     <div className="application-fields four">
       <div><small>Application Status</small><b>{statusLabel(member.status)}</b></div>
       <div><small>Payment Status</small><b>{statusLabel(member.payment_status)}</b></div>
       <div><small>Membership Fee</small><b>{money(member.membership_fee)}</b></div>
       <div><small>Accreditation Fee</small><b>{money(member.accreditation_fee)}</b></div>
     </div>

     <div className="application-signature-block">
       <div>{member.member_signature_url?<img src={member.member_signature_url} alt="Applicant signature"/>:<span>No signature</span>}<div className="signature-line"/><b>{member.full_name}</b><small>Applicant Signature</small></div>
     </div>

     <footer className="application-form-footer">
       <span>Automatically generated by the BAP National Membership System</span>
       <span>{member.application_form_code}</span>
     </footer>
   </section>
 </main>;
}

function Payment({session}){
 const{id}=useParams();
 const[member,setMember]=useState(undefined);

 useEffect(()=>{
   async function load(){
     if(!session)return;
     const{data,error}=await supabase
       .from('members')
       .select('id,user_id,full_name,status,payment_status,membership_fee,accreditation_fee,control_number,member_id_number')
       .eq('id',id)
       .eq('user_id',session.user.id)
       .maybeSingle();

     if(error){
       console.error(error);
       setMember(null);
       return;
     }
     setMember(data||null);
   }
   if(session)load();
 },[session,id]);

 function downloadQrSvg(method){
   const svg=document.getElementById(`payment-qr-${method.key}`);
   if(!svg)return alert('QR code is still loading. Please try again.');
   const source=`<?xml version="1.0" encoding="UTF-8"?>\n${svg.outerHTML}`;
   const blob=new Blob([source],{type:'image/svg+xml;charset=utf-8'});
   const url=URL.createObjectURL(blob);
   const a=document.createElement('a');
   a.href=url;
   a.download=`BAP-${method.name.replace(/\s+/g,'-')}-Payment-QR.svg`;
   document.body.appendChild(a);
   a.click();
   a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),500);
 }

 function openQrWindow(method){
   const svg=document.getElementById(`payment-qr-${method.key}`);
   if(!svg)return alert('QR code is still loading. Please try again.');
   const page=`<!doctype html><html><head><meta charset="utf-8"><title>${method.name} BAP Payment QR</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,sans-serif;background:#fff;color:#08234d;margin:0;padding:24px;text-align:center}h1{font-size:24px;margin:0 0 6px}p{color:#667085;margin:0 0 18px}.qr{display:inline-block;padding:18px;border:2px solid #d5a629;border-radius:14px;background:#fff}.qr svg{width:min(84vw,620px);height:auto;display:block}.amount{font-size:26px;font-weight:900;margin:18px 0;color:#08234d}.note{font-size:13px;max-width:620px;margin:0 auto;color:#667085}</style></head><body><h1>${method.name} — BAP Payment QR</h1><p>Basketball Association of the Philippines National Membership</p><div class="qr">${svg.outerHTML}</div><div class="amount">Amount Due: ${money(total)}</div><div class="note">Scan this QR using your supported banking or e-wallet application. On the same phone, use the app's Upload QR / Scan from Gallery option after saving or taking a screenshot.</div></body></html>`;
   const win=window.open('','_blank');
   if(!win)return alert('Your browser blocked the QR window. Use Download QR instead.');
   win.document.open();
   win.document.write(page);
   win.document.close();
 }

 if(session===undefined||member===undefined)return <Loading/>;
 if(!session)return <Navigate to="/login" replace/>;
 if(!member)return <Denied/>;

 const total=Number(member.membership_fee||700)+Number(member.accreditation_fee||100);

 // These are the exact payment QR payloads reconstructed from the supplied
 // BDO, UnionBank, GCash and Maya QR images. Rendering them directly through
 // QRCodeSVG avoids broken <img> paths on Vercel.
 const methods=[
   {
     key:'bdo',
     name:'BDO',
     payload:'00020101021127590012com.p2pqrpay0111BNORPHMMXXX02089996440304120109460008405204601653036085802PH5906BAPNTO6011Makati City6304FC67',
     account:'BAPNTO',
     note:'Scan with BDO or another supported InstaPay QR scanner.'
   },
   {
     key:'unionbank',
     name:'UnionBank',
     payload:'00020101021127590012com.p2pqrpay0111UBPHPHMMXXX02089996440304121098869672005204601653036085802PH5918Engelbert F Fortin6004IMUS6304FA9D',
     account:'ENGELBERT F FORTIN',
     note:'Scan with UnionBank or another supported InstaPay QR scanner.'
   },
   {
     key:'gcash',
     name:'GCash',
     payload:'00020101021127830012com.p2pqrpay0111GXCHPHM2XXX02089996440303152170200000006560417DWQM4TK3JDO9DWXA45204601653036085802PH5907BAP NTO6008Kamuning610412346304BF96',
     account:'BAP NTO',
     note:'Scan with GCash or another supported InstaPay QR scanner.'
   },
   {
     key:'maya',
     name:'Maya',
     payload:'00020101021127780012com.p2pqrpay0111PAPHPHM1XXX02089996440304126396259760770515+63-962-59760775204601653036085802PH5918ENGELBERT F FORTIN6011Quezon City63047D6C',
     account:'ENGELBERT F FORTIN',
     note:'Scan with Maya or another supported InstaPay QR scanner.'
   }
 ];

 if(member.payment_status==='paid'){
   return <main className="narrow page">
     <section className="payment-complete-card">
       <span className="payment-success-mark">✓</span>
       <span className="eyebrow">Membership Payment</span>
       <h1>Payment Recorded</h1>
       <p>Your payment is already marked as <b>PAID</b> in the membership database.</p>
       <Link className="btn btn-gold" to="/member">Return to Member Portal</Link>
     </section>
   </main>;
 }

 return <main className="payment-page payment-page-v15">
   <div className="payment-heading">
     <span className="eyebrow">National Membership Payment</span>
     <h1>Choose Your Payment QR</h1>
     <p>Choose any payment channel below. The QR codes are now generated directly inside the website, so they do not depend on image files or Vercel public-image paths.</p>
   </div>

   <section className="payment-summary">
     <div><small>Applicant</small><b>{member.full_name}</b></div>
     <div><small>Membership / National ID</small><b>{money(member.membership_fee||700)}</b></div>
     <div><small>Accreditation / Licensing</small><b>{money(member.accreditation_fee||100)}</b></div>
     <div className="payment-total"><small>Total Amount Due</small><b>{money(total)}</b></div>
   </section>

   <section className="payment-instructions">
     <b>How to Pay</b>
     <span>1. Choose BDO, UnionBank, GCash, or Maya. 2. Scan the QR using your banking/e-wallet app. 3. Enter the exact amount due. 4. Complete the transfer. 5. Keep your receipt. If paying on the same phone, use Open QR or Download QR, then use your app's Upload QR / Scan from Gallery feature.</span>
   </section>

   <section className="payment-qr-tested-note">
     <b>V6.15 Payment QR Fix</b>
     <span>The QR codes below are rendered as live SVG QR codes inside the React page. There are no payment QR image URLs to break.</span>
   </section>

   <section className="payment-method-grid">
     {methods.map(method=><article className="payment-method-card payment-method-card-v15" key={method.key}>
       <div className="payment-method-title">
         <div><h2>{method.name}</h2><small>{method.account}</small></div>
         <span>InstaPay QR</span>
       </div>

       <div className="payment-qr-inline">
         <span className="payment-qr-label">SCAN TO PAY</span>
         <div className="payment-qr-svg-wrap">
           <QRCodeSVG
             id={`payment-qr-${method.key}`}
             value={method.payload}
             size={500}
             level="L"
             includeMargin={true}
             bgColor="#FFFFFF"
             fgColor="#000000"
           />
         </div>
       </div>

       <div className="payment-card-amount"><small>Amount Due</small><b>{money(total)}</b></div>
       <p>{method.note}</p>

       <div className="payment-qr-actions">
         <button className="btn btn-gold" type="button" onClick={()=>openQrWindow(method)}>Open QR Full Size</button>
         <button className="btn" type="button" onClick={()=>downloadQrSvg(method)}>Download QR</button>
       </div>
     </article>)}
   </section>

   <section className="payment-note">
     <b>Important</b>
     <span>Payment is not automatically confirmed by the QR page. After the National Master Administrator verifies the payment, the membership is activated and the official Membership ID and Control Number are issued.</span>
   </section>

   <div className="payment-bottom-actions">
     <Link className="btn" to="/member">Back to Member Portal</Link>
   </div>
 </main>;
}

function NationalAdmin({session,masterMode=false}){
 const[allowed,setAllowed]=useState();const[members,setMembers]=useState([]);const[profiles,setProfiles]=useState([]);const[regions,setRegions]=useState([]);const[signatories,setSignatories]=useState([]);const[positions,setPositions]=useState([]);const[idTemplate,setIdTemplate]=useState(null);const[leadershipPosters,setLeadershipPosters]=useState([]);const[emailNotifications,setEmailNotifications]=useState([]);const[runningEmailWorker,setRunningEmailWorker]=useState(false);const[savingPoster,setSavingPoster]=useState(false);const[savingIdTemplate,setSavingIdTemplate]=useState(false);const[tab,setTab]=useState('members');const[creating,setCreating]=useState(false);const[selectedRegionDb,setSelectedRegionDb]=useState('');const[editMember,setEditMember]=useState(null);const[editingMember,setEditingMember]=useState(false);const[exportingExcel,setExportingExcel]=useState(false);const[certificateSearch,setCertificateSearch]=useState('');const[certificateRegion,setCertificateRegion]=useState('');const[certificateStatus,setCertificateStatus]=useState('active');const[certificateMemberId,setCertificateMemberId]=useState('');
 async function load(){if(!session)return;const{data:me}=await supabase.from('profiles').select('*').eq('id',session.user.id).single();if(me?.role!=='national_admin'){setAllowed(false);return;}setAllowed(true);const[m,p,r,s,pos,t,lp,en]=await Promise.all([
   supabase.from('members').select('*,regions(*),positions(*)').order('created_at',{ascending:false}),
   supabase.from('profiles').select('*,regions(*)').order('created_at',{ascending:false}),
   supabase.from('regions').select('*').order('sort_order'),
   supabase.from('signatories').select('*').order('slug'),
   supabase.from('positions').select('*').order('sort_order').order('name'),
   supabase.from('id_templates').select('*').eq('template_key','national_membership').maybeSingle(),
   supabase.from('leadership_posters').select('*,regions(code,name)').order('display_order').order('created_at',{ascending:false}),
   supabase.from('email_notifications').select('*').order('created_at',{ascending:false}).limit(100)
 ]);setMembers(m.data||[]);setProfiles(p.data||[]);setRegions(r.data||[]);setSignatories(s.data||[]);setPositions(pos.data||[]);setIdTemplate(t.data||null);setLeadershipPosters(lp.data||[]);setEmailNotifications(en.data||[]);setActiveIdTemplateCache(t.data||null);}
 useEffect(()=>{if(session)load();},[session]);
 if(session===undefined||allowed===undefined)return <Loading/>;if(!session)return <Navigate to="/master-login"/>;if(!allowed)return <Denied/>;
 const stats={total:members.length,pending:members.filter(x=>x.status==='pending').length,active:members.filter(x=>x.status==='active').length,positions:positions.filter(x=>x.active).length};
 const certificateQuery=certificateSearch.trim().toLowerCase();
 const certificateCandidates=members.filter(m=>{
   const haystack=[m.full_name,m.member_id_number,m.control_number,m.chapter,m.positions?.name,m.designation].filter(Boolean).join(' ').toLowerCase();
   const matchesSearch=!certificateQuery||haystack.includes(certificateQuery);
   const matchesRegion=!certificateRegion||m.region_id===certificateRegion;
   const matchesStatus=certificateStatus==='all'||m.status===certificateStatus;
   return matchesSearch&&matchesRegion&&matchesStatus;
 }).sort((a,b)=>String(a.full_name||'').localeCompare(String(b.full_name||'')));
 const selectedCertificateMember=members.find(m=>m.id===certificateMemberId)||null;
 const idFormatPreviewMember=members.find(m=>m.status==='active')||members[0]||{
   full_name:'JUAN DELA CRUZ',designation:'CITY COMMISSIONER',chapter:'QUEZON CITY',member_id_number:'BAP-NCR-2026-000001',control_number:'BAP-NTO-NCR-2026-000001',issued_at:new Date().toISOString(),expires_at:new Date(Date.now()+63072000000).toISOString(),regions:{name:'National Capital Region'},positions:{name:'City Commissioner'},emergency_name:'MARIA DELA CRUZ',emergency_relationship:'SPOUSE',emergency_mobile:'0917 000 0000',emergency_email:'contact@example.com'};
 async function runEmailWorker(){
   if(runningEmailWorker)return;
   setRunningEmailWorker(true);
   try{
     const{data,error}=await supabase.functions.invoke('member-email-notifications',{body:{source:'master-access'}});
     if(error)throw error;
     alert(`Email worker completed. Sent: ${data?.sent||0}. Retry/failed: ${data?.failed_or_retrying||0}. Expiry reminders queued: ${data?.expiry_notifications_queued||0}.`);
     await load();
   }catch(error){
     let detail=error?.message||'Unknown error';
     try{
       const response=error?.context;
       if(response?.clone){
         const payload=await response.clone().json();
         if(payload?.error)detail=`${detail} — ${payload.error}`;
       }
     }catch{}
     alert(`Email worker could not run: ${detail}. Check that the member-email-notifications Edge Function is deployed in the SAME Supabase project as VITE_SUPABASE_URL, then verify Edge Function secrets.`);
   }finally{
     setRunningEmailWorker(false);
   }
 }
 async function setAccess(profileId,role,regionId){const{error}=await supabase.rpc('set_user_access',{p_profile_id:profileId,p_role:role,p_region_id:role==='regional_admin'?regionId:null});if(error)alert(error.message);await load();}
 async function upload(file,name){
   if(!file?.size)return'';
   const allowed=['image/png','image/jpeg','image/webp'];
   if(file.type && !allowed.includes(file.type)){
     throw new Error('Signature/photo must be PNG, JPG/JPEG, or WebP. Please convert HEIC files before uploading.');
   }
   if(file.size>5*1024*1024){
     throw new Error('Image is too large. Maximum file size is 5 MB.');
   }
   const rawExt=(file.name.split('.').pop()||'png').toLowerCase();
   const ext=rawExt==='jpeg'?'jpg':rawExt;
   // Store admin uploads inside the authenticated user's own folder.
   // This works even when older Storage policies only allow auth.uid() folders.
   const path=`${session.user.id}/admin/${name}-${Date.now()}.${ext}`;
   const{error}=await supabase.storage.from('member-assets').upload(path,file,{
     upsert:false,
     cacheControl:'3600',
     contentType:file.type||'image/png'
   });
   if(error)throw new Error(`Upload failed: ${error.message}`);
   const{data}=supabase.storage.from('member-assets').getPublicUrl(path);
   if(!data?.publicUrl)throw new Error('Upload finished but no public signature URL was returned.');
   return data.publicUrl;
 }

 async function uploadIdTemplateAsset(file,name){
   if(!file?.size)return'';
   const allowed=['image/png','image/jpeg','image/webp'];
   if(file.type && !allowed.includes(file.type))throw new Error('ID format must be PNG, JPG/JPEG, or WebP.');
   if(file.size>10*1024*1024)throw new Error('ID format image is too large. Maximum file size is 10 MB.');
   const rawExt=(file.name.split('.').pop()||'png').toLowerCase();
   const ext=rawExt==='jpeg'?'jpg':rawExt;
   const path=`${session.user.id}/admin/id-format/${name}-${Date.now()}.${ext}`;
   const{error}=await supabase.storage.from('member-assets').upload(path,file,{upsert:false,cacheControl:'3600',contentType:file.type||'image/png'});
   if(error)throw new Error(`ID format upload failed: ${error.message}`);
   const{data}=supabase.storage.from('member-assets').getPublicUrl(path);
   if(!data?.publicUrl)throw new Error('ID format upload finished but no public URL was returned.');
   return data.publicUrl;
 }

 async function saveIdFormat(e){
   e.preventDefault();
   if(savingIdTemplate)return;
   setSavingIdTemplate(true);
   const form=e.currentTarget;
   const f=new FormData(form);
   try{
     let frontUrl=idTemplate?.front_url||'';
     let backUrl=idTemplate?.back_url||'';
     const front=f.get('front_template');
     const back=f.get('back_template');
     if(front?.size)frontUrl=await uploadIdTemplateAsset(front,'national-id-front');
     if(back?.size)backUrl=await uploadIdTemplateAsset(back,'national-id-back');
     if(!frontUrl&&!backUrl)throw new Error('Upload at least one ID format image.');

     const payload={
       template_key:'national_membership',
       front_url:frontUrl||null,
       back_url:backUrl||null,
       layout_key:'pvc_2026_v2',
       updated_at:new Date().toISOString(),
       updated_by:session.user.id
     };
     const{data,error}=await supabase.from('id_templates').upsert(payload,{onConflict:'template_key'}).select('*').single();
     if(error)throw new Error(`Could not save ID format: ${error.message}. Run the V6.31 SQL migration first.`);
     setIdTemplate(data);
     setActiveIdTemplateCache(data);
     form?.reset();
     alert('National ID format saved. Digital IDs will now use the uploaded front/back template.');
   }catch(error){
     alert(error?.message||'Could not save the ID format.');
   }finally{
     setSavingIdTemplate(false);
   }
 }

 async function restoreBuiltInIdFormat(){
   if(!window.confirm('Restore the built-in ID artwork? Uploaded template URLs will be removed from the active ID format.'))return;
   setSavingIdTemplate(true);
   try{
     const payload={template_key:'national_membership',front_url:null,back_url:null,layout_key:'legacy_embedded',updated_at:new Date().toISOString(),updated_by:session.user.id};
     const{data,error}=await supabase.from('id_templates').upsert(payload,{onConflict:'template_key'}).select('*').single();
     if(error)throw error;
     setIdTemplate(data);
     setActiveIdTemplateCache(data);
     alert('Built-in ID format restored.');
   }catch(error){
     alert(error?.message||'Could not restore the built-in format.');
   }finally{
     setSavingIdTemplate(false);
   }
 }


 async function uploadLeadershipPosterAsset(file,name){
   if(!file?.size)return'';
   const allowed=['image/png','image/jpeg','image/webp'];
   if(file.type && !allowed.includes(file.type))throw new Error('Poster must be PNG, JPG/JPEG, or WebP.');
   if(file.size>12*1024*1024)throw new Error('Poster image is too large. Maximum file size is 12 MB.');
   const rawExt=(file.name.split('.').pop()||'png').toLowerCase();
   const ext=rawExt==='jpeg'?'jpg':rawExt;
   const path=`${session.user.id}/admin/leadership-posters/${name}-${Date.now()}.${ext}`;
   const{error}=await supabase.storage.from('member-assets').upload(path,file,{upsert:false,cacheControl:'3600',contentType:file.type||'image/png'});
   if(error)throw new Error(`Poster upload failed: ${error.message}`);
   const{data}=supabase.storage.from('member-assets').getPublicUrl(path);
   if(!data?.publicUrl)throw new Error('Poster uploaded but no public URL was returned.');
   return data.publicUrl;
 }

 async function createLeadershipPoster(e){
   e.preventDefault();
   if(savingPoster)return;
   setSavingPoster(true);
   const form=e.currentTarget;
   const f=new FormData(form);
   try{
     const file=f.get('poster_image');
     if(!(file&&file.size))throw new Error('Please select a poster image.');

     // V6.38 — ONE-CLICK POSTER UPLOAD
     // No title/name/region/caption form is required.
     // The image is uploaded and published immediately.
     const imageUrl=await uploadLeadershipPosterAsset(file,'poster-auto');

     const fileName=String(file.name||'Official Leadership Poster')
       .replace(/\.[^/.]+$/,'')
       .replace(/[_-]+/g,' ')
       .replace(/\s+/g,' ')
       .trim();

     const lowerName=fileName.toLowerCase();
     const inferredType=lowerName.includes('director')?'director':'commissioner';

     const payload={
       poster_type:inferredType,
       person_name:fileName||'Official Leadership Poster',
       position_title:'Official Leadership Poster',
       region_id:null,
       area:null,
       caption:'__AUTO_POSTER__',
       image_url:imageUrl,
       display_order:100,
       active:true,
       created_by:session.user.id,
       updated_at:new Date().toISOString()
     };

     const{error}=await supabase.from('leadership_posters').insert(payload);
     if(error)throw new Error(`Could not save poster: ${error.message}. Run the Leadership Poster SQL setup first.`);

     form.reset();
     await load();
     alert('Poster uploaded and published automatically.');
   }catch(error){
     alert(error?.message||'Could not upload the poster.');
   }finally{
     setSavingPoster(false);
   }
 }

 async function updateLeadershipPoster(e,item){
   e.preventDefault();
   const form=e.currentTarget;
   const f=new FormData(form);
   try{
     let imageUrl=item.image_url||'';
     const file=f.get('poster_image');
     if(file?.size)imageUrl=await uploadLeadershipPosterAsset(file,`poster-${item.id}`);
     const payload={
       poster_type:String(f.get('poster_type')||item.poster_type||'commissioner'),
       person_name:String(f.get('person_name')||'').trim(),
       position_title:String(f.get('position_title')||'').trim(),
       region_id:String(f.get('region_id')||'')||null,
       area:String(f.get('area')||'').trim()||null,
       caption:String(f.get('caption')||'').trim()||null,
       image_url:imageUrl,
       display_order:Number(f.get('display_order')||100),
       active:f.get('active')==='on',
       updated_at:new Date().toISOString()
     };
     const{error}=await supabase.from('leadership_posters').update(payload).eq('id',item.id);
     if(error)throw new Error(`Could not update poster: ${error.message}`);
     await load();
     alert('Poster updated.');
   }catch(error){
     alert(error?.message||'Could not update the poster.');
   }
 }

 async function deleteLeadershipPoster(item){
   if(!window.confirm('Delete this poster?'))return;
   const{error}=await supabase.from('leadership_posters').delete().eq('id',item.id);
   if(error)return alert(error.message);
   await load();
 }
 async function saveSignatory(e,item){
   e.preventDefault();
   const form=e.currentTarget;
   const f=new FormData(form);
   try{
     let url=item.signature_url||'';
     const file=f.get('signature');
     if(file?.size)url=await upload(file,`signatory-${item.slug}`);

     const{data:saved,error}=await supabase
       .from('signatories')
       .update({
         name:String(f.get('name')||'').trim(),
         signature_url:url,
         updated_at:new Date().toISOString()
       })
       .eq('slug',item.slug)
       .select('slug,name,title,signature_url')
       .single();

     if(error)throw new Error(`Database save failed: ${error.message}`);
     if(!saved)throw new Error('The signature upload succeeded, but the signatory record was not updated.');

     if(form&&typeof form.reset==='function')form.reset();
     await load();
     alert(`${saved.title} signature saved successfully.`);
   }catch(error){
     alert(error?.message||'Could not save the signature.');
   }
 }

 async function saveRegion(e,r){
   e.preventDefault();
   const form=e.currentTarget;
   const f=new FormData(form);
   try{
     let url=r.regional_director_signature_url||'';
     const file=f.get('signature');
     if(file?.size)url=await upload(file,`region-${r.code}`);

     const{data:saved,error}=await supabase
       .from('regions')
       .update({
         regional_director_name:String(f.get('director')||'').trim(),
         regional_director_signature_url:url
       })
       .eq('id',r.id)
       .select('id,code,name,regional_director_name,regional_director_signature_url')
       .single();

     if(error)throw new Error(`Database save failed: ${error.message}`);
     if(!saved)throw new Error('The signature upload succeeded, but the region record was not updated.');

     if(form&&typeof form.reset==='function')form.reset();
     await load();
     alert(`${saved.code} regional director signature saved successfully.`);
   }catch(error){
     alert(error?.message||'Could not save the regional signature.');
   }
 }
 async function addPosition(e){e.preventDefault();const form=e.currentTarget;const f=new FormData(form);const name=String(f.get('name')||'').trim();if(!name)return;const{error}=await supabase.from('positions').insert({name,category:String(f.get('category')||'Membership'),sort_order:Number(f.get('sort_order')||100),active:true});if(error)return alert(error.message);form?.reset();await load();}
 async function savePosition(e,item){e.preventDefault();const f=new FormData(e.currentTarget);const{error}=await supabase.from('positions').update({name:String(f.get('name')||'').trim(),category:String(f.get('category')||'Membership').trim(),sort_order:Number(f.get('sort_order')||100),active:f.get('active')==='on',updated_at:new Date().toISOString()}).eq('id',item.id);if(error)alert(error.message);await load();}
 async function deletePosition(item){if(!window.confirm(`Delete position “${item.name}”? Existing member records will keep the saved designation text.`))return;const{error}=await supabase.from('positions').delete().eq('id',item.id);if(error)alert(error.message);await load();}



 async function imageUrlToPngDataUrl(url){
   if(!url)return'';
   try{
     const response=await fetch(url,{mode:'cors',cache:'no-store'});
     if(!response.ok)throw new Error(`Image request failed (${response.status})`);
     const blob=await response.blob();
     const objectUrl=URL.createObjectURL(blob);
     try{
       const img=new Image();
       img.decoding='async';
       img.src=objectUrl;
       await new Promise((resolve,reject)=>{
         img.onload=resolve;
         img.onerror=()=>reject(new Error('Could not decode image.'));
       });

       const maxW=420;
       const maxH=420;
       const scale=Math.min(1,maxW/Math.max(1,img.naturalWidth),maxH/Math.max(1,img.naturalHeight));
       const canvas=document.createElement('canvas');
       canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
       canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
       const ctx=canvas.getContext('2d');
       ctx.fillStyle='#ffffff';
       ctx.fillRect(0,0,canvas.width,canvas.height);
       ctx.drawImage(img,0,0,canvas.width,canvas.height);
       return canvas.toDataURL('image/png');
     }finally{
       URL.revokeObjectURL(objectUrl);
     }
   }catch(error){
     console.warn('Excel image export skipped:',url,error);
     return'';
   }
 }

 function excelDate(value){
   if(!value)return null;
   const d=new Date(value);
   return Number.isNaN(d.getTime())?null:d;
 }

 async function downloadNationalIdProcessingExcel(){
   if(exportingExcel)return;
   if(!members.length)return alert('There are no membership records to export.');

   setExportingExcel(true);
   try{
     const ExcelJSImport=await import('exceljs/dist/exceljs.js');
     const ExcelJS=ExcelJSImport.default||ExcelJSImport;
     const workbook=new ExcelJS.Workbook();
     workbook.creator='BAP National Membership System';
     workbook.lastModifiedBy='BAP National Master Administrator';
     workbook.created=new Date();
     workbook.modified=new Date();
     workbook.subject='National Membership Database for ID Processing';
     workbook.title='BAP National Membership Database';
     workbook.description='Master-only Excel export including profile QR codes, member photos and signatures for National ID processing.';

     const ws=workbook.addWorksheet('ID Processing',{
       views:[{state:'frozen',ySplit:4,xSplit:4}]
     });

     ws.mergeCells('A1:AH1');
     const titleCell=ws.getCell('A1');
     titleCell.value='BAP NATIONAL MEMBERSHIP DATABASE — ID PROCESSING';
     titleCell.font={bold:true,size:16,color:{argb:'FFFFFFFF'}};
     titleCell.alignment={horizontal:'center',vertical:'middle'};
     titleCell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF08234D'}};
     ws.getRow(1).height=28;

     ws.mergeCells('A2:AH2');
     const subtitle=ws.getCell('A2');
     subtitle.value=`Master Access Only • Exported ${new Date().toLocaleString()} • Total Records: ${members.length}`;
     subtitle.font={italic:true,size:10,color:{argb:'FF475467'}};
     subtitle.alignment={horizontal:'center',vertical:'middle'};
     subtitle.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF8FAFC'}};
     ws.getRow(2).height=20;

     ws.mergeCells('A3:AH3');
     const privacy=ws.getCell('A3');
     privacy.value='CONFIDENTIAL: Contains personal information, emergency contacts, member photos and signatures. Handle only for authorized National ID processing.';
     privacy.font={bold:true,size:9,color:{argb:'FF8A1C16'}};
     privacy.alignment={horizontal:'center',vertical:'middle',wrapText:true};
     privacy.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF2F0'}};
     ws.getRow(3).height=24;

     const headers=[
       'Form Code','Membership ID','Control Number','Full Name',
       'Position','Designation','Region Code','Region Name','Chapter',
       'Mobile Number','Email Address','Membership Status','Payment Status',
       'Membership Fee','Accreditation Fee','Total Fees',
       'Application Submitted','Date Issued','Valid Until','Renewal Count',
       'Last Renewed','Record Source','Emergency Contact Name','Relationship',
       'Emergency Mobile','Emergency Email',
       'PROFILE QR','Profile QR URL','PHOTO','SIGNATURE','Photo URL','Signature URL','Created At','Updated At'
     ];

     const headerRow=ws.getRow(4);
     headerRow.values=headers;
     headerRow.height=31;
     headerRow.eachCell(cell=>{
       cell.font={bold:true,color:{argb:'FFFFFFFF'},size:9};
       cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0B356C'}};
       cell.alignment={horizontal:'center',vertical:'middle',wrapText:true};
       cell.border={
         top:{style:'thin',color:{argb:'FFD6A629'}},
         bottom:{style:'thin',color:{argb:'FFD6A629'}},
         left:{style:'thin',color:{argb:'FFD6DEE8'}},
         right:{style:'thin',color:{argb:'FFD6DEE8'}}
       };
     });

     const widths=[
       23,22,28,30,25,24,13,30,24,17,30,18,17,
       15,18,14,21,18,18,14,18,18,28,18,18,28,
       18,46,16,19,42,42,21,21
     ];
     widths.forEach((w,i)=>ws.getColumn(i+1).width=w);

     const processingRecords=[...members].sort((a,b)=>{
       const order={processing:1,pending:2,active:3,suspended:4,expired:5,rejected:6};
       return (order[a.status]||99)-(order[b.status]||99)
         ||String(a.regions?.code||'').localeCompare(String(b.regions?.code||''))
         ||String(a.full_name||'').localeCompare(String(b.full_name||''));
     });

     let rowNumber=5;
     let embeddedQrs=0;
     let embeddedPhotos=0;
     let embeddedSignatures=0;

     for(const m of processingRecords){
       const row=ws.getRow(rowNumber);
       const qrUrl=memberQrValue(m);
       row.values=[
         m.application_form_code||'',
         m.member_id_number||'',
         m.control_number||'',
         m.full_name||'',
         m.positions?.name||'',
         m.designation||'',
         m.regions?.code||'',
         m.regions?.name||'',
         m.chapter||'',
         m.phone||'',
         m.email||'',
         statusLabel(m.status),
         statusLabel(m.payment_status),
         Number(m.membership_fee||0),
         Number(m.accreditation_fee||0),
         Number(m.membership_fee||0)+Number(m.accreditation_fee||0),
         excelDate(m.application_submitted_at),
         excelDate(m.issued_at),
         excelDate(m.expires_at),
         Number(m.renewal_count||0),
         excelDate(m.last_renewed_at),
         m.source==='master_manual'?'Master Created':'Online Registration',
         m.emergency_name||'',
         m.emergency_relationship||'',
         m.emergency_mobile||'',
         m.emergency_email||'',
         (m.member_id_number||m.control_number)?'Embedded below':'Unavailable',
         qrUrl,
         m.photo_url?'Embedded below':'No Photo',
         m.member_signature_url?'Embedded below':'No Signature',
         m.photo_url||'',
         m.member_signature_url||'',
         excelDate(m.created_at),
         excelDate(m.updated_at)
       ];

       row.height=92;
       row.alignment={vertical:'middle',wrapText:true};

       // Money columns
       for(const col of [14,15,16]){
         row.getCell(col).numFmt='₱#,##0.00';
       }
       // Date columns
       for(const col of [17,18,19,21,33,34]){
         row.getCell(col).numFmt='yyyy-mm-dd hh:mm';
       }

       // Status emphasis
       const statusCell=row.getCell(12);
       const status=String(m.status||'').toLowerCase();
       const statusFill={
         active:'FFEAF8EF',
         processing:'FFFFF7D6',
         pending:'FFF2F4F7',
         suspended:'FFFFE8E6',
         expired:'FFF2F4F7',
         rejected:'FFFFE8E6'
       }[status]||'FFFFFFFF';
       statusCell.fill={type:'pattern',pattern:'solid',fgColor:{argb:statusFill}};
       statusCell.font={bold:true,color:{argb:'FF08234D'}};

       const paymentCell=row.getCell(13);
       if(['paid','waived'].includes(String(m.payment_status||'').toLowerCase())){
         paymentCell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEAF8EF'}};
       }else{
         paymentCell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF7D6'}};
       }
       paymentCell.font={bold:true};

       // Embed profile QR, photo and signature.
       if(m.member_id_number||m.control_number){
         const qrData=await memberQrPngDataUrl(m,116);
         if(qrData){
           const qrImageId=workbook.addImage({base64:qrData,extension:'png'});
           ws.addImage(qrImageId,{
             tl:{col:28.08,row:rowNumber-0.92},
             ext:{width:90,height:90},
             editAs:'oneCell'
           });
           embeddedQrs++;
           row.getCell(29).value='';
         }
       }

       if(m.photo_url){
         const photoData=await imageUrlToPngDataUrl(m.photo_url);
         if(photoData){
           const photoId=workbook.addImage({base64:photoData,extension:'png'});
           ws.addImage(photoId,{
             tl:{col:26.08,row:rowNumber-0.92},
             ext:{width:82,height:100},
             editAs:'oneCell'
           });
           embeddedPhotos++;
           row.getCell(27).value='';
         }
       }

       if(m.member_signature_url){
         const signatureData=await imageUrlToPngDataUrl(m.member_signature_url);
         if(signatureData){
           const signatureId=workbook.addImage({base64:signatureData,extension:'png'});
           ws.addImage(signatureId,{
             tl:{col:29.08,row:rowNumber-0.76},
             ext:{width:115,height:65},
             editAs:'oneCell'
           });
           embeddedSignatures++;
           row.getCell(30).value='';
         }
       }

       row.eachCell({includeEmpty:true},cell=>{
         cell.border={
           top:{style:'hair',color:{argb:'FFDDE3EA'}},
           bottom:{style:'hair',color:{argb:'FFDDE3EA'}},
           left:{style:'hair',color:{argb:'FFDDE3EA'}},
           right:{style:'hair',color:{argb:'FFDDE3EA'}}
         };
         if(!cell.alignment)cell.alignment={vertical:'middle',wrapText:true};
       });

       rowNumber++;
     }

     ws.autoFilter=`A4:AH${Math.max(4,rowNumber-1)}`;

     ws.pageSetup={
       orientation:'landscape',
       fitToPage:true,
       fitToWidth:1,
       fitToHeight:0,
       paperSize:9,
       margins:{left:0.2,right:0.2,top:0.4,bottom:0.4,header:0.2,footer:0.2}
     };

     // Summary sheet for quick ID-processing management.
     const summary=workbook.addWorksheet('Summary');
     summary.columns=[
       {header:'Metric',key:'metric',width:34},
       {header:'Count',key:'count',width:16}
     ];
     const summaryRows=[
       ['Total National Records',members.length],
       ['Processing',members.filter(m=>m.status==='processing').length],
       ['Pending',members.filter(m=>m.status==='pending').length],
       ['Active',members.filter(m=>m.status==='active').length],
       ['Payment Pending',members.filter(m=>!['paid','waived'].includes(m.payment_status)).length],
       ['Profile QRs Embedded',embeddedQrs],
       ['Photos Embedded',embeddedPhotos],
       ['Signatures Embedded',embeddedSignatures],
       ['Missing Photos',members.filter(m=>!m.photo_url).length],
       ['Missing Signatures',members.filter(m=>!m.member_signature_url).length]
     ];
     summary.addRows(summaryRows);
     summary.getRow(1).font={bold:true,color:{argb:'FFFFFFFF'}};
     summary.getRow(1).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF08234D'}};
     summary.views=[{state:'frozen',ySplit:1}];
     summary.eachRow((row,rowIndex)=>{
       row.height=rowIndex===1?24:20;
       row.alignment={vertical:'middle'};
     });

     // By-region summary
     summary.getCell('D1').value='Region';
     summary.getCell('E1').value='Total';
     summary.getCell('F1').value='Processing';
     summary.getCell('G1').value='Active';
     for(const address of ['D1','E1','F1','G1']){
       const cell=summary.getCell(address);
       cell.font={bold:true,color:{argb:'FFFFFFFF'}};
       cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0B356C'}};
       cell.alignment={horizontal:'center',vertical:'middle'};
     }
     summary.getColumn('D').width=36;
     summary.getColumn('E').width=12;
     summary.getColumn('F').width=14;
     summary.getColumn('G').width=12;

     regions.forEach((r,index)=>{
       const rno=index+2;
       const rows=members.filter(m=>m.region_id===r.id);
       summary.getCell(`D${rno}`).value=`${r.code} — ${r.name}`;
       summary.getCell(`E${rno}`).value=rows.length;
       summary.getCell(`F${rno}`).value=rows.filter(m=>m.status==='processing').length;
       summary.getCell(`G${rno}`).value=rows.filter(m=>m.status==='active').length;
     });

     const buffer=await workbook.xlsx.writeBuffer();
     const blob=new Blob([buffer],{
       type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
     });
     const url=URL.createObjectURL(blob);
     const a=document.createElement('a');
     const stamp=new Date().toISOString().slice(0,10);
     a.href=url;
     a.download=`BAP_National_ID_Processing_${stamp}.xlsx`;
     document.body.appendChild(a);
     a.click();
     a.remove();
     setTimeout(()=>URL.revokeObjectURL(url),2500);

     const missedPhoto=members.filter(m=>m.photo_url).length-embeddedPhotos;
     const missedSignature=members.filter(m=>m.member_signature_url).length-embeddedSignatures;
     if(missedPhoto||missedSignature){
       alert(`Excel downloaded. ${embeddedQrs} QR codes, ${embeddedPhotos} photos and ${embeddedSignatures} signatures were embedded. Some image files could not be fetched; their original URLs are still included in the workbook.`);
     }
   }catch(error){
     console.error(error);
     alert(error?.message||'Could not generate the Excel ID Processing database.');
   }finally{
     setExportingExcel(false);
   }
 }

 function csvCell(value){
   const s=String(value??'');
   return `"${s.replaceAll('"','""')}"`;
 }
 function downloadRegionCsv(regionId){
   const region=regions.find(r=>r.id===regionId);
   const rows=members.filter(m=>m.region_id===regionId);
   const headers=['Form Code','Membership ID','Control Number','Full Name','Position','Region','Chapter','Mobile','Email','Status','Payment Status','Submitted','Issued','Valid Until'];
   const data=rows.map(m=>[
     m.application_form_code||'',
     m.member_id_number||'',
     m.control_number||'',
     m.full_name||'',
     m.positions?.name||m.designation||'',
     m.regions?.name||region?.name||'',
     m.chapter||'',
     m.phone||'',
     m.email||'',
     m.status||'',
     m.payment_status||'',
     m.application_submitted_at||'',
     m.issued_at||'',
     m.expires_at||''
   ]);
   const csv=[headers,...data].map(row=>row.map(csvCell).join(',')).join('\r\n');
   const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
   const url=URL.createObjectURL(blob);
   const a=document.createElement('a');
   a.href=url;
   a.download=`BAP-${region?.code||'REGION'}-Membership-Database.csv`;
   document.body.appendChild(a);
   a.click();
   a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),500);
 }

 async function confirmPayment(id){
   if(!window.confirm('Confirm that payment has been verified? The membership will be activated automatically and official ID numbers will be issued.'))return;
   const{error}=await supabase.rpc('confirm_member_payment',{p_member_id:id});
   if(error)return alert(error.message);
   alert('Payment verified. Membership activated automatically.');
   await load();
 }


 function openEditMember(member){
   setEditMember(member);
   setTab('edit-member');
   window.scrollTo({top:0,behavior:'smooth'});
 }

 async function saveMemberEdit(e){
   e.preventDefault();
   if(!editMember||editingMember)return;
   const form=e.currentTarget;
   const f=new FormData(form);
   setEditingMember(true);
   try{
     let photoUrl=editMember.photo_url||'';
     let signatureUrl=editMember.member_signature_url||'';
     const photo=f.get('photo');
     let signature=f.get('signature');
     const drawnSignatureData=String(f.get('signature_drawn')||'').trim();
     if(!(signature && signature.size) && drawnSignatureData){
       signature=await dataUrlToFile(drawnSignatureData, `member-signature-${editMember.id}.png`);
     }
     if(photo?.size)photoUrl=await upload(photo,`member-photo-${editMember.id}`);
     if(signature?.size)signatureUrl=await upload(signature,`member-signature-${editMember.id}`);

     const{error}=await supabase.rpc('admin_update_member_profile',{
       p_member_id:editMember.id,
       p_full_name:String(f.get('full_name')||'').trim(),
       p_position_id:String(f.get('position_id')||'')||null,
       p_region_id:String(f.get('region_id')||'')||null,
       p_chapter:String(f.get('chapter')||'').trim(),
       p_phone:String(f.get('phone')||'').trim(),
       p_email:String(f.get('email')||'').trim(),
       p_photo_url:photoUrl,
       p_member_signature_url:signatureUrl,
       p_emergency_name:String(f.get('emergency_name')||'').trim(),
       p_emergency_relationship:String(f.get('emergency_relationship')||'').trim(),
       p_emergency_mobile:String(f.get('emergency_mobile')||'').trim(),
       p_emergency_email:String(f.get('emergency_email')||'').trim(),
       p_payment_status:String(f.get('payment_status')||editMember.payment_status||'pending'),
       p_status:String(f.get('status')||editMember.status||'processing')
     });
     if(error)throw error;

     await load();
     setEditMember(null);
     setTab('members');
     alert('Member profile updated successfully.');
   }catch(error){
     alert(error?.message||'Could not update the member profile.');
   }finally{
     setEditingMember(false);
   }
 }

 async function deleteMemberRecord(member){
   const warning=member.user_id
     ? `Delete the membership record for ${member.full_name}? The Supabase login account will remain, but the membership record, application form, ID data, and membership history will be removed.`
     : `Permanently delete the membership record for ${member.full_name}? This cannot be undone.`;

   if(!window.confirm(warning))return;
   const typed=window.prompt(`Type DELETE to confirm permanent deletion of ${member.full_name}.`);
   if(typed!=='DELETE')return;

   const{error}=await supabase.rpc('admin_delete_member_profile',{p_member_id:member.id});
   if(error)return alert(error.message);

   if(editMember?.id===member.id)setEditMember(null);
   await load();
   setTab('members');
   alert('Membership record deleted.');
 }

 async function createMemberProfile(e){
   e.preventDefault();
   if(creating)return;
   const form=e.currentTarget;
   setCreating(true);
   const f=new FormData(form);
   try{
     const fullName=String(f.get('full_name')||'').trim();
     const regionId=String(f.get('region_id')||'').trim();
     const positionId=String(f.get('position_id')||'').trim();
     if(!fullName)throw new Error('Full name is required.');
     if(!regionId)throw new Error('Region is required.');

     let photoUrl='';
     let signatureUrl='';
     const photo=f.get('photo');
     let signature=f.get('signature');
     const drawnSignatureData=String(f.get('signature_drawn')||'').trim();
     if(!(signature && signature.size) && drawnSignatureData){
       signature=await dataUrlToFile(drawnSignatureData, `manual-signature-${Date.now()}.png`);
     }
     if(photo?.size)photoUrl=await upload(photo,`manual-photo-${Date.now()}`);
     if(signature?.size)signatureUrl=await upload(signature,`manual-signature-${Date.now()}`);

     const {data,error}=await supabase.rpc('create_manual_member',{
       p_full_name:fullName,
       p_position_id:positionId||null,
       p_designation:String(f.get('designation')||'').trim(),
       p_region_id:regionId,
       p_chapter:String(f.get('chapter')||'').trim(),
       p_phone:String(f.get('phone')||'').trim(),
       p_email:String(f.get('email')||'').trim(),
       p_photo_url:photoUrl,
       p_member_signature_url:signatureUrl,
       p_emergency_name:String(f.get('emergency_name')||'').trim(),
       p_emergency_relationship:String(f.get('emergency_relationship')||'').trim(),
       p_emergency_mobile:String(f.get('emergency_mobile')||'').trim(),
       p_emergency_email:String(f.get('emergency_email')||'').trim(),
       p_payment_status:String(f.get('payment_status')||'pending'),
       p_issue_now:f.get('issue_now')==='on'
     });
     if(error){
       if(error.code==='PGRST202'||String(error.message||'').includes('create_manual_member')){
         throw new Error('Master Create Profile RPC is not installed in Supabase. Run supabase/03_FIX_MASTER_CREATE_PROFILE_RPC.sql once, then refresh this page.');
       }
       throw error;
     }
     if(form && typeof form.reset==='function')form.reset();
     await load();
     setTab('members');
     alert(`Membership profile created successfully.${data?.control_number?` Control Number: ${data.control_number}`:''}`);
   }catch(error){
     alert(error?.message||'Unable to create membership profile.');
   }finally{
     setCreating(false);
   }
 }
 return <main className="page"><div className="master-dashboard-banner"><div><span className="master-badge">MASTER ACCESS</span><h2>National Master Administration</h2><p>Full national control of members, administrator access, positions, regions, signatories, payments, IDs and certificates.</p></div><img src={BAP_LOGO} alt="BAP logo"/></div>
 <Title eyebrow="National Administrator" title="National Membership Administration" subtitle="Master Access can create member profiles directly in the membership database and manage positions, regions, access, IDs and certificates."/>
 <section className="stats"><Stat label="Total Records" value={stats.total}/><Stat label="Pending" value={stats.pending}/><Stat label="Active Members" value={stats.active}/><Stat label="Active Positions" value={stats.positions}/></section>
 <div className="tabs master-module-tabs"><button className={tab==='members'?'active':''} onClick={()=>setTab('members')}>Membership Database</button><button className={tab==='leadership-posters'?'active':''} onClick={()=>setTab('leadership-posters')}>Commissioner & Director Posters</button><button className={tab==='id-format'?'active':''} onClick={()=>setTab('id-format')}>ID Format Manager</button><button className={tab==='certificate-generator'?'active':''} onClick={()=>setTab('certificate-generator')}>Certificate Generator</button><button className={tab==='regional-db'?'active':''} onClick={()=>{setTab('regional-db');if(!selectedRegionDb&&regions[0])setSelectedRegionDb(regions[0].id)}}>Regional Database</button><button className={tab==='create-profile'?'active':''} onClick={()=>setTab('create-profile')}>+ Create Profile</button><button className={tab==='email-notifications'?'active':''} onClick={()=>setTab('email-notifications')}>Email Notifications</button><button className={tab==='positions'?'active':''} onClick={()=>setTab('positions')}>Positions</button><button className={tab==='access'?'active':''} onClick={()=>setTab('access')}>User Access</button><button className={tab==='signatories'?'active':''} onClick={()=>setTab('signatories')}>Signatories & Regions</button></div>
 {tab==='members'&&<section className="panel"><div className="panel-heading"><div><h2>National Membership Database</h2><p><b>MASTER ACCESS ONLY.</b> Individual membership records are not available to Member or Regional Admin accounts.</p></div><div className="national-db-actions"><button className="btn btn-gold" disabled={exportingExcel||!members.length} onClick={downloadNationalIdProcessingExcel}>{exportingExcel?'Preparing Excel with Images...':'Download ID Processing Excel'}</button><button className="btn" onClick={()=>setTab('create-profile')}>+ Create Membership Profile</button></div></div><div className="national-excel-note"><b>Excel for ID Processing</b><span>Exports the complete National Membership Database with all member details plus embedded profile QR code, member photo and signature, image URLs, emergency information, payment/status data and ID/control numbers.</span></div><MemberTable members={members} refresh={load} confirmPayment={confirmPayment} onEdit={openEditMember} onDelete={deleteMemberRecord}/></section>}

 {tab==='leadership-posters'&&<section className="panel leadership-poster-panel one-click-poster-panel">
   <div className="panel-heading leadership-poster-heading">
     <div>
       <span className="master-badge">MASTER ACCESS ONLY</span>
       <h2>Poster Upload</h2>
       <p>Just select the finished poster image. No name, position, region, caption, or other fields are required. Once uploaded, it is automatically published to the public Posters page.</p>
     </div>
     <div className="leadership-poster-stats">
       <span><small>Total Posters</small><b>{leadershipPosters.length}</b></span>
       <span><small>Published</small><b>{leadershipPosters.filter(p=>p.active).length}</b></span>
     </div>
   </div>

   <form className="one-click-poster-upload" onSubmit={createLeadershipPoster}>
     <div className="one-click-poster-icon">+</div>
     <div className="one-click-poster-copy">
       <h3>Upload Finished Poster</h3>
       <p>PNG, JPG/JPEG, or WebP up to 12 MB. The image will be posted automatically.</p>
     </div>
     <label className="one-click-poster-file">
       <span>Select Poster Image</span>
       <input name="poster_image" type="file" accept="image/png,image/jpeg,image/webp" required/>
     </label>
     <button className="btn btn-gold" disabled={savingPoster}>{savingPoster?'Uploading & Publishing...':'Upload & Post Automatically'}</button>
   </form>

   <div className="leadership-poster-library-heading">
     <div><span className="eyebrow">Poster Library</span><h3>Uploaded Posters</h3><p>These images are already published on the public poster gallery.</p></div>
     <span>{leadershipPosters.length} poster{leadershipPosters.length===1?'':'s'}</span>
   </div>

   {leadershipPosters.length?<div className="leadership-poster-grid one-click-poster-grid">{leadershipPosters.map(item=><article className="leadership-poster-card one-click-poster-card" key={item.id}>
     <div className="leadership-poster-image-wrap">
       <img src={item.image_url} alt="Official leadership poster"/>
       <span className="auto-published-badge">PUBLISHED</span>
     </div>
     <div className="one-click-poster-actions">
       <a className="btn" href={item.image_url} target="_blank" rel="noreferrer">Open Poster</a>
       <button className="btn leadership-poster-delete" type="button" onClick={()=>deleteLeadershipPoster(item)}>Delete</button>
     </div>
   </article>)}</div>:<div className="leadership-poster-empty"><h3>No posters uploaded yet</h3><p>Select a finished poster image above and it will publish automatically.</p></div>}
 </section>}
 {tab==='id-format'&&<section className="panel id-format-manager-panel">
   <div className="panel-heading id-format-manager-heading">
     <div>
       <span className="master-badge">MASTER ACCESS ONLY</span>
       <h2>National Membership ID Format Manager</h2>
       <p>Upload the blank FRONT and BACK artwork that will be used by the Digital ID, public profile, Verify ID, and print view. Member information remains generated dynamically by the system.</p>
     </div>
     <img className="id-format-manager-logo" src={BAP_LOGO} alt="BAP logo"/>
   </div>

   <form className="id-format-upload-form" onSubmit={saveIdFormat}>
     <div className="id-format-upload-grid">
       <article className="id-format-upload-card">
         <div className="id-format-card-head"><b>FRONT ID FORMAT</b><small>{idTemplate?.front_url?'Uploaded format active':'Built-in format active'}</small></div>
         <div className="id-format-art-preview"><img src={idTemplate?.front_url||ID_FRONT} alt="Current ID front format"/></div>
         <label>Upload / Replace Front Format<input name="front_template" type="file" accept="image/png,image/jpeg,image/webp"/></label>
       </article>
       <article className="id-format-upload-card">
         <div className="id-format-card-head"><b>BACK ID FORMAT</b><small>{idTemplate?.back_url?'Uploaded format active':'Built-in format active'}</small></div>
         <div className="id-format-art-preview"><img src={idTemplate?.back_url||ID_BACK} alt="Current ID back format"/></div>
         <label>Upload / Replace Back Format<input name="back_template" type="file" accept="image/png,image/jpeg,image/webp"/></label>
       </article>
     </div>

     <div className="id-format-guidance">
       <b>Recommended ID artwork</b>
       <span>Landscape PVC / CR80 proportion (85.60 × 53.98 mm). Upload a clean blank PNG, JPG, or WebP up to 10 MB. The uploaded format should keep the photo box, member information lines, signature area, QR area, emergency fields, and signatory lines in approximately the same positions as your approved 2026 format.</span>
     </div>

     <div className="id-format-actions">
       <button type="button" className="btn" onClick={restoreBuiltInIdFormat} disabled={savingIdTemplate}>Restore Built-In Format</button>
       <button className="btn btn-gold" disabled={savingIdTemplate}>{savingIdTemplate?'Saving ID Format...':'Save & Activate ID Format'}</button>
     </div>
   </form>

   <div className="id-format-live-preview">
     <div className="id-format-preview-title"><span className="eyebrow">Live Overlay Preview</span><h3>Member information automatically fitted to the uploaded format</h3><p>The preview uses a current member when available. The QR remains dynamic and opens the member public profile.</p></div>
     <IdCard
       key={`${idTemplate?.front_url||'default'}-${idTemplate?.back_url||'default'}`}
       member={idFormatPreviewMember}
       commissioner={signatories.find(s=>s.slug==='national_commissioner')}
       president={signatories.find(s=>s.slug==='national_president')}
       vicePresident={signatories.find(s=>s.slug==='vice_president')}
     />
   </div>

   <div className="master-security-note">
     <b>Master-controlled ID artwork</b>
     <span>Only a verified <code>national_admin</code> account can upload or replace the active National Membership ID format.</span>
   </div>
 </section>}

 {tab==='certificate-generator'&&<section className="panel certificate-generator-panel">
   <div className="panel-heading certificate-generator-heading">
     <div>
       <span className="master-badge">MASTER ACCESS ONLY</span>
       <h2>Membership Certificate Generator</h2>
       <p>Search the National Membership Database, select a member, preview the official certificate, and open the protected print / PDF generator.</p>
     </div>
     <img className="certificate-generator-logo" src={BAP_LOGO} alt="BAP Technical Officials logo"/>
   </div>

   <div className="certificate-generator-filter">
     <label>Search Member
       <input value={certificateSearch} onChange={e=>setCertificateSearch(e.target.value)} placeholder="Name, Membership ID, Control No., Chapter or Position"/>
     </label>
     <label>Region
       <select value={certificateRegion} onChange={e=>setCertificateRegion(e.target.value)}>
         <option value="">All Regions</option>
         {regions.map(r=><option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}
       </select>
     </label>
     <label>Status
       <select value={certificateStatus} onChange={e=>setCertificateStatus(e.target.value)}>
         <option value="active">Active Members</option>
         <option value="processing">Processing</option>
         <option value="pending">Pending</option>
         <option value="expired">Expired</option>
         <option value="suspended">Suspended</option>
         <option value="rejected">Rejected</option>
         <option value="all">All Records</option>
       </select>
     </label>
   </div>

   <div className="certificate-generator-workspace">
     <div className="certificate-member-list">
       <div className="certificate-list-head"><b>{certificateCandidates.length} matching member{certificateCandidates.length===1?'':'s'}</b><small>Select a record to generate a certificate.</small></div>
       {certificateCandidates.slice(0,120).map(m=><button type="button" key={m.id} className={`certificate-member-option ${certificateMemberId===m.id?'selected':''}`} onClick={()=>setCertificateMemberId(m.id)}>
         <div className="certificate-member-thumb">{m.photo_url?<img src={m.photo_url} alt={m.full_name}/>:<span>{String(m.full_name||'?').slice(0,1)}</span>}</div>
         <div><b>{m.full_name}</b><small>{m.member_id_number||m.control_number||'ID not issued'} • {m.regions?.code||'No Region'}</small><small>{m.positions?.name||m.designation||'Member'} • {statusLabel(m.status)}</small></div>
       </button>)}
       {!certificateCandidates.length&&<div className="certificate-empty">No member matched your certificate search.</div>}
       {certificateCandidates.length>120&&<div className="certificate-list-limit">Showing the first 120 results. Refine the search to locate a specific member.</div>}
     </div>

     <div className="certificate-generator-preview-panel">
       {selectedCertificateMember?<>
         <div className="certificate-selected-summary">
           <div>
             <small>SELECTED MEMBER</small>
             <h3>{selectedCertificateMember.full_name}</h3>
             <p>{selectedCertificateMember.member_id_number||selectedCertificateMember.control_number||'ID not issued'} • {selectedCertificateMember.regions?.name||'No Region'}</p>
           </div>
           <span className={`status status-${selectedCertificateMember.status}`}>{statusLabel(selectedCertificateMember.status)}</span>
         </div>

         {selectedCertificateMember.status!=='active'&&<div className="certificate-generator-warning"><b>Preview only.</b><span>Official printing is available after the membership is active.</span></div>}

         <div className="certificate-generator-preview-scale">
           <Certificate
             member={selectedCertificateMember}
             commissioner={signatories.find(s=>s.slug==='national_commissioner')}
             president={signatories.find(s=>s.slug==='national_president')}
           />
         </div>

         <div className="certificate-generator-actions">
           <Link className="btn" to={memberProfilePath(selectedCertificateMember)}>Open Public Profile</Link>
           <Link className="btn btn-gold" to={`/print/certificate/${selectedCertificateMember.id}`}>{selectedCertificateMember.status==='active'?'Generate / Print Certificate':'Open Master Preview'}</Link>
         </div>
       </>:<div className="certificate-generator-placeholder">
         <img src={BAP_LOGO} alt="BAP logo"/>
         <h3>Select a member</h3>
         <p>The official certificate preview will appear here.</p>
       </div>}
     </div>
   </div>

   <div className="master-security-note certificate-generator-security">
     <b>Protected Master Module</b>
     <span>This generator is rendered only after the authenticated account is verified as <code>national_admin</code>.</span>
   </div>
 </section>}

 {tab==='regional-db'&&<section className="panel regional-database-panel">
   <div className="panel-heading">
     <div><h2>Membership Database by Region</h2><p><b>MASTER ACCESS ONLY.</b> Select a region to review and download its complete membership database.</p></div>
     <div className="regional-db-controls">
       <select value={selectedRegionDb} onChange={e=>setSelectedRegionDb(e.target.value)}>
         <option value="">Select Region</option>
         {regions.map(r=><option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}
       </select>
       <button className="btn btn-gold" disabled={!selectedRegionDb} onClick={()=>downloadRegionCsv(selectedRegionDb)}>Download Region CSV</button>
     </div>
   </div>
   {selectedRegionDb?<div className="regional-db-summary">
     <Stat label="Region Members" value={members.filter(m=>m.region_id===selectedRegionDb).length}/>
     <Stat label="Active" value={members.filter(m=>m.region_id===selectedRegionDb&&m.status==='active').length}/>
     <Stat label="Processing" value={members.filter(m=>m.region_id===selectedRegionDb&&m.status==='processing').length}/>
     <Stat label="Payment Pending" value={members.filter(m=>m.region_id===selectedRegionDb&&m.payment_status!=='paid'&&m.payment_status!=='waived').length}/>
   </div>:null}
   <MemberTable members={selectedRegionDb?members.filter(m=>m.region_id===selectedRegionDb):[]} refresh={load} confirmPayment={confirmPayment} onEdit={openEditMember} onDelete={deleteMemberRecord}/>
 </section>}
 {tab==='edit-member'&&editMember&&<section className="panel manual-profile-panel member-editor-panel">
   <div className="panel-heading">
     <div>
       <h2>Edit Membership Profile</h2>
       <p>Master Access can update official membership details. Form Code, Membership ID Number and Control Number remain system-generated and cannot be edited manually.</p>
     </div>
     <button className="btn" type="button" onClick={()=>{setEditMember(null);setTab('members')}}>Back to Database</button>
   </div>

   <div className="member-editor-identifiers">
     <div><small>Form Code</small><b>{editMember.application_form_code||'Not generated'}</b></div>
     <div><small>Membership ID</small><b>{editMember.member_id_number||'Not issued'}</b></div>
     <div><small>Control Number</small><b>{editMember.control_number||'Not issued'}</b></div>
     <div><small>Record Source</small><b>{editMember.source==='master_manual'?'Master Created':'Online Application'}</b></div>
   </div>

   <form className="manual-profile-form" onSubmit={saveMemberEdit}>
     <div className="form-section-title"><b>Official Member Information</b><span>Changes are saved directly to the national membership database.</span></div>
     <div className="form-grid three">
       <label>Full Name *<input name="full_name" defaultValue={editMember.full_name||''} required/></label>
       <label>Position *<select name="position_id" defaultValue={editMember.position_id||''} required><option value="">Select position</option>{positions.filter(p=>p.active||p.id===editMember.position_id).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
       <label>Region *<select name="region_id" defaultValue={editMember.region_id||''} required><option value="">Select region</option>{regions.map(r=><option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}</select></label>
       <label>Chapter<input name="chapter" defaultValue={editMember.chapter||''}/></label>
       <label>Mobile Number<input name="phone" defaultValue={editMember.phone||''}/></label>
       <label>Email Address<input name="email" type="email" defaultValue={editMember.email||''}/></label>
       <label>Membership Status<select name="status" defaultValue={editMember.status||'processing'}><option value="pending">Pending</option><option value="processing">Processing</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="expired">Expired</option><option value="rejected">Rejected</option></select></label>
       <label>Payment Status<select name="payment_status" defaultValue={editMember.payment_status||'pending'}><option value="pending">Pending</option><option value="paid">Paid</option><option value="waived">Waived</option></select></label>
     </div>

     <div className="form-section-title"><b>Photo & Signature</b><span>Leave file fields blank to keep the currently saved images.</span></div>
     <div className="current-media-grid">
       <div className="current-media-card"><small>Current Photo</small>{editMember.photo_url?<img className="current-member-photo" src={editMember.photo_url} alt="Current member"/>:<span>No photo saved</span>}</div>
       <div className="current-media-card"><small>Current Signature</small>{editMember.member_signature_url?<img className="current-member-signature" src={editMember.member_signature_url} alt="Current signature"/>:<span>No signature saved</span>}</div>
     </div>
     <div className="form-grid two">
       <label>Replace Member Photo<input name="photo" type="file" accept="image/png,image/jpeg,image/webp"/></label>
       <label>Replace Member Signature<input name="signature" type="file" accept="image/png,image/jpeg,image/webp"/></label>
       <SignaturePadField name="signature_drawn" existingUrl={editMember.member_signature_url||''} title="Draw Replacement Signature" subtitle="Use finger or mouse if you want to replace the saved signature without uploading a file." />
     </div>

     <div className="form-section-title"><b>Emergency Contact</b><span>Private administrative information.</span></div>
     <div className="form-grid two">
       <label>Emergency Contact Name<input name="emergency_name" defaultValue={editMember.emergency_name||''}/></label>
       <label>Relationship<input name="emergency_relationship" defaultValue={editMember.emergency_relationship||''}/></label>
       <label>Emergency Mobile<input name="emergency_mobile" defaultValue={editMember.emergency_mobile||''}/></label>
       <label>Emergency Email<input name="emergency_email" type="email" defaultValue={editMember.emergency_email||''}/></label>
     </div>

     <div className="member-editor-warning">
       <b>System-generated identifiers are protected.</b>
       <span>Editing a member will not change the Form Code, Membership ID Number, Control Number, issue date, or validity dates.</span>
     </div>

     <div className="form-actions member-edit-actions">
       <button type="button" className="btn danger-btn" onClick={()=>deleteMemberRecord(editMember)}>Delete Membership Record</button>
       <span className="action-spacer"/>
       <button type="button" className="btn" onClick={()=>{setEditMember(null);setTab('members')}}>Cancel</button>
       <button className="btn btn-gold" disabled={editingMember}>{editingMember?'Saving Changes...':'Save Member Changes'}</button>
     </div>
   </form>
 </section>}
 {tab==='create-profile'&&<section className="panel manual-profile-panel">
   <div className="panel-heading"><div><h2>Create Membership Profile</h2><p>Create a member directly from Master Access. An online login account is not required for manually created records.</p></div><button className="btn" type="button" onClick={()=>setTab('members')}>Back to Database</button></div>
   <form className="manual-profile-form" onSubmit={createMemberProfile}>
     <div className="form-section-title"><b>Official Member Information</b><span>Fields marked required will be used for ID and certificate records.</span></div>
     <div className="form-grid three">
       <label>Full Name *<input name="full_name" placeholder="Complete legal name" required/></label>
       <label>Position *<select name="position_id" required defaultValue=""><option value="">Select position</option>{positions.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
       <label>Custom Designation<input name="designation" placeholder="Optional additional title"/></label>
       <label>Region *<select name="region_id" required defaultValue=""><option value="">Select region</option>{regions.map(r=><option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}</select></label>
       <label>Chapter<input name="chapter" placeholder="Province / City / Chapter"/></label>
       <label>Mobile Number<input name="phone" placeholder="09xx xxx xxxx"/></label>
       <label>Email Address<input name="email" type="email" placeholder="member@example.com"/></label>
       <label>Payment Status<select name="payment_status" defaultValue="pending"><option value="pending">Pending</option><option value="paid">Paid</option><option value="waived">Waived</option></select></label>
       <label className="check-label issue-check"><input name="issue_now" type="checkbox"/> Payment already verified — activate membership immediately</label>
     </div>

     <div className="form-section-title"><b>Photo & Signature</b><span>Optional during initial encoding. They can be added later. Signature can be uploaded or drawn online.</span></div>
     <div className="form-grid two">
       <label>Member Photo<input name="photo" type="file" accept="image/*"/></label>
       <label>Member Signature<input name="signature" type="file" accept="image/*"/></label>
       <SignaturePadField name="signature_drawn" title="Draw Member Signature" subtitle="Capture the member signature directly on phone, tablet, or desktop." />
     </div>

     <div className="form-section-title"><b>Emergency Contact</b><span>Private administrative information; not shown on public verification.</span></div>
     <div className="form-grid two">
       <label>Emergency Contact Name<input name="emergency_name"/></label>
       <label>Relationship<input name="emergency_relationship"/></label>
       <label>Emergency Mobile<input name="emergency_mobile"/></label>
       <label>Emergency Email<input name="emergency_email" type="email"/></label>
     </div>

     <div className="fee-summary">
       <div><small>National ID / Membership</small><b>{money(700)}</b></div>
       <div><small>Accreditation / Licensing</small><b>{money(100)}</b></div>
       <div><small>Total</small><b>{money(800)}</b></div>
     </div>

     <div className="form-actions">
       <button type="button" className="btn" onClick={()=>setTab('members')}>Cancel</button>
       <button className="btn btn-gold" disabled={creating}>{creating?'Creating Profile...':'Create Membership Profile'}</button>
     </div>
   </form>
 </section>} 
 {tab==='email-notifications'&&<section className="panel email-notifications-panel">
   <div className="panel-heading">
     <div>
       <span className="master-badge">MASTER ACCESS ONLY</span>
       <h2>Automated Member Messages</h2>
       <p>Automatic emails are queued for new registration, ID ready/activation, and license expiry reminders at 30, 7, 1, and 0 days before expiration.</p>
     </div>
     <button className="btn btn-gold" type="button" disabled={runningEmailWorker} onClick={runEmailWorker}>{runningEmailWorker?'Sending Emails...':'Run Email Worker Now'}</button>
   </div>
   <div className="email-notification-stats">
     <span><small>Pending</small><b>{emailNotifications.filter(n=>n.status==='pending').length}</b></span>
     <span><small>Sent</small><b>{emailNotifications.filter(n=>n.status==='sent').length}</b></span>
     <span><small>Failed</small><b>{emailNotifications.filter(n=>n.status==='failed').length}</b></span>
     <span><small>Loaded</small><b>{emailNotifications.length}</b></span>
   </div>
   <div className="email-setup-note">
     <b>Automatic delivery setup</b>
     <span>Deploy the <code>member-email-notifications</code> Supabase Edge Function, configure the email provider secrets, then schedule the worker every 5 minutes. No email API key is stored in the website frontend.</span>
   </div>
   {emailNotifications.length?<div className="table-wrap"><table className="email-notifications-table"><thead><tr><th>Event</th><th>Recipient</th><th>Status</th><th>Attempts</th><th>Created</th><th>Sent</th></tr></thead><tbody>{emailNotifications.map(n=><tr key={n.id}><td><b>{String(n.event_type||'').replaceAll('_',' ').toUpperCase()}</b></td><td>{n.recipient_email||'—'}</td><td><span className={`status status-${n.status==='sent'?'active':n.status==='failed'?'rejected':'pending'}`}>{statusLabel(n.status)}</span>{n.last_error&&<small>{n.last_error}</small>}</td><td>{n.attempts||0}</td><td>{n.created_at?new Date(n.created_at).toLocaleString('en-PH'):'—'}</td><td>{n.sent_at?new Date(n.sent_at).toLocaleString('en-PH'):'—'}</td></tr>)}</tbody></table></div>:<div className="directory-empty"><h3>No email notifications yet</h3><p>Registration, ID release, expiry reminders, and expired-license messages will appear here automatically after V6.46 is installed.</p></div>}
 </section>}
 {tab==='positions'&&<section className="panel"><div className="panel-heading"><div><h2>Official Positions Database</h2><p>Add, edit, activate/deactivate, or remove positions shown in the Member Application.</p></div></div><form className="position-add-form" onSubmit={addPosition}><label>Position Name<input name="name" placeholder="e.g. Provincial Commissioner" required/></label><label>Category<input name="category" defaultValue="Membership"/></label><label>Sort Order<input name="sort_order" type="number" defaultValue="100"/></label><button className="btn btn-gold">Add Position</button></form><div className="position-grid">{positions.map(pos=><form className="position-card" key={pos.id} onSubmit={e=>savePosition(e,pos)}><label>Position Name<input name="name" defaultValue={pos.name} required/></label><label>Category<input name="category" defaultValue={pos.category||'Membership'}/></label><label>Sort Order<input name="sort_order" type="number" defaultValue={pos.sort_order||100}/></label><label className="check-label"><input name="active" type="checkbox" defaultChecked={pos.active}/> Active / available to applicants</label><div className="mini-actions"><button className="mini-btn gold">Save</button><button type="button" className="mini-btn danger" onClick={()=>deletePosition(pos)}>Delete</button></div></form>)}</div></section>}
 {tab==='access'&&<section className="panel"><h2>National / Regional Admin Access</h2><div className="table-wrap"><table><thead><tr><th>User</th><th>Current Role</th><th>Assigned Region</th><th>Change Access</th></tr></thead><tbody>{profiles.map(p=><tr key={p.id}><td><b>{p.full_name||'—'}</b><small>{p.email||'—'}</small></td><td>{p.role}</td><td>{p.regions?.name||'—'}</td><td><AccessEditor profile={p} regions={regions} save={setAccess}/></td></tr>)}</tbody></table></div></section>}
 {tab==='signatories'&&<><section className="panel"><div className="panel-heading"><div><h2>National Certificate Signatories</h2><p>Upload PNG, JPG/JPEG, or WebP. Transparent PNG is recommended for signatures.</p></div></div><div className="settings-grid">{signatories.map(s=><form key={s.slug} className="setting-card signature-setting-card" onSubmit={e=>saveSignatory(e,s)}><h3>{s.title}</h3>{s.signature_url?<div className="signature-preview"><img src={s.signature_url} alt={`${s.name} signature`}/><small>Current saved signature</small></div>:<div className="signature-preview empty"><span>No signature uploaded</span></div>}<label>Name<input name="name" defaultValue={s.name} required/></label><label>Replace / Upload Signature<input name="signature" type="file" accept="image/png,image/jpeg,image/webp"/></label><button className="btn btn-gold">Save Signature</button></form>)}</div></section><section className="panel"><div className="panel-heading"><div><h2>Regional Directors</h2><p>Each region can have its own director name and signature for membership certificates.</p></div></div><div className="region-grid">{regions.map(r=><form key={r.id} className="region-card signature-region-card" onSubmit={e=>saveRegion(e,r)}><b>{r.code} — {r.name}</b>{r.regional_director_signature_url?<div className="signature-preview region-signature-preview"><img src={r.regional_director_signature_url} alt={`${r.code} regional director signature`}/><small>Current saved signature</small></div>:<div className="signature-preview empty"><span>No signature uploaded</span></div>}<label>Regional Director<input name="director" defaultValue={r.regional_director_name||''}/></label><label>Replace / Upload Signature<input name="signature" type="file" accept="image/png,image/jpeg,image/webp"/></label><button className="btn">Save Region Signature</button></form>)}</div></section></>}
 </main>;
}
function RegionalAdmin({session}){
 const[profile,setProfile]=useState(undefined);
 const[summary,setSummary]=useState(undefined);

 useEffect(()=>{
   if(!session)return;
   async function load(){
     const{data:me,error:profileError}=await supabase
       .from('profiles')
       .select('id,role,region_id,regions(*)')
       .eq('id',session.user.id)
       .single();

     if(profileError){
       setProfile(null);
       setSummary(null);
       return;
     }

     setProfile(me||null);

     if(me?.role==='regional_admin'){
       const{data,error}=await supabase.rpc('get_my_regional_admin_summary');
       if(error){
         console.error(error);
         setSummary(null);
       }else{
         setSummary(Array.isArray(data)?data[0]:data);
       }
     }else{
       setSummary(null);
     }
   }
   load();
 },[session]);

 if(session===undefined||profile===undefined||summary===undefined)return <Loading/>;
 if(!session)return <Navigate to="/login"/>;
 if(profile?.role!=='regional_admin')return <Denied/>;

 return <main className="page regional-summary-only">
   <Title
     eyebrow="Regional Administrator"
     title={summary?.region_name||profile.regions?.name||'Assigned Region'}
     subtitle="Regional Admin access is limited to aggregate regional statistics. Individual member records and the Master membership databases are restricted to National Master Access."
   />

   <section className="stats">
     <Stat label="Regional Records" value={Number(summary?.total_members||0)}/>
     <Stat label="Processing" value={Number(summary?.processing_members||0)}/>
     <Stat label="Active" value={Number(summary?.active_members||0)}/>
     <Stat label="Paid" value={Number(summary?.paid_members||0)}/>
   </section>

   <section className="panel restricted-regional-panel">
     <div className="restricted-access-icon">🔒</div>
     <div>
       <h2>Individual Membership Database Restricted</h2>
       <p>Regional Administrators cannot view member names, application forms, personal information, National IDs, certificates, or downloadable regional member databases.</p>
       <p>Full National and Regional membership databases are available only through <b>National Master Access</b>.</p>
     </div>
   </section>
 </main>;
}

function MemberTable({members,refresh,confirmPayment,onEdit,onDelete}){
 const[busy,setBusy]=useState('');
 const[open,setOpen]=useState('');
 const[selected,setSelected]=useState([]);
 const[assetMode,setAssetMode]=useState('all');
 const[downloadingAssets,setDownloadingAssets]=useState(false);
 const[downloadProgress,setDownloadProgress]=useState('');

 const selectableMembers=members.filter(m=>m.member_id_number);
 const selectedMembers=members.filter(m=>selected.includes(m.id));
 const allSelectableChecked=selectableMembers.length>0&&selectableMembers.every(m=>selected.includes(m.id));

 useEffect(()=>{
   const validIds=new Set(members.map(m=>m.id));
   setSelected(current=>current.filter(id=>validIds.has(id)));
 },[members]);

 async function update(id,values){
   setBusy(id);
   const{error}=await supabase.from('members').update(values).eq('id',id);
   if(error)alert(error.message);
   setBusy('');
   refresh();
 }

 async function rpc(name,id){
   setBusy(id);
   const{error}=await supabase.rpc(name,{p_member_id:id});
   if(error)alert(error.message);
   setBusy('');
   refresh();
 }

 function toggleMember(id){
   setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);
 }

 function toggleAll(){
   if(allSelectableChecked){
     const selectableIds=new Set(selectableMembers.map(m=>m.id));
     setSelected(current=>current.filter(id=>!selectableIds.has(id)));
   }else{
     setSelected(current=>Array.from(new Set([...current,...selectableMembers.map(m=>m.id)])));
   }
 }

 async function downloadSelectedAssets(){
   if(!selectedMembers.length)return alert('Select one or more member profiles first.');
   setDownloadingAssets(true);
   setDownloadProgress('Preparing files...');
   try{
     await buildMemberAssetZip(selectedMembers,assetMode,(done,total)=>setDownloadProgress(`Preparing ${done} of ${total} member${total===1?'':'s'}...`));
   }catch(error){
     alert(error?.message||'Unable to prepare member asset download.');
   }finally{
     setDownloadingAssets(false);
     setDownloadProgress('');
   }
 }

 return <div className="membership-db-assets-module">
   <div className="member-assets-toolbar">
     <div className="member-assets-toolbar-copy">
       <b>Member Asset Downloads</b>
       <span>Select member profiles, choose the file type, then download. Each file uses the issued BAP Membership ID Number as its filename.</span>
     </div>
     <div className="member-assets-controls">
       <span className="selected-count">{selectedMembers.length} selected</span>
       <select value={assetMode} onChange={e=>setAssetMode(e.target.value)} aria-label="Select member asset type">
         <option value="all">All: Photo + QR + Signature</option>
         <option value="photo">Photo only</option>
         <option value="qr">QR Code only</option>
         <option value="signature">Signature only</option>
       </select>
       <button className="btn btn-gold" type="button" disabled={!selectedMembers.length||downloadingAssets} onClick={downloadSelectedAssets}>
         {downloadingAssets?(downloadProgress||'Preparing Download...'):'Download Selected'}
       </button>
       {!!selected.length&&<button className="btn" type="button" disabled={downloadingAssets} onClick={()=>setSelected([])}>Clear Selection</button>}
     </div>
   </div>

   <div className="member-assets-naming-note">
     <b>File naming:</b>
     <span>BAP-NCR-2026-000001_PHOTO.jpg</span>
     <span>BAP-NCR-2026-000001_QR.png</span>
     <span>BAP-NCR-2026-000001_SIGNATURE.png</span>
   </div>

   <div className="table-wrap membership-db-wrap"><table>
     <thead><tr><th className="member-select-cell"><input type="checkbox" checked={allSelectableChecked} onChange={toggleAll} aria-label="Select all members with Membership IDs"/></th><th>Member</th><th>Form / ID Numbers</th><th>Region / Chapter</th><th>Source</th><th>Status</th><th>Payment</th><th>Valid Until</th><th>Actions</th></tr></thead>
     <tbody>
     {members.map(m=><React.Fragment key={m.id}>
       <tr className={selected.includes(m.id)?'member-row-selected':''}>
         <td className="member-select-cell"><input type="checkbox" checked={selected.includes(m.id)} disabled={!m.member_id_number} onChange={()=>toggleMember(m.id)} aria-label={`Select ${m.full_name}`}/></td>
         <td><b>{m.full_name}</b><small>{m.positions?.name||m.designation||'—'}</small><small>{m.email||m.phone||'No contact entered'}</small></td>
         <td><b>{m.application_form_code||'Draft'}</b><small>ID: {m.member_id_number||'Not issued'}</small><small>Control: {m.control_number||'Not issued'}</small></td>
         <td>{m.regions?.code||'—'}<small>{m.chapter||'—'}</small></td>
         <td><span className="source-badge">{m.source==='master_manual'?'MASTER CREATED':'ONLINE'}</span></td>
         <td><span className={`status status-${m.status}`}>{statusLabel(m.status)}</span></td>
         <td>{money(Number(m.membership_fee)+Number(m.accreditation_fee))}<small>{statusLabel(m.payment_status)}</small></td>
         <td>{fmtDate(m.expires_at)}<small>ID Release: {statusLabel(m.id_release_status||'not_ready')}</small></td>
         <td><div className="mini-actions">
           <button className="mini-btn" type="button" onClick={()=>setOpen(open===m.id?'':m.id)}>{open===m.id?'Close':'Profile'}</button>
           {onEdit&&<button className="mini-btn" type="button" onClick={()=>onEdit(m)}>Edit</button>}
           {onDelete&&<button className="mini-btn danger" type="button" onClick={()=>onDelete(m)}>Delete</button>}
           {m.application_form_code&&m.status!=='active'&&m.payment_status!=='paid'&&m.payment_status!=='waived'&&confirmPayment&&<button className="mini-btn gold" disabled={!!busy} onClick={()=>confirmPayment(m.id)}>Confirm Payment & Activate</button>}
           {m.application_form_code&&m.status!=='active'&&m.payment_status==='waived'&&confirmPayment&&<button className="mini-btn gold" disabled={!!busy} onClick={()=>confirmPayment(m.id)}>Activate Waived</button>}
           {m.status==='active'&&<button className="mini-btn" disabled={!!busy} onClick={()=>rpc('renew_member',m.id)}>Renew</button>}
           {m.status==='active'&&m.member_id_number&&(m.id_release_status||'not_ready')==='not_ready'&&<button className="mini-btn gold" disabled={!!busy} onClick={()=>rpc('mark_id_ready_for_release',m.id)}>ID Ready for Release</button>}
           {m.status==='active'&&m.member_id_number&&m.id_release_status==='ready'&&<button className="mini-btn" disabled={!!busy} onClick={()=>rpc('mark_id_released',m.id)}>Mark ID Released</button>}
           {m.status==='active'&&<button className="mini-btn danger" disabled={!!busy} onClick={()=>update(m.id,{status:'suspended'})}>Suspend</button>}
           {m.application_form_code&&<Link className="mini-btn" to={`/application-form/${m.id}`}>Application Form</Link>}
           <Link className="mini-btn view-doc-btn" to={`/print/id/${m.id}`}>View ID</Link>
           <Link className="mini-btn view-doc-btn" to={`/print/certificate/${m.id}`}>View Certificate</Link>
         </div></td>
       </tr>
       {open===m.id&&<tr className="profile-detail-row"><td colSpan="9"><div className="profile-detail-card">
         <div className="profile-detail-photo">{m.photo_url?<img src={m.photo_url} alt="Member"/>:<span>No Photo</span>}</div>
         <div className="profile-detail-grid">
           <div><small>Full Name</small><b>{m.full_name||'—'}</b></div>
           <div><small>Position</small><b>{m.positions?.name||m.designation||'—'}</b></div>
           <div><small>Form Code</small><b>{m.application_form_code||'Draft'}</b></div>
           <div><small>Submitted</small><b>{fmtDate(m.application_submitted_at)}</b></div>
           <div><small>Email</small><b>{m.email||'—'}</b></div>
           <div><small>Mobile</small><b>{m.phone||'—'}</b></div>
           <div><small>Region</small><b>{m.regions?.name||'—'}</b></div>
           <div><small>Chapter</small><b>{m.chapter||'—'}</b></div>
           <div><small>Emergency Contact</small><b>{m.emergency_name||'—'}</b></div>
           <div><small>Emergency Mobile</small><b>{m.emergency_mobile||'—'}</b></div>
           <div><small>Unique ID No.</small><b>{m.member_id_number||'Not issued'}</b></div>
           <div><small>Control No.</small><b>{m.control_number||'Not issued'}</b></div>
           <div><small>ID Release Status</small><b>{statusLabel(m.id_release_status||'not_ready')}</b></div>
           <div><small>ID Ready for Release</small><b>{fmtDate(m.id_ready_for_release_at)}</b></div>
           <div><small>ID Released</small><b>{fmtDate(m.id_released_at)}</b></div>
           <div><small>Record Source</small><b>{m.source==='master_manual'?'Created by Master Access':'Online Registration'}</b></div>
           <div><small>Created</small><b>{fmtDate(m.created_at)}</b></div>
         </div>
         <div className="profile-asset-downloads">
           <div><b>Download Member Files</b><small>Files are named using {m.member_id_number||'the issued Membership ID Number'}.</small></div>
           <button className="mini-btn" type="button" disabled={!m.member_id_number||!m.photo_url} onClick={()=>downloadMemberAsset(m,'photo')}>Download Photo</button>
           <button className="mini-btn gold" type="button" disabled={!m.member_id_number} onClick={()=>downloadMemberAsset(m,'qr')}>Download QR PNG</button>
           <button className="mini-btn" type="button" disabled={!m.member_id_number||!m.member_signature_url} onClick={()=>downloadMemberAsset(m,'signature')}>Download Signature</button>
         </div>
       </div></td></tr>}
     </React.Fragment>)}
     {!members.length&&<tr><td colSpan="9">No member records found.</td></tr>}
     </tbody>
   </table></div>
 </div>;
}

function AccessEditor({profile,regions,save}){const[role,setRole]=useState(profile.role||'member');const[region,setRegion]=useState(profile.region_id||'');return <div className="access-editor"><select value={role} onChange={e=>setRole(e.target.value)}><option value="member">Member</option><option value="regional_admin">Regional Admin</option><option value="national_admin">National Admin</option></select>{role==='regional_admin'&&<select value={region} onChange={e=>setRegion(e.target.value)}><option value="">Select region</option>{regions.map(r=><option key={r.id} value={r.id}>{r.code}</option>)}</select>}<button className="mini-btn gold" onClick={()=>save(profile.id,role,region)}>Save</button></div>}
function Lookup(){const nav=useNavigate();const[value,setValue]=useState('');const[scanning,setScanning]=useState(false);const[msg,setMsg]=useState('');const scannerRef=useRef(null);function go(raw){const target=resolveLookupTarget(raw);if(!target)return setMsg('Enter or scan a valid Membership ID Number or Control Number.');nav(target);}async function start(){setMsg('');setScanning(true);try{const{Html5Qrcode}=await import('html5-qrcode');const scanner=new Html5Qrcode('bap-reader');scannerRef.current=scanner;await scanner.start({facingMode:'environment'},{fps:10,qrbox:{width:250,height:250}},async txt=>{try{await scanner.stop();}catch{}setScanning(false);go(txt);},()=>{});}catch{setScanning(false);setMsg('Camera scanning could not start. Enter the Membership ID Number or Control Number manually.');}}async function stop(){if(scannerRef.current){try{await scannerRef.current.stop();}catch{}scannerRef.current=null;}setScanning(false);}return <main className="narrow page"><Title eyebrow="Membership Verification" title="Search or Scan Member" subtitle="Use the same search field for Membership ID Number or Control Number, or scan the official member QR code from the ID or Profile page."/><div className="lookup-card"><form onSubmit={e=>{e.preventDefault();go(value)}}><label>Membership ID Number / Control Number<input value={value} onChange={e=>setValue(e.target.value)} placeholder="Example: BAP-NCR-2026-000001 or BAP-NTO-NCR-2026-000001" autoComplete="off"/></label><button className="btn btn-gold">View Member Profile</button></form><div className="lookup-or"><span>OR</span></div><button className="btn" onClick={scanning?stop:start}>{scanning?'Stop QR Scanner':'Scan QR Code'}</button><div id="bap-reader" className={scanning?'scanner visible':'scanner'}></div>{msg&&<p className="notice">{msg}</p>}</div></main>}

function PublicMemberProfile(){
 const{identifier}=useParams();
 const[record,setRecord]=useState();
 useEffect(()=>{
   async function load(){
     const{data,error}=await supabase.rpc('get_public_member_profile',{
       p_identifier:decodeURIComponent(identifier)
     });
     if(error){
       console.error(error);
       setRecord(null);
       return;
     }
     setRecord(Array.isArray(data)?data[0]||null:null);
   }
   load();
 },[identifier]);

 if(record===undefined)return <Loading/>;
 if(!record)return <main className="narrow page"><div className="verification invalid">
   <span className="eyebrow">Official National Registry</span>
   <h1>MEMBERSHIP PROFILE NOT FOUND</h1>
   <p>The scanned QR code or membership number is not in the official registry.</p>
   <Link className="btn" to="/lookup">Verify Another ID</Link>
 </div></main>;

 const active=record.status==='active'&&record.expires_at&&new Date(record.expires_at)>=new Date();
 const member={
   ...record,
   regions:{
     name:record.region_name,
     code:record.region_code,
     regional_director_name:record.regional_director_name,
     regional_director_signature_url:record.regional_director_signature_url
   }
 };

 return <main className="public-profile-page">
   <section className={`public-profile-hero ${active?'valid':'invalid'}`}>
     <div className="public-profile-logo"><img src={BAP_LOGO} alt="BAP logo"/></div>
     <div className="public-profile-heading">
       <span className="eyebrow">Basketball Association of the Philippines</span>
       <h1>Official Membership Profile</h1>
       <p className="registry-note">National Membership • Accreditation • Licensing Registry • Public Verification — No Login Required</p>
     </div>
     <div className={`profile-validity ${active?'valid':'invalid'}`}>
       {active?'VERIFIED • ACTIVE':'NOT CURRENTLY VALID'}
     </div>
   </section>

   <section className="public-member-card">
     <div className="public-member-photo">
       {record.photo_url?<img src={record.photo_url} alt={`${record.full_name} membership photo`}/>:<div className="photo-placeholder">NO PHOTO</div>}
     </div>
     <div className="public-member-primary">
       <small>MEMBER NAME</small>
       <h2>{record.full_name}</h2>
       <p>{record.designation||'—'}</p>
       <div className="public-id-pills">
         <span><small>UNIQUE ID NO.</small><b>{record.member_id_number||'Pending'}</b></span>
         <span><small>CONTROL NO.</small><b>{record.control_number||'Pending'}</b></span>
       </div>
       {(record.member_id_number||record.control_number)&&<div className="public-profile-qr-box">
         <div className="public-profile-qr-card">
           <MemberProfileQr member={record} size={144}/>
         </div>
         <div className="public-profile-qr-text">
           <b>Official Profile QR Code • Same QR used on the ID</b>
           <span>This QR code uses the exact same official QR destination as the member’s Digital ID, so scanning either one opens the same public member profile directly on the official public site. No member sign-in is required.</span>
         </div>
       </div>}
     </div>
   </section>

   <section className="public-profile-grid">
     <article><small>Region</small><b>{record.region_name||'—'}</b></article>
     <article><small>Chapter</small><b>{record.chapter||'—'}</b></article>
     <article><small>Status</small><b>{statusLabel(record.status)}</b></article>
     <article><small>Date Issued</small><b>{fmtDate(record.issued_at)}</b></article>
     <article><small>Valid Until</small><b>{fmtDate(record.expires_at)}</b></article>
     <article><small>Registry Check</small><b>{active?'Valid & Active':'Review Required'}</b></article>
   </section>

   <section className="public-profile-actions">
     <Link className="btn" to="/lookup">Scan / Verify Another ID</Link>
   </section>

   <section className="public-profile-document">
     <div className="panel-heading"><div><h2>Digital National Membership ID</h2><p>This digital ID is generated from the official membership database.</p></div></div>
     <IdCard member={member} showBack={false}/>
   </section>

   <section className="public-profile-privacy">
     <b>Public Verification Profile — No Sign-In Required</b>
     <span>This profile is intentionally public for QR verification. Anyone scanning the official member QR can open this page directly without a Member login or Vercel account. Only official public membership information is displayed; private contact and emergency information remain hidden.</span>
   </section>
 </main>;
}

function Verify(){const{control}=useParams();const[record,setRecord]=useState();const[sigs,setSigs]=useState([]);useEffect(()=>{async function load(){const[v,s]=await Promise.all([supabase.rpc('verify_member',{p_control_no:decodeURIComponent(control)}),supabase.from('signatories').select('*')]);setRecord(Array.isArray(v.data)?v.data[0]||null:null);setSigs(s.data||[]);}load();},[control]);if(record===undefined)return <Loading/>;if(!record)return <main className="narrow page"><div className="verification invalid"><h1>MEMBERSHIP NOT FOUND</h1><p>The National ID/control number is not in the official registry.</p></div></main>;const active=record.status==='active'&&record.expires_at&&new Date(record.expires_at)>=new Date();const member={...record,regions:{name:record.region_name,code:record.region_code,regional_director_name:record.regional_director_name,regional_director_signature_url:record.regional_director_signature_url}};return <main className="verify-page"><section className={`verification ${active?'valid':'invalid'}`}><span className="eyebrow">Official National Registry</span><h1>{active?'VALID & ACTIVE MEMBER':'MEMBERSHIP NOT CURRENTLY VALID'}</h1><div className="verified-person">{record.photo_url&&<img src={record.photo_url}/>}<div><h2>{record.full_name}</h2><p><b>Unique ID No.</b> {record.member_id_number||'Pending'}</p><p><b>Control No.</b> {record.control_number||'Pending'}</p><p>{record.designation||'—'} • {record.region_name||'—'} • {record.chapter||'—'}</p><p>Status: <b>{statusLabel(record.status)}</b> • Valid until: <b>{fmtDate(record.expires_at)}</b></p></div></div></section><section className="public-doc"><h2>Digital National Membership ID</h2><IdCard member={member} showBack={false}/></section><section className="public-doc"><h2>Membership Certificate</h2><Certificate member={member} commissioner={sigs.find(s=>s.slug==='national_commissioner')} president={sigs.find(s=>s.slug==='national_president')}/></section></main>}
function PrintId({session}){
 const{id}=useParams();
 const[member,setMember]=useState();
 const[sigs,setSigs]=useState([]);
 const[profile,setProfile]=useState();
 useEffect(()=>{
   if(!session)return;
   Promise.all([
     supabase.from('members').select('*,regions(*),positions(*)').eq('id',id).single(),
     supabase.from('signatories').select('*').order('slug'),
     supabase.from('profiles').select('role,region_id').eq('id',session.user.id).single()
   ]).then(([m,s,p])=>{
     setMember(m.data||null);
     setSigs(s.data||[]);
     setProfile(p.data||null);
   });
 },[session,id]);

 if(session===undefined||member===undefined||profile===undefined)return <Loading/>;
 if(!session)return <Navigate to="/login"/>;

 const isMaster=profile?.role==='national_admin';
 const isOwner=!!member&&member.user_id===session.user.id&&profile?.role==='member';
 const canView=!!member&&(isMaster||(isOwner&&member.status==='active'));
 if(!canView)return <Denied/>;

 const isPreview=member.status!=='active';

 return <main className="print-page">
   <div className="print-toolbar no-print">
     <div>
       <b>{isPreview?'Master Preview — National Membership ID':'National Membership ID'}</b>
       <small>{isPreview?'Preview only. Approve the member before official printing.':'Print at 100% scale with background graphics enabled.'}</small>
     </div>
     <div className="print-toolbar-actions">
       {isMaster&&<Link className="btn" to="/master-access">Back to Master Access</Link>}
       {!isPreview&&<button className="btn btn-gold" onClick={()=>window.print()}>Print ID / Save PDF</button>}
     </div>
   </div>
   {isPreview&&<div className="master-preview-banner no-print">MASTER ADMIN PREVIEW • NOT YET AN ACTIVE MEMBERSHIP</div>}
   <div className={isPreview?'document-preview pending-preview':''}>
     <IdCard
       member={member}
       commissioner={sigs.find(s=>s.slug==='national_commissioner')}
       president={sigs.find(s=>s.slug==='national_president')}
       vicePresident={sigs.find(s=>s.slug==='vice_president')}
     />
   </div>
 </main>;
}

function PrintCertificate({session}){
 const{id}=useParams();
 const[member,setMember]=useState();
 const[sigs,setSigs]=useState([]);
 const[profile,setProfile]=useState();
 useEffect(()=>{
   if(!session)return;
   Promise.all([
     supabase.from('members').select('*,regions(*),positions(*)').eq('id',id).single(),
     supabase.from('signatories').select('*'),
     supabase.from('profiles').select('role,region_id').eq('id',session.user.id).single()
   ]).then(([m,s,p])=>{
     setMember(m.data||null);
     setSigs(s.data||[]);
     setProfile(p.data||null);
   });
 },[session,id]);

 if(session===undefined||member===undefined||profile===undefined)return <Loading/>;
 if(!session)return <Navigate to="/login"/>;

 const isMaster=profile?.role==='national_admin';
 const isOwner=!!member&&member.user_id===session.user.id&&profile?.role==='member';
 const canView=!!member&&(isMaster||(isOwner&&member.status==='active'));
 if(!canView)return <Denied/>;

 const isPreview=member.status!=='active';

 return <main className="print-page">
   <div className="print-toolbar no-print">
     <div>
       <b>{isPreview?'Master Preview — Membership Certificate':'Executive Membership Certificate'}</b>
       <small>{isPreview?'Preview only. Approve the member before official printing.':'A4 landscape • Print at 100% scale.'}</small>
     </div>
     <div className="print-toolbar-actions">
       {isMaster&&<Link className="btn" to="/master-access">Back to Master Access</Link>}
       {!isPreview&&<button className="btn btn-gold" onClick={()=>window.print()}>Print Certificate / Save PDF</button>}
     </div>
   </div>
   {isPreview&&<div className="master-preview-banner no-print">MASTER ADMIN PREVIEW • NOT YET AN ACTIVE MEMBERSHIP</div>}
   <div className={isPreview?'document-preview pending-preview':''}>
     <Certificate member={member} commissioner={sigs.find(s=>s.slug==='national_commissioner')} president={sigs.find(s=>s.slug==='national_president')}/>
   </div>
 </main>;
}

function IdCard({member,showBack=true,commissioner,president,vicePresident}){
 const qrValue=memberQrValue(member);
 const uniqueId=memberUniqueId(member);
 const activeIdTemplate=useActiveIdTemplate();
 const frontTemplate=activeIdTemplate?.front_url||ID_FRONT;
 const backTemplate=activeIdTemplate?.back_url||ID_BACK;
 const customFront=Boolean(activeIdTemplate?.front_url);
 const customBack=Boolean(activeIdTemplate?.back_url);

 const backSignatories=[
   {
     key:'commissioner',
     name:commissioner?.name||'ENGELBERT F. FORTIN',
     title:commissioner?.title||'National Commissioner',
     signature:commissioner?.signature_url||''
   },
   {
     key:'president',
     name:president?.name||'GIL S. REGLO',
     title:president?.title||'National President',
     signature:president?.signature_url||''
   },
   {
     key:'vice-president',
     name:vicePresident?.name||'ELENO M. RIVERO JR.',
     title:vicePresident?.title||'Vice President',
     signature:vicePresident?.signature_url||''
   }
 ];

 return <div className="id-stack">
   <section className={`id-card id-card-v636 ${customFront?'id-card-custom-front':''}`}>
     <img className="id-template" src={frontTemplate}/>
     <div className="id-v636-clean-fields" aria-hidden="true"></div>
     <div className="id-v636-hologram" aria-hidden="true">
       <img className="id-holo-logo id-holo-logo-1" src={BAP_LOGO}/>
       <img className="id-holo-logo id-holo-logo-2" src={BAP_LOGO}/>
       <span className="id-holo-band"></span>
       <span className="id-holo-seal">BAP • VERIFIED • BAP • VERIFIED • BAP</span>
     </div>
     {member.photo_url&&<img className="id-photo" src={member.photo_url}/>}
     <div className="id-value id-fullname">{String(member.full_name||'MEMBER NAME').toUpperCase()}</div>
     <div className="id-value id-designation">{member.positions?.name||member.designation||'—'}</div>
     <div className="id-value id-region">{member.regions?.name||member.region_name||'—'}</div>
     <div className="id-value id-chapter">{member.chapter||'—'}</div>
     <div className="id-value id-number">{uniqueId}</div>
     <div className="id-value id-issued">{fmtDate(member.issued_at)}</div>
     <div className="id-value id-expiration">{fmtDate(member.expires_at)}</div>
     <div className="id-mini-meta">Control No. {member.control_number||'Pending'}</div>
     {member.member_signature_url?<img className="id-member-signature" src={member.member_signature_url}/>:<div className="id-typed-signature">{member.full_name}</div>}
     <div className="id-qr"><MemberProfileQr member={member} size={82}/></div>
   </section>

   {showBack&&<section className={`id-card id-card-back ${customBack?'id-card-custom-back':''}`}>
     <img className="id-template" src={backTemplate}/>
     <div className="back-value back-name">{member.emergency_name||'—'}</div>
     <div className="back-value back-relationship">{member.emergency_relationship||'—'}</div>
     <div className="back-value back-mobile">{member.emergency_mobile||'—'}</div>
     <div className="back-value back-email">{member.emergency_email||'—'}</div>

     <div className="id-back-signatures" aria-label="Authorized signatory signatures">
       {backSignatories.map(s=><div className={`id-back-signatory id-back-signatory-${s.key}`} key={s.key}>
         {s.signature&&<img src={s.signature} alt={`${s.title} signature`}/>}
       </div>)}
     </div>
   </section>}
 </div>;
}
function Certificate({member,commissioner,president}){const region=member.regions||{};const qrValue=memberQrValue(member);const uniqueId=memberUniqueId(member);const list=[{name:commissioner?.name||'ENGELBERT F. FORTIN',title:commissioner?.title||'National Commissioner',url:commissioner?.signature_url},{name:president?.name||'GIL S. REGLO',title:president?.title||'National President',url:president?.signature_url},{name:region.regional_director_name||member.regional_director_name||'REGIONAL DIRECTOR',title:`Regional Director — ${region.name||member.region_name||'Region'}`,url:region.regional_director_signature_url||member.regional_director_signature_url}];return <section className="certificate"><div className="certificate-frame"><div className="cert-top"><img src={BAP_LOGO}/><div><div className="cert-org">BASKETBALL ASSOCIATION OF THE PHILIPPINES TECHNICAL OFFICIALS INC.</div><div className="cert-org-sub">NATIONAL MEMBERSHIP • ACCREDITATION • LICENSING</div></div><MemberProfileQr member={member} size={105}/></div><div className="cert-kicker">OFFICIAL NATIONAL MEMBERSHIP CERTIFICATE</div><h1>CERTIFICATE OF MEMBERSHIP</h1><p className="cert-presented">This certificate is proudly presented to</p><div className="cert-name">{member.full_name}</div><p className="cert-body">in recognition of official membership and commitment to excellence, integrity, professionalism, and the continuing development of basketball officiating in the Philippines.</p><div className="cert-details"><span><b>Unique ID No.</b> {uniqueId}</span><span><b>Control No.</b> {member.control_number||'Pending'}</span><span><b>Designation</b> {member.positions?.name||member.designation||'—'}</span><span><b>Region</b> {region.name||member.region_name||'—'}</span><span><b>Chapter</b> {member.chapter||'—'}</span><span><b>Date Issued</b> {fmtDate(member.issued_at)}</span><span><b>Valid Until</b> {fmtDate(member.expires_at)}</span></div><div className="cert-signatories">{list.map((s,i)=><div className="cert-signatory" key={i}><div className="cert-signature-space">{s.url&&<img src={s.url}/>}</div><div className="cert-sign-line"/><b>{s.name}</b><small>{s.title}</small></div>)}</div><div className="cert-footer"><span>Official National Membership Record</span><span>{uniqueId}</span></div></div></section>}
function Title({eyebrow,title,subtitle}){return <div className="page-title"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>}
function Stat({label,value}){return <article><small>{label}</small><b>{value}</b></article>}
function Loading(){return <main className="page"><div className="loading">Loading...</div></main>}
function Denied(){return <main className="page"><div className="verification invalid"><h1>ACCESS DENIED</h1><p>You do not have permission to view this page.</p></div></main>}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
