import { createClient } from 'npm:@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SALT = Deno.env.get('EARTHLINE_TELEMETRY_HASH_SALT') ?? '';
const ORIGINS = (Deno.env.get('EARTHLINE_ALLOWED_ORIGINS') ?? 'https://earthlinedevelopment.org,https://www.earthlinedevelopment.org,https://live.earthlinedevelopment.org').split(',').map(v=>v.trim()).filter(Boolean);
const db = URL && SERVICE ? createClient(URL, SERVICE, {auth:{persistSession:false,autoRefreshToken:false}}) : null;
const allowedMode = new Set(['regional','property','other']);
const eventPattern = /^[a-z0-9_]{2,64}$/;
const blockedKey = /(address|street|search_text|latitude|longitude|gps|email|phone|credential|session_value|private_text|full_text)/i;

function headers(origin:string|null){
  const o = origin && ORIGINS.includes(origin) ? origin : (ORIGINS[0] ?? 'https://earthlinedevelopment.org');
  return {'Access-Control-Allow-Origin':o,'Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'};
}
function reply(body:unknown,status:number,origin:string|null){return new Response(JSON.stringify(body),{status,headers:headers(origin)});}
function clip(v:unknown,n:number){if(v==null)return null;const s=String(v).replace(/[\u0000-\u001f\u007f]/g,' ').trim();return s?s.slice(0,n):null;}
function pathOnly(v:unknown){const s=clip(v,240);if(!s)return null;try{return new URL(s,'https://earthlinedevelopment.org').pathname.slice(0,240)}catch{return s.split(/[?#]/)[0].slice(0,240)}}
function cleanObject(v:unknown,depth=0):Record<string,unknown>{
  if(!v||typeof v!=='object'||Array.isArray(v)||depth>2)return {};
  const out:Record<string,unknown>={};
  for(const [rk,rv] of Object.entries(v as Record<string,unknown>)){
    const k=rk.slice(0,64); if(!k||blockedKey.test(k)||Object.keys(out).length>=40)continue;
    if(rv==null||typeof rv==='boolean')out[k]=rv;
    else if(typeof rv==='number'&&Number.isFinite(rv))out[k]=rv;
    else if(typeof rv==='string')out[k]=rv.slice(0,240);
    else if(Array.isArray(rv))out[k]=rv.slice(0,12).map(x=>typeof x==='number'||typeof x==='boolean'||x==null?x:String(x).slice(0,120));
    else if(depth<2)out[k]=cleanObject(rv,depth+1);
  }
  return out;
}
async function digest(v:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}
async function actor(req:Request){const ip=(req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')||'').split(',')[0].trim();return ip&&SALT?digest(`${SALT}|${ip}`):null;}
function eventTime(v:unknown){const d=new Date(String(v??'')),now=Date.now();return Number.isFinite(d.getTime())&&Math.abs(d.getTime()-now)<=86400000?d.toISOString():new Date(now).toISOString();}

Deno.serve(async(req)=>{
  const origin=req.headers.get('origin');
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:headers(origin)});
  if(req.method!=='POST')return reply({error:'method-not-allowed'},405,origin);
  if(!origin||!ORIGINS.includes(origin))return reply({error:'origin-not-allowed'},403,origin);
  if(!db||!SALT)return reply({error:'telemetry-not-configured'},503,origin);
  const len=Number(req.headers.get('content-length')||0); if(len>65536)return reply({error:'payload-too-large'},413,origin);
  const raw=await req.text(); if(raw.length>65536)return reply({error:'payload-too-large'},413,origin);
  let body:any; try{body=JSON.parse(raw)}catch{return reply({error:'invalid-json'},400,origin)}
  const items=Array.isArray(body?.events)?body.events:[]; if(!items.length||items.length>30)return reply({error:'invalid-batch'},400,origin);
  const actorKey=await actor(req); if(!actorKey)return reply({error:'telemetry-no-actor'},503,origin);
  const {data:gate,error:gateError}=await db.rpc('earthline_claim_telemetry',{p_actor_key:actorKey,p_event_count:items.length});
  if(gateError||!gate?.allowed)return reply({error:gate?.reason??'telemetry-quota-error'},429,origin);
  const rows:any[]=[];
  for(const e of items){
    if(!e||typeof e!=='object')continue; const name=clip(e.event_name??e.name,64); if(!name||!eventPattern.test(name))continue;
    const duration=Number(e.duration_ms), metric=Number(e.metric_value), sample=Number(e.sample_rate??1);
    rows.push({occurred_at:eventTime(e.occurred_at),event_name:name,session_key:clip(e.session_key,80),actor_key:actorKey,page_path:pathOnly(e.page_path),mode:allowedMode.has(e.mode)?e.mode:null,jurisdiction:clip(e.jurisdiction,120),country_code:clip(e.country_code,8),state_code:clip(e.state_code,16),geo_bucket:clip(e.geo_bucket,40),build:clip(e.build,48),language:clip(e.language,24),timezone:clip(e.timezone,80),referrer_host:clip(e.referrer_host,180),utm_source:clip(e.utm_source,120),utm_medium:clip(e.utm_medium,120),utm_campaign:clip(e.utm_campaign,160),success:typeof e.success==='boolean'?e.success:null,duration_ms:Number.isFinite(duration)&&duration>=0?duration:null,metric_name:clip(e.metric_name,48),metric_value:Number.isFinite(metric)?metric:null,error_class:clip(e.error_class,80),sample_rate:Number.isFinite(sample)&&sample>0&&sample<=1?sample:1,device:cleanObject(e.device),properties:cleanObject(e.properties)});
  }
  if(!rows.length)return reply({error:'no-valid-events'},400,origin);
  const {error}=await db.from('earthline_telemetry_events').insert(rows); if(error)return reply({error:'telemetry-insert-failed'},503,origin);
  if(Math.random()<0.01)db.rpc('earthline_prune_telemetry').then(()=>{}).catch(()=>{});
  return reply({accepted:rows.length},202,origin);
});
