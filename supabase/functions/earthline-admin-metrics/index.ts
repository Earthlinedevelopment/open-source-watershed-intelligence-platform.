import { createClient } from 'npm:@supabase/supabase-js@2';

const URL=Deno.env.get('SUPABASE_URL')??'';
const SERVICE=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'';
const ADMINS=new Set((Deno.env.get('EARTHLINE_ADMIN_USER_IDS')??'').split(',').map(v=>v.trim()).filter(Boolean));
const ORIGINS=(Deno.env.get('EARTHLINE_ALLOWED_ORIGINS')??'https://earthlinedevelopment.org,https://www.earthlinedevelopment.org,https://live.earthlinedevelopment.org').split(',').map(v=>v.trim()).filter(Boolean);
const db=URL&&SERVICE?createClient(URL,SERVICE,{auth:{persistSession:false,autoRefreshToken:false}}):null;
function cors(origin:string|null){const o=origin&&ORIGINS.includes(origin)?origin:(ORIGINS[0]??'https://earthlinedevelopment.org');return{'Access-Control-Allow-Origin':o,'Access-Control-Allow-Headers':'authorization, content-type','Access-Control-Allow-Methods':'GET, OPTIONS','Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8'}}
function reply(body:unknown,status:number,origin:string|null){return new Response(JSON.stringify(body),{status,headers:cors(origin)})}
Deno.serve(async(req)=>{
 const origin=req.headers.get('origin');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
 if(req.method!=='GET')return reply({error:'method-not-allowed'},405,origin);
 if(!origin||!ORIGINS.includes(origin))return reply({error:'origin-not-allowed'},403,origin);
 if(!db||!ADMINS.size)return reply({error:'metrics-not-configured'},503,origin);
 const auth=req.headers.get('authorization')??'';
 if(!auth.toLowerCase().startsWith('bearer '))return reply({error:'sign-in-required'},401,origin);
 const {data,error}=await db.auth.getUser(auth.slice(7).trim());
 if(error||!data.user?.id||!ADMINS.has(data.user.id))return reply({error:'admin-required'},403,origin);
 const u=new URL(req.url);const hours=Math.min(720,Math.max(1,Number(u.searchParams.get('hours')??24)||24));
 const [metrics,searchCfg,searchToday,telemetryCfg,telemetryToday]=await Promise.all([
   db.rpc('earthline_admin_metrics',{p_hours:hours}),
   db.from('earthline_search_limits').select('enabled,global_daily_cap,guest_daily_cap,account_daily_cap,per_minute_cap,updated_at').eq('id',true).maybeSingle(),
   db.from('earthline_search_global_daily').select('usage_date,request_count').eq('usage_date',new Date().toISOString().slice(0,10)).maybeSingle(),
   db.from('earthline_telemetry_limits').select('enabled,global_daily_event_cap,actor_per_minute_event_cap,raw_retention_days,updated_at').eq('id',true).maybeSingle(),
   db.from('earthline_telemetry_global_daily').select('usage_date,event_count').eq('usage_date',new Date().toISOString().slice(0,10)).maybeSingle()
 ]);
 if(metrics.error)return reply({error:'metrics-query-failed'},503,origin);
 return reply({metrics:metrics.data,search:{config:searchCfg.data??null,today:searchToday.data??null},telemetry:{config:telemetryCfg.data??null,today:telemetryToday.data??null}},200,origin);
});
