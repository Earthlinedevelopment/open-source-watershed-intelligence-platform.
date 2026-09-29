/* Earthline 16874 — real account / server-side search adapter + first-party observability loader.
   Safe until earthline-backend-16873.json is explicitly enabled. */
(function(){
'use strict';
const CFG='earthline-backend-16873.json';
let config=null,session=null;
const state={ready:false,enabled:false,error:null};
const originalFetch=window.fetch.bind(window);
const directMapbox=/^https:\/\/api\.mapbox\.com\/geocoding\/v5\/mapbox\.places\/(.+)\.json(?:\?|$)/i;

function headers(token){const h={'apikey':config.supabaseAnonKey,'Content-Type':'application/json'};if(token)h.Authorization='Bearer '+token;return h}
async function jsonFetch(url,options={}){const r=await originalFetch(url,options);let data=null;try{data=await r.json()}catch(_){}if(!r.ok)throw new Error(data?.msg||data?.message||data?.error_description||data?.error||('HTTP '+r.status));return data}
function track(name,props){try{window.EarthlineTelemetry?.track?.(name,props||{})}catch(_){}}

async function signUp({email,password,username}){
 if(!state.enabled)throw new Error('Earthline accounts are not configured yet.');
 email=String(email||'').trim().toLowerCase(); username=String(username||'').trim();
 if(!email||password?.length<8||!/^[A-Za-z0-9._-]{3,32}$/.test(username))throw new Error('Enter a valid email, an 8+ character password, and a 3–32 character username.');
 const data=await jsonFetch(config.supabaseUrl+'/auth/v1/signup',{method:'POST',headers:headers(),body:JSON.stringify({email,password,data:{earthline_username:username}})});
 session=data.session||null;
 if(data.user&&session?.access_token){
   await jsonFetch(config.supabaseUrl+'/rest/v1/earthline_profiles',{method:'POST',headers:{...headers(session.access_token),'Prefer':'return=minimal'},body:JSON.stringify({user_id:data.user.id,username})});
 }
 saveSession();track('auth_signup_success');return data;
}
async function signIn({email,password}){
 if(!state.enabled)throw new Error('Earthline accounts are not configured yet.');
 const data=await jsonFetch(config.supabaseUrl+'/auth/v1/token?grant_type=password',{method:'POST',headers:headers(),body:JSON.stringify({email:String(email||'').trim().toLowerCase(),password:String(password||'')})});
 session=data;saveSession();track('auth_signed_in');return data;
}
function signOut(){session=null;try{sessionStorage.removeItem('earthline-supabase-session-16873')}catch(_){};document.dispatchEvent(new CustomEvent('earthline:account',{detail:{signedIn:false}}))}
function saveSession(){try{if(session)sessionStorage.setItem('earthline-supabase-session-16873',JSON.stringify(session));else sessionStorage.removeItem('earthline-supabase-session-16873')}catch(_){};document.dispatchEvent(new CustomEvent('earthline:account',{detail:{signedIn:!!session?.access_token,user:session?.user||null}}))}
function restoreSession(){try{const s=JSON.parse(sessionStorage.getItem('earthline-supabase-session-16873')||'null');if(s?.access_token)session=s}catch(_){}}
function accessToken(){return session?.access_token||''}

async function proxyMapbox(input,init){
 const raw=typeof input==='string'?input:input?.url||''; const m=raw.match(directMapbox); if(!m)return originalFetch(input,init);
 if(!state.enabled||!config.searchFunctionUrl)return new Response(JSON.stringify({message:'Earthline protected search backend is unavailable.'}),{status:503,headers:{'Content-Type':'application/json'}});
 const src=new URL(raw); const out=new URL(config.searchFunctionUrl);
 out.searchParams.set('q',decodeURIComponent(m[1]));
 for(const k of ['limit','country','language','proximity','types']){const v=src.searchParams.get(k);if(v)out.searchParams.set(k,v)}
 const h=new Headers(init?.headers||{}); if(accessToken())h.set('Authorization','Bearer '+accessToken());
 const t=performance.now();
 try{const r=await originalFetch(out.toString(),{...init,method:'GET',headers:h,cache:'no-store'});track(r.ok?'search_result':'search_failure',{success:r.ok,duration_ms:Math.max(0,performance.now()-t),properties:{status:r.status}});return r}
 catch(e){track('search_failure',{success:false,duration_ms:Math.max(0,performance.now()-t),error_class:'network'});throw e}
}

function commerce(){
 const d=document.getElementById('earthlineLaunchDonate16872'),m=document.getElementById('earthlineLaunchMerch16872');
 if(d&&config?.donationUrl)d.onclick=()=>window.open(config.donationUrl,'_blank','noopener');
 if(m&&config?.storeUrl)m.onclick=()=>window.open(config.storeUrl,'_blank','noopener');
}
function loadTelemetry(){
 if(!config?.telemetryFunctionUrl||!config?.telemetryScript)return;
 window.EARTHLINE_RUNTIME_CONFIG_16873=config;
 document.documentElement.dataset.earthlineBuild=String(config.build||'');
 if(document.querySelector('script[data-earthline-telemetry="16874"]'))return;
 const s=document.createElement('script');s.src=config.telemetryScript;s.async=true;s.dataset.earthlineTelemetry='16874';document.head.appendChild(s);
}

async function init(){
 restoreSession();
 try{
   const r=await originalFetch(CFG+'?v=16874',{cache:'no-store'}); if(!r.ok)throw new Error('config unavailable');
   config=await r.json();window.EARTHLINE_RUNTIME_CONFIG_16873=config;
   const valid=!!(config?.enabled&&/^https:\/\/[^/]+\.supabase\.co$/i.test(config.supabaseUrl||'')&&config.supabaseAnonKey&&/^https:\/\//i.test(config.searchFunctionUrl||''));
   state.enabled=valid; state.ready=true;
   if(valid){window.fetch=proxyMapbox;commerce();loadTelemetry()}
 }catch(e){state.ready=true;state.enabled=false;state.error=String(e?.message||e)}
 document.documentElement.dataset.earthlineBackend16873=state.enabled?'ready':'inactive';
}
window.EARTHLINE_BACKEND_16873={state,signUp,signIn,signOut,accessToken,init:()=>init()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
