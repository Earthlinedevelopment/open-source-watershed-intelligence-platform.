/* Earthline 16874 — first-party observability client.
   No cookies. No raw search text, address, exact GPS, email, report content or other private text.
   Batches operational events only to the Earthline Supabase telemetry function. */
(function(){
'use strict';
const cfg=window.EARTHLINE_RUNTIME_CONFIG_16873||{};
const endpoint=String(cfg.telemetryFunctionUrl||'');
const enabled=/^https:\/\/[^/]+\.supabase\.co\/functions\/v1\/earthline-telemetry$/i.test(endpoint);
const queue=[]; let flushTimer=null,flushing=false,ended=false;
const started=performance.now();
const marks=new Map();
const SKEY='earthline-telemetry-session-16874';
const blocked=/(address|street|query|search_text|latitude|longitude|gps|email|phone|credential|private_text|full_text)/i;
function uuid(){try{return crypto.randomUUID()}catch{return 's_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)}}
function session(){try{let v=sessionStorage.getItem(SKEY);if(!v){v=uuid();sessionStorage.setItem(SKEY,v)}return v}catch{return uuid()}}
const sessionKey=session();
function clip(v,n){if(v==null)return null;const s=String(v).replace(/[\u0000-\u001f\u007f]/g,' ').trim();return s?s.slice(0,n):null}
function clean(v,depth=0){if(!v||typeof v!=='object'||Array.isArray(v)||depth>2)return{};const o={};for(const [rk,rv] of Object.entries(v)){const k=rk.slice(0,64);if(!k||blocked.test(k)||Object.keys(o).length>=40)continue;if(rv==null||typeof rv==='boolean')o[k]=rv;else if(typeof rv==='number'&&Number.isFinite(rv))o[k]=rv;else if(typeof rv==='string')o[k]=rv.slice(0,240);else if(Array.isArray(rv))o[k]=rv.slice(0,12).map(x=>typeof x==='number'||typeof x==='boolean'||x==null?x:String(x).slice(0,120));else if(depth<2)o[k]=clean(rv,depth+1)}return o}
function refHost(){try{return document.referrer?new URL(document.referrer).hostname:null}catch{return null}}
function utm(){try{const p=new URLSearchParams(location.search);return{utm_source:clip(p.get('utm_source'),120),utm_medium:clip(p.get('utm_medium'),120),utm_campaign:clip(p.get('utm_campaign'),160)}}catch{return{}}}
function bucket(n,step){return Math.max(step,Math.round(Number(n||0)/step)*step)}
function device(){const c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;return{viewport:`${bucket(innerWidth,100)}x${bucket(innerHeight,100)}`,screen:`${bucket(screen.width,100)}x${bucket(screen.height,100)}`,cores:Number(navigator.hardwareConcurrency)||null,memory:Number(navigator.deviceMemory)||null,connection:clip(c?.effectiveType,20),save_data:!!c?.saveData,touch:Number(navigator.maxTouchPoints||0)>0,color_scheme:matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light'}}
function base(){return{session_key:sessionKey,page_path:location.pathname,build:clip(cfg.build||document.documentElement.dataset.earthlineBuild||null,48),language:clip(document.documentElement.lang||navigator.language,24),timezone:clip(Intl.DateTimeFormat().resolvedOptions().timeZone,80),referrer_host:refHost(),device:device(),...utm()}}
function schedule(){if(flushTimer||queue.length===0)return;flushTimer=setTimeout(()=>{flushTimer=null;flush(false)},5000)}
async function flush(keepalive){if(!enabled||flushing||!queue.length)return;flushing=true;const batch=queue.splice(0,Math.min(30,queue.length));try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({events:batch}),cache:'no-store',keepalive:!!keepalive,credentials:'omit'});if(!r.ok&&r.status>=500&&queue.length<60)queue.unshift(...batch)}catch(_){if(queue.length<60)queue.unshift(...batch)}finally{flushing=false;if(queue.length)schedule()}}
function track(name,props={}){if(!enabled||!/^([a-z0-9_]){2,64}$/.test(String(name||'')))return;const p=clean(props);const reserved={};for(const k of ['mode','jurisdiction','country_code','state_code','geo_bucket','success','duration_ms','metric_name','metric_value','error_class','sample_rate'])if(Object.prototype.hasOwnProperty.call(props,k))reserved[k]=props[k];queue.push({...base(),...reserved,event_name:String(name),occurred_at:new Date().toISOString(),properties:p});if(queue.length>=10)flush(false);else schedule()}
function coarseGeo(lat,lng){const a=Number(lat),b=Number(lng);if(!Number.isFinite(a)||!Number.isFinite(b))return null;const q=.25;return`${(Math.round(a/q)*q).toFixed(2)},${(Math.round(b/q)*q).toFixed(2)}`}
function start(kind,props={}){const id=uuid();marks.set(id,{t:performance.now(),kind,props:clean(props)});track(`${kind}_start`,props);return id}
function finish(id,success=true,props={}){const m=marks.get(id);if(!m)return;marks.delete(id);track(`${m.kind}_${success?'success':'failure'}`,{...m.props,...props,success,duration_ms:Math.max(0,performance.now()-m.t)})}
function vital(name,value,props={}){if(Number.isFinite(value))track('web_vital',{metric_name:name,metric_value:value,...props})}
window.EarthlineTelemetry={enabled,track,flush:()=>flush(false),coarseGeo,start,finish,vital,sessionKey};

if(!enabled)return;
track('session_start',{properties:{entry_path:location.pathname}});
track('page_view');

window.addEventListener('error',e=>track('js_error',{error_class:clip(e?.error?.name||'Error',80),properties:{message:clip(e?.message,180),file:(()=>{try{return e?.filename?new URL(e.filename,location.href).pathname:null}catch{return null}})(),line:Number(e?.lineno)||null,column:Number(e?.colno)||null}}));
window.addEventListener('unhandledrejection',e=>{const r=e?.reason;track('unhandled_rejection',{error_class:clip(r?.name||'PromiseRejection',80),properties:{message:clip(r?.message||r,180)}})});

document.addEventListener('click',e=>{const el=e.target?.closest?.('a,button,[role="button"]');if(!el)return;const explicit=el.getAttribute?.('data-earthline-track');if(explicit&&/^[a-z0-9_]{2,64}$/.test(explicit))return track(explicit);if(el.id==='earthlineLaunchDonate16872')return track('donate_click');if(el.id==='earthlineLaunchMerch16872')return track('merch_click');const href=el.getAttribute?.('href')||'';if(/^mailto:/i.test(href))return track('contact_click')},{capture:true,passive:true});

document.addEventListener('earthline:telemetry',e=>{const d=e.detail||{};track(d.name,d.properties||{})});
document.addEventListener('earthline:account',e=>track(e.detail?.signedIn?'auth_signed_in':'auth_signed_out'));

try{const nav=performance.getEntriesByType('navigation')[0];if(nav){vital('TTFB',Math.max(0,nav.responseStart-nav.requestStart));track('navigation_timing',{duration_ms:nav.duration,properties:{dom_interactive_ms:nav.domInteractive,load_ms:nav.loadEventEnd||null,transfer_size:nav.transferSize||null}})}}catch(_){ }
try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.name==='first-contentful-paint')vital('FCP',e.startTime)}).observe({type:'paint',buffered:true})}catch(_){ }
try{new PerformanceObserver(list=>{const es=list.getEntries();const e=es[es.length-1];if(e)vital('LCP',e.startTime)}).observe({type:'largest-contentful-paint',buffered:true})}catch(_){ }
let cls=0;try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch(_){ }
let inp=0;try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.duration>inp)inp=e.duration}).observe({type:'event',buffered:true,durationThreshold:40})}catch(_){ }
let longCount=0,longTotal=0,longMax=0;try{new PerformanceObserver(list=>{for(const e of list.getEntries()){longCount++;longTotal+=e.duration;longMax=Math.max(longMax,e.duration)}}).observe({type:'longtask',buffered:true})}catch(_){ }

function end(){if(ended)return;ended=true;vital('CLS',cls);if(inp)vital('INP',inp);const resources=performance.getEntriesByType('resource');track('resource_summary',{properties:{count:resources.length,total_transfer_bytes:resources.reduce((s,e)=>s+(e.transferSize||0),0),slow_over_1s:resources.filter(e=>e.duration>=1000).length,long_tasks:longCount,long_task_total_ms:Math.round(longTotal),long_task_max_ms:Math.round(longMax)}});track('session_end',{duration_ms:Math.max(0,performance.now()-started)});flush(true)}
window.addEventListener('pagehide',end,{once:true});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush(true)});
})();
