/* EARTHLINE 17003 — MOBILE VIEWPORT PRODUCTION REPAIR ONLY.
   Ensures phone browsers use the physical device width so the already-existing
   Earthline mobile breakpoints activate. No hydrology, map science, swale,
   recharge, search ownership, or desktop-layout rules are changed. */
(function earthlineInstallMobileViewport17003(){
  try{
    let meta=document.querySelector('meta[name="viewport"]');
    if(!meta){
      meta=document.createElement('meta');
      meta.setAttribute('name','viewport');
      (document.head||document.documentElement).appendChild(meta);
    }
    meta.setAttribute('content','width=device-width, initial-scale=1, viewport-fit=cover');
    document.documentElement.dataset.earthlineMobileViewport17003='active';
  }catch(_){}
})();

(function(){
'use strict';
/* EARTHLINE 16913 — NZ real-canvas crosshair release only.
   The authoritative country-center lock is released on actual Mapbox pointer input;
   existing crosshair/Property target owners remain unchanged. */
(function installNzRealCanvasRelease16913(){
  if(window.EARTHLINE_NZ_REAL_CANVAS_RELEASE_16913)return;
  window.EARTHLINE_NZ_REAL_CANVAS_RELEASE_16913=true;
  document.addEventListener('pointerdown',function(ev){
    try{
      const pkg=window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845||null;
      const code=String(pkg?.countryCode||pkg?.location?.countryCode||'').toLowerCase();
      const name=String(pkg?.location?.name||pkg?.name||'').trim().toLowerCase();
      if(!(code==='nz'||code==='nzl'||name==='new zealand'))return;
      const base=document.getElementById('mapboxBase');
      const surface=ev.target&&ev.target.closest?ev.target.closest('.mapboxgl-map,#mapboxBase'):null;
      if(surface||(base&&(ev.target===base||base.contains(ev.target))))window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;
    }catch(_){}
  },true);
})();

const BUILD='EARTHLINE 16877';
const CONFIG_URL='earthline-cost-control-16872.json';
const SUPABASE_URL='https://ccucaqwbdsskcwxxbqiz.supabase.co';
const SUPABASE_KEY='sb_publishable_0Tf2XZGP-CwcBDXe8s_xdw_Cknsy1Fm';
const TELEMETRY_URL=SUPABASE_URL+'/functions/v1/earthline-telemetry';
const FALLBACK={enabled:true,paidSearchEnabled:true,guestDaily:5,accountDaily:25,hardDailyPerBrowser:25,perMinute:6,failClosed:true};
let config={...FALLBACK},configReady=false,launchLangOverride='';
const STORE='earthline-launch-16872';
const keys={user:STORE+'-user',usage:STORE+'-usage',session:STORE+'-supabase-session',actor:STORE+'-actor',telemetry:'earthline-telemetry-session-16877'};
const billable=/^https:\/\/api\.mapbox\.com\/(?:geocoding|search)\//i;
const day=()=>new Date().toISOString().slice(0,10);
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(_){return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
function getSession(){try{return JSON.parse(localStorage.getItem(keys.session)||'null')}catch(_){return null}}
function setSession(s){try{if(s)localStorage.setItem(keys.session,JSON.stringify(s));else localStorage.removeItem(keys.session)}catch(_){}const u=s?.user?.user_metadata?.earthline_username||'';try{if(u)localStorage.setItem(keys.user,u);else localStorage.removeItem(keys.user)}catch(_){}renderAccount()}
const user=()=>{const s=getSession();try{return String(s?.user?.user_metadata?.earthline_username||localStorage.getItem(keys.user)||'')}catch(_){return String(s?.user?.user_metadata?.earthline_username||'')}};
function actorKey(){try{let v=sessionStorage.getItem(keys.actor);if(!v){v='s_'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));sessionStorage.setItem(keys.actor,v)}return v}catch(_){return 's_'+Date.now().toString(36)+Math.random().toString(36).slice(2)}}
function authHeaders(token){const h={'apikey':SUPABASE_KEY,'Content-Type':'application/json'};if(token)h.Authorization='Bearer '+token;return h}
const rawFetch=window.fetch?window.fetch.bind(window):null;
async function authJson(path,options){const r=await rawFetch(SUPABASE_URL+path,options);let d=null;try{d=await r.json()}catch(_){}if(!r.ok)throw new Error(d?.msg||d?.message||d?.error_description||d?.error||('HTTP '+r.status));return d}
async function refreshSessionIfNeeded(){const s=getSession();if(!s?.refresh_token)return s;const exp=Number(s.expires_at||0)*1000;if(s.access_token&&(!exp||exp-Date.now()>60000))return s;try{const d=await authJson('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:authHeaders(),body:JSON.stringify({refresh_token:s.refresh_token})});setSession(d);return d}catch(_){setSession(null);return null}}
async function usernameAvailable(username){const r=await rawFetch(SUPABASE_URL+'/rest/v1/rpc/earthline_username_available',{method:'POST',headers:authHeaders(getSession()?.access_token),body:JSON.stringify({p_username:String(username||'').trim()}),cache:'no-store'});if(!r.ok)throw new Error('Username availability check is temporarily unavailable.');return !!(await r.json())}
async function createAccount(username,email,password){username=String(username||'').trim();email=String(email||'').trim().toLowerCase();password=String(password||'');if(!/^[A-Za-z0-9._-]{3,32}$/.test(username))throw new Error('Username must be 3–32 letters, numbers, dots, dashes or underscores.');if(!/^\S+@\S+\.\S+$/.test(email))throw new Error('Enter a valid email address.');if(password.length<8)throw new Error('Password must be at least 8 characters.');if(!await usernameAvailable(username))throw new Error('That username is already taken.');const d=await authJson('/auth/v1/signup',{method:'POST',headers:authHeaders(),body:JSON.stringify({email,password,data:{earthline_username:username}})});if(d.session)setSession(d.session);track('auth_signup');return {username,email,session:!!d.session,user:d.user||null}}
async function signIn(email,password){email=String(email||'').trim().toLowerCase();const d=await authJson('/auth/v1/token?grant_type=password',{method:'POST',headers:authHeaders(),body:JSON.stringify({email,password:String(password||'')})});setSession(d);track('auth_signin');return d}
async function signOut(){const s=getSession();try{if(s?.access_token)await rawFetch(SUPABASE_URL+'/auth/v1/logout',{method:'POST',headers:authHeaders(s.access_token)})}catch(_){}setSession(null);track('auth_signout')}
function usage(){let u=read(keys.usage,{day:day(),count:0,minute:[]});if(u.day!==day())u={day:day(),count:0,minute:[]};u.minute=(u.minute||[]).filter(t=>Date.now()-t<60000);return u}
function quota(){const signed=!!getSession()?.access_token;const daily=Math.min(Number(config.hardDailyPerBrowser||25),signed?Number(config.accountDaily||25):Number(config.guestDaily||5));const u=usage();return {signed,user:user(),daily,used:u.count,remaining:Math.max(0,daily-u.count),perMinute:Number(config.perMinute||6),configReady,enabled:config.enabled!==false&&config.paidSearchEnabled!==false}}
function localPrecheck(){if(!configReady&&config.failClosed!==false)return {ok:false,reason:'cost-control-loading',...quota()};const q=quota();if(!q.enabled)return {ok:false,reason:'cost-breaker',...q};const u=usage();if(u.minute.length>=q.perMinute)return {ok:false,reason:'rate-limit',...q};if(u.count>=q.daily)return {ok:false,reason:'daily-limit',...q};return {ok:true,reason:'local-ok',...q}}
function recordPaidSearch(){const u=usage();u.count++;u.minute.push(Date.now());write(keys.usage,u);updateQuotaText()}
async function centralClaim(){try{const s=getSession();const r=await rawFetch(SUPABASE_URL+'/rest/v1/rpc/earthline_claim_search_public',{method:'POST',headers:authHeaders(s?.access_token),body:JSON.stringify({p_actor_key:actorKey()}),cache:'no-store'});if(!r.ok)return {allowed:false,reason:'quota-error'};const d=await r.json();return d&&typeof d==='object'?d:{allowed:false,reason:'quota-error'}}catch(_){return {allowed:false,reason:'quota-error'}}}
function blockedResponse(g){const reason=g?.reason||'';track('search_blocked',{reason});showToast(reason==='daily-limit'||reason==='actor-daily-cap'?'Daily Earthline search limit reached. Log in for a larger allowance.':reason==='global-daily-cap'?'Earthline has reached today’s protected search limit. Please try again tomorrow.':'Earthline search protection is active.');return new Response(JSON.stringify({message:'Earthline search protection',reason}),{status:429,headers:{'Content-Type':'application/json'}})}
async function allowPaidSearch(){const pre=localPrecheck();if(!pre.ok)return {ok:false,...pre};const gate=await centralClaim();if(!gate?.allowed)return {ok:false,reason:gate?.reason||'quota-error',...gate};recordPaidSearch();return {ok:true,reason:'allowed',...quota(),...gate}}
function consumePaidSearch(url){if(!billable.test(String(url||'')))return {ok:true,reason:'not-billable',...quota()};const pre=localPrecheck();if(!pre.ok)return pre;recordPaidSearch();return {ok:true,reason:'local-fallback',...quota()}}
if(rawFetch){window.fetch=async function(input,init){const url=typeof input==='string'?input:(input&&input.url)||'';if(billable.test(url)){const started=performance.now();track('search_request');const g=await allowPaidSearch();if(!g.ok)return blockedResponse(g);try{const r=await rawFetch(input,init);track(r.ok?'search_success':'search_failure',{success:r.ok,duration_ms:performance.now()-started,status:r.status});return r}catch(e){track('search_failure',{success:false,duration_ms:performance.now()-started,error_class:'network'});throw e}}return rawFetch(input,init)}}
try{const xo=XMLHttpRequest.prototype.open,xs=XMLHttpRequest.prototype.send;XMLHttpRequest.prototype.open=function(m,u){this.__earthlinePaid16872=String(u||'');return xo.apply(this,arguments)};XMLHttpRequest.prototype.send=function(){const url=this.__earthlinePaid16872||'';if(!billable.test(url))return xs.apply(this,arguments);const self=this,args=arguments;const started=performance.now();track('search_request');allowPaidSearch().then(g=>{if(g.ok){self.addEventListener('loadend',()=>track(self.status>=200&&self.status<400?'search_success':'search_failure',{success:self.status>=200&&self.status<400,duration_ms:performance.now()-started,status:self.status}),{once:true});xs.apply(self,args)}else{try{self.abort()}catch(_){};track('search_blocked',{reason:g.reason||'quota'});showToast(g.reason==='global-daily-cap'?'Earthline has reached today’s protected search limit.':'Earthline search protection is active.')}}).catch(()=>{try{self.abort()}catch(_){};track('search_failure',{success:false,error_class:'quota'});showToast('Earthline search protection is active.')});return}}catch(_){}
function detectLang(v){const s=String(v||'').trim().toLowerCase();if(!s)return'';if(/(^|\b)(es|español|espanol|spanish)(\b|$)/.test(s))return'es';if(/(^|\b)(vi|việt|viet|vietnamese)(\b|$)/.test(s))return'vi';if(/(^|\b)(th|ไทย|thai)(\b|$)/.test(s))return'th';if(/(^|\b)(en|english)(\b|$)/.test(s))return'en';return''}
function lang(){return launchLangOverride||detectLang(document.documentElement.lang)||'en'}
const TXT={en:{login:'LOGIN',donate:'DONATE',merch:'MERCH',title:'Earthline Account',in:'Log In',get:'Get an Account',user:'Username',email:'Email',pass:'Password',logout:'Sign Out',allow:'Search allowance',guest:'Guest access',created:'Account created. Check your email if confirmation is requested.',signed:'Signed in.'},es:{login:'INICIAR SESIÓN',donate:'DONAR',merch:'PRODUCTOS',title:'Cuenta Earthline',in:'Iniciar sesión',get:'Crear una cuenta',user:'Usuario',email:'Correo electrónico',pass:'Contraseña',logout:'Cerrar sesión',allow:'Límite de búsquedas',guest:'Acceso de invitado',created:'Cuenta creada. Revise su correo si se solicita confirmación.',signed:'Sesión iniciada.'},vi:{login:'ĐĂNG NHẬP',donate:'ỦNG HỘ',merch:'SẢN PHẨM',title:'Tài khoản Earthline',in:'Đăng nhập',get:'Tạo tài khoản',user:'Tên người dùng',email:'Email',pass:'Mật khẩu',logout:'Đăng xuất',allow:'Giới hạn tìm kiếm',guest:'Truy cập khách',created:'Đã tạo tài khoản. Kiểm tra email nếu cần xác nhận.',signed:'Đã đăng nhập.'},th:{login:'เข้าสู่ระบบ',donate:'บริจาค',merch:'สินค้า',title:'บัญชี Earthline',in:'เข้าสู่ระบบ',get:'สร้างบัญชี',user:'ชื่อผู้ใช้',email:'อีเมล',pass:'รหัสผ่าน',logout:'ออกจากระบบ',allow:'จำนวนการค้นหา',guest:'ผู้เยี่ยมชม',created:'สร้างบัญชีแล้ว โปรดตรวจสอบอีเมลหากต้องยืนยัน',signed:'เข้าสู่ระบบแล้ว'}};
const UI={en:{'Search':'Search','Property Modelling':'Property Modelling','Bioswale Impact Report':'Bioswale Impact Report','Status':'Status','Results':'Results','Swales Explained':'Swales Explained','The Earthline Process':'The Earthline Process','DATA':'DATA','CONTACT':'CONTACT','LOGIN':'LOGIN','DONATE':'DONATE','MERCHANDISE':'MERCH','RUN ANALYSIS':'RUN ANALYSIS','RUN ANALYSIS FIRST':'RUN ANALYSIS FIRST','Recharge Potential':'Recharge Potential','Average yearly rainfall:':'Average yearly rainfall:','Earthline analyzes slope and water paths to identify optimum aquifer recharge locations — in any location.':'Earthline analyzes slope and water paths to identify optimum aquifer recharge locations — in any location.','All sites need to be verified by a professional landscape expert.':'All sites need to be verified by a professional landscape expert.','Managed groundwater context • regional and well evidence':'Managed groundwater context • regional and well evidence','Search a location':'Search a location'},es:{'Search':'Buscar','Property Modelling':'Modelado de propiedad','Bioswale Impact Report':'Informe de impacto de bioswales','Status':'Estado','Results':'Resultados','Swales Explained':'Bioswales explicados','The Earthline Process':'El proceso Earthline','DATA':'DATOS','CONTACT':'CONTACTO','LOGIN':'INICIAR SESIÓN','DONATE':'DONAR','MERCHANDISE':'PRODUCTOS','RUN ANALYSIS':'EJECUTAR ANÁLISIS','RUN ANALYSIS FIRST':'EJECUTE EL ANÁLISIS PRIMERO','Recharge Potential':'Potencial de recarga','Average yearly rainfall:':'Precipitación media anual:','Earthline analyzes slope and water paths to identify optimum aquifer recharge locations — in any location.':'Earthline analiza la pendiente y las rutas del agua para identificar ubicaciones óptimas de recarga de acuíferos — en cualquier lugar.','All sites need to be verified by a professional landscape expert.':'Todos los sitios deben ser verificados por un profesional del paisaje.','Managed groundwater context • regional and well evidence':'Contexto de aguas subterráneas gestionado • evidencia regional y de pozos','Search a location':'Buscar una ubicación'},vi:{'Search':'Tìm kiếm','Property Modelling':'Mô hình hóa khu đất','Bioswale Impact Report':'Báo cáo tác động rãnh sinh học','Status':'Trạng thái','Results':'Kết quả','Swales Explained':'Giải thích rãnh sinh học','The Earthline Process':'Quy trình Earthline','DATA':'DỮ LIỆU','CONTACT':'LIÊN HỆ','LOGIN':'ĐĂNG NHẬP','DONATE':'ỦNG HỘ','MERCHANDISE':'SẢN PHẨM','RUN ANALYSIS':'CHẠY PHÂN TÍCH','RUN ANALYSIS FIRST':'CHẠY PHÂN TÍCH TRƯỚC','Recharge Potential':'Tiềm năng bổ cập','Average yearly rainfall:':'Lượng mưa trung bình năm:','Earthline analyzes slope and water paths to identify optimum aquifer recharge locations — in any location.':'Earthline phân tích độ dốc và đường đi của nước để xác định vị trí tối ưu cho bổ cập tầng chứa nước — ở bất kỳ nơi nào.','All sites need to be verified by a professional landscape expert.':'Mọi địa điểm cần được chuyên gia cảnh quan xác minh.','Managed groundwater context • regional and well evidence':'Bối cảnh nước ngầm được quản lý • bằng chứng khu vực và giếng','Search a location':'Tìm kiếm địa điểm'},th:{'Search':'ค้นหา','Property Modelling':'การจำลองพื้นที่','Bioswale Impact Report':'รายงานผลกระทบร่องชีวภาพ','Status':'สถานะ','Results':'ผลลัพธ์','Swales Explained':'คำอธิบายร่องชีวภาพ','The Earthline Process':'กระบวนการ Earthline','DATA':'ข้อมูล','CONTACT':'ติดต่อ','LOGIN':'เข้าสู่ระบบ','DONATE':'บริจาค','MERCHANDISE':'สินค้า','RUN ANALYSIS':'เรียกใช้การวิเคราะห์','RUN ANALYSIS FIRST':'เรียกใช้การวิเคราะห์ก่อน','Recharge Potential':'ศักยภาพการเติมน้ำ','Average yearly rainfall:':'ปริมาณฝนเฉลี่ยต่อปี:','Earthline analyzes slope and water paths to identify optimum aquifer recharge locations — in any location.':'Earthline วิเคราะห์ความลาดชันและเส้นทางน้ำเพื่อระบุตำแหน่งที่เหมาะสมที่สุดสำหรับการเติมน้ำลงชั้นหินอุ้มน้ำ — ในทุกพื้นที่','All sites need to be verified by a professional landscape expert.':'ทุกพื้นที่ควรได้รับการตรวจสอบโดยผู้เชี่ยวชาญด้านภูมิทัศน์','Managed groundwater context • regional and well evidence':'บริบทน้ำใต้ดินที่จัดการ • หลักฐานระดับภูมิภาคและบ่อ','Search a location':'ค้นหาสถานที่'}};
const BASE_TEXT=Object.keys(UI.en);const t=()=>TXT[lang()]||TXT.en;
function normalizeText(s){return String(s||'').replace(/\s+/g,' ').trim()}
function reverseText(){const r=new Map();for(const base of BASE_TEXT){r.set(normalizeText(base).toLowerCase(),base);for(const d of Object.values(UI))r.set(normalizeText(d[base]||'').toLowerCase(),base)}return r}
function translateVisibleText(){const dict=UI[lang()]||UI.en,rev=reverseText();try{const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){const raw=n.nodeValue||'',norm=normalizeText(raw);if(!norm)continue;const base=rev.get(norm.toLowerCase());if(!base||!dict[base]||norm===dict[base])continue;const lead=(raw.match(/^\s*/)||[''])[0],trail=(raw.match(/\s*$/)||[''])[0];n.nodeValue=lead+dict[base]+trail}}catch(_){}for(const el of document.querySelectorAll('input[placeholder],textarea[placeholder]')){const norm=normalizeText(el.getAttribute('placeholder'));const base=rev.get(norm.toLowerCase());if(base&&dict[base])el.setAttribute('placeholder',dict[base])}}
function scheduleTranslation(){for(const ms of [0,80,260,700,1400])setTimeout(translateVisibleText,ms)}
function showToast(msg){let e=document.getElementById('earthlineToast16872');if(!e){e=document.createElement('div');e.id='earthlineToast16872';document.body.appendChild(e)}e.textContent=msg;e.classList.add('show');clearTimeout(e._tm);e._tm=setTimeout(()=>e.classList.remove('show'),3600)}
function modal(){let m=document.getElementById('earthlineAccountModal16872');if(m)return m;m=document.createElement('div');m.id='earthlineAccountModal16872';m.innerHTML='<div class="earthline-launch-card-16872"><button class="earthline-launch-close-16872" aria-label="Close">×</button><h2></h2><div class="earthline-account-state-16872"></div><div class="earthline-account-tabs-16872"><button data-mode="login"></button><button data-mode="create"></button></div><form class="earthline-account-form-16872"><label class="earthline-email-row-16872"><span class="e"></span><input name="email" type="email" autocomplete="email" required></label><label class="earthline-user-row-16872"><span class="u"></span><input name="username" autocomplete="username"></label><label><span class="p"></span><input name="password" type="password" autocomplete="current-password" required></label><button type="submit" class="earthline-account-submit-16872"></button></form><button class="earthline-signout-16872" hidden></button><div class="earthline-quota-16872"></div><div class="earthline-account-message-16872"></div></div>';document.body.appendChild(m);m.querySelector('.earthline-launch-close-16872').onclick=()=>m.classList.remove('open');m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open')});m.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{m.dataset.mode=b.dataset.mode;renderAccount()});m.querySelector('.earthline-signout-16872').onclick=async()=>{await signOut();showToast(t().logout)};m.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),mode=m.dataset.mode||'login',msg=m.querySelector('.earthline-account-message-16872'),d=t();try{msg.textContent='';if(mode==='create'){const out=await createAccount(f.get('username'),f.get('email'),f.get('password'));msg.textContent=out.session?d.signed:d.created}else{await signIn(f.get('email'),f.get('password'));msg.textContent=d.signed}}catch(err){msg.textContent=err.message||String(err)}};return m}
function renderAccount(){const m=modal(),d=t(),q=quota(),create=(m.dataset.mode||'login')==='create';m.querySelector('h2').textContent=d.title;m.querySelector('[data-mode="login"]').textContent=d.in;m.querySelector('[data-mode="create"]').textContent=d.get;m.querySelector('.u').textContent=d.user;m.querySelector('.e').textContent=d.email;m.querySelector('.p').textContent=d.pass;m.querySelector('.earthline-user-row-16872').hidden=!create;m.querySelector('[name="username"]').required=create;m.querySelector('.earthline-account-submit-16872').textContent=create?d.get:d.in;m.querySelector('.earthline-signout-16872').textContent=d.logout;m.querySelector('.earthline-signout-16872').hidden=!q.signed;m.querySelector('.earthline-account-state-16872').textContent=q.signed?(d.in+': '+(q.user||d.email)):d.guest;m.querySelector('.earthline-quota-16872').textContent=d.allow+': '+q.remaining+' of '+q.daily+' remaining today';const L=document.getElementById('earthlineLaunchLogin16872'),D=document.getElementById('earthlineLaunchDonate16872'),M=document.getElementById('earthlineLaunchMerch16872');if(L){L.textContent=d.login;L.setAttribute('aria-label',d.login)}if(D){D.textContent=d.donate;D.setAttribute('aria-label',d.donate)}if(M){M.textContent=d.merch;M.setAttribute('aria-label',d.merch)}scheduleTranslation()}
function syncLanguageFromTarget(target){const el=target?.closest?.('select,option,button,a,[role="button"],[data-lang],[data-language]')||target;if(!el)return;let raw='';try{raw=[el.value,el.getAttribute?.('data-lang'),el.getAttribute?.('data-language'),el.getAttribute?.('lang'),el.selectedOptions?.[0]?.textContent,el.textContent].filter(Boolean).join(' ')}catch(_){}const code=detectLang(raw);if(code){launchLangOverride=code;if(document.documentElement.lang!==code)document.documentElement.lang=code;track('language_change',{language:code});renderAccount();scheduleTranslation()}}
function updateQuotaText(){if(document.getElementById('earthlineAccountModal16872'))renderAccount()}
function openAccount(mode='login'){const m=modal();m.dataset.mode=mode;m.classList.add('open');track(mode==='create'?'account_create_open':'login_open');renderAccount();setTimeout(()=>m.querySelector('input:not([hidden])')?.focus(),40)}
function donateTarget(){try{return String(window.EARTHLINE_DONATE_URL_16872||localStorage.getItem('earthlineDonateUrl16872')||'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-25645')}catch(_){return String(window.EARTHLINE_DONATE_URL_16872||'https://www.zeffy.com/en-US/donation-form/donate-to-change-lives-25645')}}
function donate(){track('donate_click');const u=donateTarget();if(u){window.open(u,'_blank','noopener');return}window.open('donate.html','_blank','noopener')}
let launchRailRetry16872=0;
function installRail(){
  const rail=document.getElementById('earthlineRail16188');
  if(!rail){
    const delays=[0,40,160,500];
    if(launchRailRetry16872<delays.length)setTimeout(installRail,delays[launchRailRetry16872++]);
    return false;
  }
  launchRailRetry16872=0;
  const ids=['earthlineLaunchLogin16872','earthlineLaunchDonate16872','earthlineLaunchMerch16872'];
  const existing=ids.map(id=>document.getElementById(id));
  if(existing.every(Boolean)){
    for(const el of existing)if(el.parentElement!==rail)rail.appendChild(el);
    document.getElementById('earthlineLaunchFallbackRail16872')?.remove();
    renderAccount();
    return true;
  }
  for(const el of existing)el?.remove();
  const mk=(id,txt)=>{
    const b=document.createElement('button');
    b.id=id;b.type='button';
    b.className='earthline-launch-rail-btn-16872';
    b.textContent=txt;b.setAttribute('aria-label',txt);
    return b;
  };
  const L=mk(ids[0],t().login),D=mk(ids[1],t().donate),M=mk(ids[2],t().merch);
  L.onclick=()=>openAccount('login');
  D.onclick=donate;
  M.onclick=()=>{track('merch_click');window.open('merchandise.html','_blank','noopener')};
  rail.append(L,D,M);
  document.getElementById('earthlineLaunchFallbackRail16872')?.remove();
  renderAccount();
  return true;
}
async function loadConfig(){try{const r=await rawFetch(CONFIG_URL+'?v=16877',{cache:'no-store'});if(!r.ok)throw new Error('config');const j=await r.json();config={...FALLBACK,...j};configReady=true}catch(_){config={...FALLBACK,paidSearchEnabled:false};configReady=true}updateQuotaText()}
const tq=[];let tt=null,tf=false,analysisStarted=0,sessionStarted=performance.now();
function telemetrySession(){try{let v=sessionStorage.getItem(keys.telemetry);if(!v){v='t_'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));sessionStorage.setItem(keys.telemetry,v)}return v}catch(_){return 't_'+Date.now().toString(36)+Math.random().toString(36).slice(2)}}
const telemetrySessionKey=telemetrySession();
function cleanProps(v){if(!v||typeof v!=='object'||Array.isArray(v))return{};const out={};const blocked=/(address|street|query|search|latitude|longitude|gps|email|phone|credential|password|token|cookie|username|referrer|ip|private|full_text)/i;for(const [k,val] of Object.entries(v)){if(blocked.test(k)||Object.keys(out).length>=20)continue;if(val==null||typeof val==='boolean'||typeof val==='number')out[k]=val;else if(typeof val==='string')out[k]=val.slice(0,120)}return out}
async function flushTelemetry(keepalive=false){if(tf||!tq.length||!rawFetch)return;tf=true;const batch=tq.splice(0,Math.min(30,tq.length));try{const r=await rawFetch(TELEMETRY_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session_key:telemetrySessionKey,events:batch}),cache:'no-store',credentials:'omit',keepalive:!!keepalive});if(!r.ok&&r.status>=500&&tq.length<60)tq.unshift(...batch)}catch(_){if(tq.length<60)tq.unshift(...batch)}finally{tf=false;if(tq.length&&!tt)tt=setTimeout(()=>{tt=null;flushTelemetry(false)},5000)}}
function track(event_name,properties={}){if(!/^[a-z0-9_]{2,64}$/.test(String(event_name||'')))return;const e={event_name:String(event_name),occurred_at:new Date().toISOString(),session_key:telemetrySessionKey,page_path:location.pathname,build:BUILD,language:lang(),properties:cleanProps(properties)};for(const k of ['mode','success','duration_ms','metric_name','metric_value','error_class','jurisdiction','country_code','state_code'])if(Object.prototype.hasOwnProperty.call(properties,k))e[k]=properties[k];tq.push(e);if(tq.length>=10)flushTelemetry(false);else if(!tt)tt=setTimeout(()=>{tt=null;flushTelemetry(false)},5000)}
function installTelemetry(){track('session_start');track('page_view');document.addEventListener('click',e=>{const el=e.target?.closest?.('a,button,[role="button"]');if(!el)return;const id=String(el.id||'');const label=normalizeText(el.getAttribute?.('aria-label')||el.textContent||'').toLowerCase();if(id==='earthlineRailSearch16188')track('search_panel_click');else if(id==='earthlineRailMenu16188')track('menu_click');else if(id==='earthlineRailContact16512'||/^mailto:/i.test(el.getAttribute?.('href')||''))track('contact_click');else if(id==='earthlineVermontReport16149'||label.includes('bioswale impact report')||label.includes('informe de impacto')||label.includes('báo cáo tác động')||label.includes('รายงานผลกระทบ'))track('report_open');else if(label==='data'||label==='datos'||label==='dữ liệu'||label==='ข้อมูล')track('data_open');else if(label.includes('swales explained')||label.includes('bioswales explicados')||label.includes('rãnh sinh học')||label.includes('ร่องชีวภาพ'))track('swales_explained_open');else if(label.includes('earthline process')||label.includes('proceso earthline')||label.includes('quy trình earthline')||label.includes('กระบวนการ earthline'))track('process_open');if(['runBtn','runBtnSide','earthlineMapRun15970','earthlineMapRun16020','earthlineDeclareProperty16169'].includes(id)){analysisStarted=performance.now();track(id==='earthlineDeclareProperty16169'?'property_analysis_start':'regional_analysis_start',{mode:id==='earthlineDeclareProperty16169'?'property':'regional'})}},{capture:true,passive:true});document.addEventListener('earthline:analysis-complete',e=>{const raw=String(e?.detail?.tier||e?.detail?.mode||'regional').toLowerCase();const mode=raw.includes('property')?'property':'regional';track(mode+'_analysis_success',{mode,success:true,duration_ms:analysisStarted?performance.now()-analysisStarted:null});analysisStarted=0},{passive:true});window.addEventListener('error',e=>track('js_error',{error_class:String(e?.error?.name||'Error').slice(0,80)}));window.addEventListener('unhandledrejection',e=>track('unhandled_rejection',{error_class:String(e?.reason?.name||'PromiseRejection').slice(0,80)}));try{const nav=performance.getEntriesByType('navigation')[0];if(nav){track('web_vital',{metric_name:'TTFB',metric_value:Math.max(0,nav.responseStart-nav.requestStart)});track('navigation_timing',{duration_ms:nav.duration})}}catch(_){}try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.name==='first-contentful-paint')track('web_vital',{metric_name:'FCP',metric_value:e.startTime})}).observe({type:'paint',buffered:true})}catch(_){}try{new PerformanceObserver(list=>{const a=list.getEntries(),e=a[a.length-1];if(e)track('web_vital',{metric_name:'LCP',metric_value:e.startTime})}).observe({type:'largest-contentful-paint',buffered:true})}catch(_){}let cls=0;try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch(_){}window.addEventListener('pagehide',()=>{track('web_vital',{metric_name:'CLS',metric_value:cls});track('session_end',{duration_ms:performance.now()-sessionStarted});flushTelemetry(true)},{once:true});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushTelemetry(true)})}
function earthlineNzOverlayHitPass16914(){
  try{
    const pkg=window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845||null;
    const code=String(pkg?.countryCode||pkg?.location?.countryCode||'').toLowerCase();
    const name=String(pkg?.location?.name||pkg?.name||'').trim().toLowerCase();
    const query=String(window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970?.query||'').trim().toLowerCase();
    const nz=(code==='nz'||code==='nzl'||name==='new zealand'||query==='new zealand');
    let style=document.getElementById('earthlineNzOverlayHitPass16914');
    const hits=document.querySelectorAll('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070');
    if(nz){
      if(!style){
        style=document.createElement('style');
        style.id='earthlineNzOverlayHitPass16914';
        style.textContent='#earthlineRegionalVectorOverlay16020{pointer-events:none!important;}';
        (document.head||document.documentElement).appendChild(style);
      }
      hits.forEach(el=>{
        if(!el.dataset.earthlinePrevPointer16914)el.dataset.earthlinePrevPointer16914=el.style.pointerEvents||'__empty__';
        el.style.setProperty('pointer-events','none','important');
      });
      window.EARTHLINE_NZ_OVERLAY_HIT_PASS_16914=true;
    }else{
      if(style)style.remove();
      hits.forEach(el=>{
        const prev=el.dataset.earthlinePrevPointer16914;
        if(prev){
          if(prev==='__empty__')el.style.removeProperty('pointer-events');
          else el.style.pointerEvents=prev;
          delete el.dataset.earthlinePrevPointer16914;
        }
      });
      window.EARTHLINE_NZ_OVERLAY_HIT_PASS_16914=false;
    }
  }catch(_){}
}
function earthlineVancouverVisibleContext16916(){
  try{
    const q=String(window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970?.query||'').trim().toLowerCase();
    const active=/vancouver\s+island/.test(q);
    let style=document.getElementById('earthlineVancouverVisibleContext16916');
    if(active){
      if(!style){
        style=document.createElement('style');
        style.id='earthlineVancouverVisibleContext16916';
        style.textContent=`
#earthlineRegionalVectorOverlay16020 [data-layer="directional-water-paths"] > path[stroke^="rgba(0,18,29"]{
  stroke-width:5px!important;opacity:.92!important
}
#earthlineRegionalVectorOverlay16020 [data-layer="directional-water-paths"] > path[stroke^="rgba(37,200,255"]{
  stroke-width:3px!important;opacity:1!important
}
#earthlineRegionalVectorOverlay16020 [data-layer="directional-water-paths"] > g{
  opacity:1!important
}
`;
        (document.head||document.documentElement).appendChild(style);
      }
      const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||null;
      if(m){
        const apply=()=>{
          try{
            if(m.getLayer('el-live-aquifer-fill-15970')){
              m.setLayoutProperty('el-live-aquifer-fill-15970','visibility','visible');
              m.setPaintProperty('el-live-aquifer-fill-15970','fill-color','#ff8c20');
              m.setPaintProperty('el-live-aquifer-fill-15970','fill-opacity',0.42);
              m.moveLayer('el-live-aquifer-fill-15970');
            }
            if(m.getLayer('el-live-aquifer-line-15970')){
              m.setLayoutProperty('el-live-aquifer-line-15970','visibility','visible');
              m.setPaintProperty('el-live-aquifer-line-15970','line-color','#ff9c21');
              m.setPaintProperty('el-live-aquifer-line-15970','line-width',4.2);
              m.setPaintProperty('el-live-aquifer-line-15970','line-opacity',1);
              m.moveLayer('el-live-aquifer-line-15970');
            }
            if(m.getLayer('el-live-flow-casing-15970')){m.setLayoutProperty('el-live-flow-casing-15970','visibility','visible');m.moveLayer('el-live-flow-casing-15970');}
            if(m.getLayer('el-live-flow-line-15970')){
              m.setLayoutProperty('el-live-flow-line-15970','visibility','visible');
              m.setPaintProperty('el-live-flow-line-15970','line-color','#25c8ff');
              m.setPaintProperty('el-live-flow-line-15970','line-width',['interpolate',['linear'],['zoom'],4,4.5,7,6,10,8]);
              m.setPaintProperty('el-live-flow-line-15970','line-opacity',1);
              m.moveLayer('el-live-flow-line-15970');
            }
            if(m.getLayer('el-live-flow-arrow-15970')){m.setLayoutProperty('el-live-flow-arrow-15970','visibility','visible');m.moveLayer('el-live-flow-arrow-15970');}
          }catch(_){}
        };
        apply();setTimeout(apply,300);setTimeout(apply,1200);setTimeout(apply,3000);
      }
      window.EARTHLINE_VANCOUVER_VISIBLE_CONTEXT_16916=true;
    }else{
      if(style)style.remove();
      window.EARTHLINE_VANCOUVER_VISIBLE_CONTEXT_16916=false;
    }
  }catch(_){}
}
function install(){installRail();modal();renderAccount();refreshSessionIfNeeded();earthlineVancouverVisibleContext16916();earthlineNzOverlayHitPass16914();document.addEventListener('change',e=>{syncLanguageFromTarget(e.target);earthlineNzOverlayHitPass16914()},true);document.addEventListener('click',e=>{syncLanguageFromTarget(e.target);earthlineNzOverlayHitPass16914()},true);document.addEventListener('pointerover',e=>{try{if(e.target?.closest?.('#earthlineRegionalVectorOverlay16020'))earthlineNzOverlayHitPass16914()}catch(_){}},true);document.addEventListener('earthline:analysis-complete',()=>{earthlineNzOverlayHitPass16914();setTimeout(earthlineNzOverlayHitPass16914,250)},{passive:true});document.addEventListener('earthline:analysis-complete',()=>{earthlineVancouverVisibleContext16916();setTimeout(earthlineVancouverVisibleContext16916,300);setTimeout(earthlineVancouverVisibleContext16916,1500)},{passive:true});new MutationObserver(()=>{const current=detectLang(document.documentElement.lang);if(current&&current!==launchLangOverride){launchLangOverride=current;renderAccount();scheduleTranslation()}}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});loadConfig();scheduleTranslation();installTelemetry();document.documentElement.dataset.earthlineLaunch16872='ready'}
window.EARTHLINE_LAUNCH_16872={build:BUILD,quota,consumePaidSearch,createAccount,signIn,signOut,openAccount,donateTarget,limits:()=>({...config}),isConfiguredDonation:()=>!!donateTarget(),translateVisibleText,centralClaim,track,refreshSessionIfNeeded};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();



/* EARTHLINE 16962 — preserve jurisdiction name in Property report identity.
   Presentation identity only; no hydrology, geometry, ranking, exclusions, search or science changes. */
(function installPropertyReportJurisdiction16962(){
  function install(){
    const original=window.earthlinePublishDisplayedRun16151;
    if(typeof original!=='function'||original.__earthline16962)return false;
    const wrapped=function(snapshot){
      let out=snapshot;
      try{
        const tier=String(snapshot?.tier||snapshot?.mode||'').toLowerCase();
        const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
        const state=String(pkg?.identity?.name||pkg?.location?.name||'').trim();
        if(tier==='property'&&state){
          const c=snapshot?.center||{},lat=Number(c.lat),lng=Number(c.lng);
          const coord=Number.isFinite(lat)&&Number.isFinite(lng)?lat.toFixed(5)+', '+lng.toFixed(5):String(snapshot?.query||'').replace(/^20-acre project area at\s*/i,'');
          const us=String(pkg?.identity?.countryCode||'').toLowerCase()==='us';
          out=Object.assign({},snapshot,{
            jurisdictionName:state,
            query:'20-acre project area · '+state+(us?' · USA':'')+(coord?' · '+coord:'')
          });
        }
      }catch(_){}
      return original.call(this,out);
    };
    wrapped.__earthline16962=true;
    wrapped.__earthline16962Original=original;
    window.earthlinePublishDisplayedRun16151=wrapped;
    window.EARTHLINE_PROPERTY_REPORT_IDENTITY_OWNER_16962='displayed-run-publication';
    return true;
  }
  const boot=()=>{if(install())return;for(const ms of [50,180,500,1200])setTimeout(install,ms)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* EARTHLINE REPORT RENDER OWNER 16960: index.html mapSvg */
window.EARTHLINE_REPORT_RENDER_OWNER_16960='index-mapSvg';

})();
/* EARTHLINE_PROCESS_RAIL_VISIBILITY_16997 — presentation only; no engine ownership. */
(function(){
  if(document.getElementById('earthlineProcessRailHide16997'))return;
  const style=document.createElement('style');
  style.id='earthlineProcessRailHide16997';
  style.textContent=`
body:has(#earthlineProcessPage16265.open) #earthlineLaunchLogin16872,
body:has(#earthlineProcessPage16265.open) #earthlineLaunchDonate16872,
body:has(#earthlineProcessPage16265.open) #earthlineLaunchMerch16872,
body:has(#earthlineSwalesPage16125.open) #earthlineLaunchLogin16872,
body:has(#earthlineSwalesPage16125.open) #earthlineLaunchDonate16872,
body:has(#earthlineSwalesPage16125.open) #earthlineLaunchMerch16872{
  display:none!important;
  visibility:hidden!important;
  pointer-events:none!important;
}`;
  (document.head||document.documentElement).appendChild(style);
})();


/* EARTHLINE_POSTHOG_WEB_ANALYTICS_17002
   Approved production instrumentation only.
   No hydrology, map, report, search, authentication, or presentation ownership. */
(function installEarthlinePostHog17002(){
  if(window.EARTHLINE_POSTHOG_17002)return;
  window.EARTHLINE_POSTHOG_17002={state:'loading',installedAt:new Date().toISOString()};
  try{
    const script=document.createElement('script');
    script.async=true;
    script.src='https://us.i.posthog.com/static/1/array.js';
    script.crossOrigin='anonymous';
    script.onload=function(){
      try{
        if(!window.posthog||typeof window.posthog.init!=='function')throw new Error('PostHog SDK unavailable after load');
        window.posthog.init('phc_ycTX68j6gPMpvd5TPjZrQJnm2fGHwcnaQ3Dvx4Rq66FU',{
          api_host:'https://us.i.posthog.com',
          person_profiles:'identified_only',
          capture_pageview:true,
          capture_pageleave:true,
          autocapture:true,
          disable_session_recording:true
        });
        window.EARTHLINE_POSTHOG_17002.state='ready';
      }catch(err){
        window.EARTHLINE_POSTHOG_17002.state='init-error';
        window.EARTHLINE_POSTHOG_17002.error=String(err&&err.message||err);
      }
    };
    script.onerror=function(){
      window.EARTHLINE_POSTHOG_17002.state='load-error';
    };
    (document.head||document.documentElement).appendChild(script);
  }catch(err){
    window.EARTHLINE_POSTHOG_17002.state='install-error';
    window.EARTHLINE_POSTHOG_17002.error=String(err&&err.message||err);
  }
})();


/* EARTHLINE_MOBILE_PRODUCTION_HOTFIX_17003
   Approved production mobile usability repair only.
   No hydrology, terrain, swale geometry, ranking, exclusions, recharge science,
   report science, search ownership, or map ownership changes. */
(function installEarthlineMobileProduction17003(){
  if(window.EARTHLINE_MOBILE_PRODUCTION_17003)return;
  const isMobile=()=>!!(window.matchMedia&&window.matchMedia('(max-width:760px)').matches);

  try{
    const viewport=document.querySelector('meta[name="viewport"]');
    if(viewport)viewport.setAttribute('content','width=device-width, initial-scale=1, viewport-fit=cover');
  }catch(_){}

  try{
    let style=document.getElementById('earthlineMobileProduction17003');
    if(!style){
      style=document.createElement('style');
      style.id='earthlineMobileProduction17003';
      style.textContent=`
@supports (height:100dvh){
  .main,.center,.map-area,#mapboxBase{height:100dvh!important;min-height:100dvh!important}
}
@media(max-width:760px){
  html,body{
    width:100%!important;height:100%!important;min-height:100%!important;
    overflow:hidden!important;overscroll-behavior:none!important;
    -webkit-text-size-adjust:100%!important;text-size-adjust:100%!important;
  }
  :root{--el-rail-16188:54px}
  .main,.center,.map-area,#mapboxBase{
    top:0!important;bottom:0!important;height:100dvh!important;min-height:100dvh!important;
  }
  #earthlineRail16188{
    position:fixed!important;
    left:0!important;right:auto!important;top:0!important;bottom:auto!important;
    width:var(--el-rail-16188)!important;min-width:var(--el-rail-16188)!important;max-width:var(--el-rail-16188)!important;
    height:100dvh!important;max-height:100dvh!important;
    transform:none!important;margin:0!important;
    align-items:center!important;box-sizing:border-box!important;
    gap:8px!important;
    padding-left:4px!important;padding-right:4px!important;
    padding-top:max(10px,env(safe-area-inset-top))!important;
    padding-bottom:max(10px,env(safe-area-inset-bottom))!important;
  }
  #earthlineRail16188 > *,
  #earthlineLaunchLogin16872,
  #earthlineLaunchDonate16872,
  #earthlineLaunchMerch16872{
    margin-left:auto!important;margin-right:auto!important;
    transform:none!important;align-self:center!important;
    max-width:46px!important;
  }
  html.earthline-panel-open-16188 #earthlineLaunchLogin16872,
  html.earthline-panel-open-16188 #earthlineLaunchDonate16872,
  html.earthline-panel-open-16188 #earthlineLaunchMerch16872{
    visibility:visible!important;opacity:1!important;pointer-events:auto!important;
  }
  #earthlinePanel16188{
    position:fixed!important;
    left:var(--el-rail-16188)!important;right:0!important;
    top:auto!important;bottom:0!important;
    width:calc(100vw - var(--el-rail-16188))!important;
    height:min(56dvh,520px)!important;max-height:min(56dvh,520px)!important;
    border-radius:16px 16px 0 0!important;
    box-shadow:0 -12px 36px rgba(0,0,0,.38)!important;
    transform:translateY(calc(100% + 10px))!important;
  }
  html.earthline-panel-open-16188 #earthlinePanel16188{
    transform:translateY(0)!important;
  }
  #earthlinePanelBody16188{
    min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;
    -webkit-overflow-scrolling:touch!important;overscroll-behavior:contain!important;
    padding-bottom:calc(26px + env(safe-area-inset-bottom))!important;
  }
  #earthlinePanelClose16188{
    width:44px!important;height:44px!important;
    top:max(6px,env(safe-area-inset-top))!important;right:8px!important;
    touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;
  }
  #earthlineSearchSlot16188 .searchbox.grow{
    width:100%!important;min-width:0!important;min-height:48px!important;
  }
  #earthlineSearchSlot16188 #searchInput{
    min-width:0!important;font-size:16px!important;line-height:1.25!important;
  }
  #earthlineSearchSlot16188 #runBtn,
  #earthlineDeclareProperty16169{
    min-height:46px!important;height:46px!important;max-height:46px!important;
    padding:0 12px!important;touch-action:manipulation!important;
    -webkit-tap-highlight-color:transparent!important;
  }
  #earthlineHamburgerMenu16233{
    left:calc(var(--el-rail-16188) + 6px)!important;
    top:max(62px,calc(env(safe-area-inset-top) + 56px))!important;
    min-width:0!important;width:min(260px,calc(100vw - var(--el-rail-16188) - 12px))!important;
    max-height:calc(100dvh - 76px - env(safe-area-inset-bottom))!important;overflow:auto!important;
  }
  #earthlineHamburgerMenu16233 a{min-height:44px!important}
  #earthlineRechargeDataModal16488{
    padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom)) 8px!important;
  }
  #earthlineRechargeDataShell16488{
    margin-left:var(--el-rail-16188)!important;
    width:calc(100vw - var(--el-rail-16188) - 8px)!important;
    max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 16px)!important;
    -webkit-overflow-scrolling:touch!important;
  }
  #earthlineRechargeDataClose16488{width:44px!important;height:44px!important}
  .mapboxgl-ctrl-group button,.mapboxgl-ctrl-zoom-in,.mapboxgl-ctrl-zoom-out{
    width:46px!important;height:46px!important;min-width:46px!important;min-height:46px!important;
  }
}
@media(max-width:420px){
  #earthlinePanelBody16188{padding-left:12px!important;padding-right:12px!important}
  #earthlinePanelBrand16201 .brand img{width:min(210px,100%)!important;max-height:78px!important}
  #earthlinePanelBrand16201 .mantra-primary{font-size:21px!important;white-space:normal!important}
}
`;
      (document.head||document.documentElement).appendChild(style);
    }
  }catch(_){}

  function returnToMap(){
    if(!isMobile())return;
    try{
      document.documentElement.classList.remove('earthline-panel-open-16188');
      document.getElementById('earthlineRailSearch16188')?.classList.remove('active');
    }catch(_){}
    setTimeout(()=>{
      try{
        const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
        if(m&&typeof m.resize==='function')m.resize();
      }catch(_){}
    },220);
  }

  document.addEventListener('earthline:analysis-complete',returnToMap,{passive:true});

  function mobileZoomFeedback(){
    if(!isMobile())return null;
    let el=document.getElementById('earthlineMobileZoomSpinner17003');
    if(!el){
      el=document.createElement('div');
      el.id='earthlineMobileZoomSpinner17003';
      el.setAttribute('role','status');
      el.setAttribute('aria-live','polite');
      el.innerHTML='<span aria-hidden="true"></span><b>ZOOMING TO LOCATION…</b>';
      document.body.appendChild(el);
      const style=document.createElement('style');
      style.id='earthlineMobileZoomSpinnerStyle17003';
      style.textContent=`
@media(max-width:760px){
  #earthlineMobileZoomSpinner17003{
    position:fixed;left:calc(var(--el-rail-16188) + 12px);top:max(14px,env(safe-area-inset-top));
    z-index:2147482700;display:none;align-items:center;gap:9px;
    padding:10px 13px;border:1px solid rgba(113,203,244,.72);border-radius:999px;
    background:rgba(7,20,29,.94);color:#effaff;
    font:850 11px/1 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35);
    pointer-events:none
  }
  #earthlineMobileZoomSpinner17003.open{display:flex}
  #earthlineMobileZoomSpinner17003 span{
    width:16px;height:16px;border-radius:50%;
    border:2px solid rgba(255,255,255,.28);border-top-color:#fff;
    animation:earthlineMobileSpin17003 .72s linear infinite
  }
  @keyframes earthlineMobileSpin17003{to{transform:rotate(360deg)}}
`;
      (document.head||document.documentElement).appendChild(style);
    }
    el.classList.add('open');
    clearTimeout(el._earthlineTm17003);
    const done=()=>{el.classList.remove('open');try{m?.off?.('moveend',done);m?.off?.('idle',done)}catch(_){}};
    let m=null;try{m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)}catch(_){}
    try{m?.once?.('moveend',done);m?.once?.('idle',done)}catch(_){}
    el._earthlineTm17003=setTimeout(done,5000);
    return el;
  }
  document.addEventListener('click',e=>{
    if(!isMobile())return;
    const b=e.target?.closest?.('button,[role="button"],a');
    if(!b)return;
    const label=String(b.getAttribute?.('aria-label')||b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    if(label.includes('zoom to location')||label.includes('zoom to selected')||label==='zoom'){
      mobileZoomFeedback();
    }
  },true);

  function audit(){
    const box=id=>{const el=document.getElementById(id);if(!el)return null;const r=el.getBoundingClientRect();return {width:Math.round(r.width),height:Math.round(r.height)}};
    return {
      build:'17003',
      mobile:isMobile(),
      viewport:document.querySelector('meta[name="viewport"]')?.getAttribute('content')||null,
      dynamicViewport:!!(window.CSS&&CSS.supports&&CSS.supports('height','100dvh')),
      run:box('runBtn'),
      property:box('earthlineDeclareProperty16169'),
      panelClose:box('earthlinePanelClose16188'),
      dataClose:box('earthlineRechargeDataClose16488'),
      panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188')
    };
  }
  window.earthlineMobileAudit17003=audit;
  window.EARTHLINE_MOBILE_PRODUCTION_17003={state:'ready',installedAt:new Date().toISOString(),audit};
})();


/* EARTHLINE_MOBILE_ORB_BUSY_RESTORE_17010
   Mobile presentation-only repair.
   Reuses existing authoritative busy attributes; no new run lifecycle owner. */
(function installEarthlineMobileOrbBusy17010(){
  if(window.EARTHLINE_MOBILE_ORB_BUSY_RESTORE_17010)return;
  try{
    const style=document.createElement('style');
    style.id='earthlineMobileOrbBusy17010';
    style.textContent=`
@media(max-width:760px){
  #runBtn[data-busy="1"] > i.earthline-orb-shell-16244,
  #runBtn[aria-busy="true"] > i.earthline-orb-shell-16244,
  #earthlineDeclareProperty16169[data-busy="1"] > i.earthline-orb-shell-16244,
  #earthlineDeclareProperty16169[data-terminal-running="1"] > i.earthline-orb-shell-16244,
  #earthlineDeclareProperty16169[aria-busy="true"] > i.earthline-orb-shell-16244{
    animation:earthlineOrbCounterClockwise16245 1.05s linear infinite!important;
    transform-origin:50% 50%!important;
    will-change:transform!important;
  }
}
`;
    (document.head||document.documentElement).appendChild(style);
    window.EARTHLINE_MOBILE_ORB_BUSY_RESTORE_17010={state:'ready'};
  }catch(err){
    window.EARTHLINE_MOBILE_ORB_BUSY_RESTORE_17010={state:'error',error:String(err&&err.message||err)};
  }
})();

/* EARTHLINE_MOBILE_PANEL_STACK_17004
   Authoritative mobile presentation owner.
   Phone web/PWA shell only: fixed task rail + map-first viewport + one contextual
   bottom sheet. Desktop and all hydrology/search/science owners remain unchanged. */
(function installEarthlineMobilePanelStack17004(){
  if(window.EARTHLINE_MOBILE_PANEL_STACK_17004?.version==='map-first-2')return;
  const isMobile=()=>!!(window.matchMedia&&window.matchMedia('(max-width:760px)').matches);
  const root=document.documentElement;
  let busyTimer=0;

  try{
    const old=document.getElementById('earthlineMobilePanelStack17004');
    if(old)old.remove();
    const style=document.createElement('style');
    style.id='earthlineMobilePanelStack17004';
    style.textContent=`
@media(max-width:760px){
  :root{--el-mobile-rail:54px;--el-mobile-sheet-h:min(64dvh,580px)}

  /* The task rail is viewport-owned. Search/results/report state cannot move it. */
  #earthlineRail16188{
    position:fixed!important;
    left:0!important;right:auto!important;top:0!important;bottom:auto!important;
    width:var(--el-mobile-rail)!important;min-width:var(--el-mobile-rail)!important;max-width:var(--el-mobile-rail)!important;
    height:100dvh!important;max-height:100dvh!important;
    box-sizing:border-box!important;
    transform:none!important;translate:none!important;
    margin:0!important;padding-left:4px!important;padding-right:4px!important;
    align-items:center!important;
    z-index:2147482400!important;
  }
  #earthlineRail16188 > *,
  #earthlineRail16188 > .earthline-launch-rail-btn-16872,
  #earthlineLaunchLogin16872,#earthlineLaunchDonate16872,#earthlineLaunchMerch16872{
    position:static!important;
    left:auto!important;right:auto!important;
    margin-left:0!important;margin-right:0!important;
    transform:none!important;translate:none!important;
    align-self:center!important;
  }
  #earthlineLaunchFallbackRail16872{
    position:fixed!important;left:0!important;right:auto!important;transform:none!important;
    width:var(--el-mobile-rail)!important;max-width:var(--el-mobile-rail)!important;
  }

  /* One mobile contextual sheet. The map remains visible above it. */
  #earthlinePanel16188{
    position:fixed!important;
    left:var(--el-mobile-rail)!important;right:0!important;
    top:auto!important;bottom:0!important;
    width:calc(100vw - var(--el-mobile-rail))!important;
    max-width:calc(100vw - var(--el-mobile-rail))!important;
    height:var(--el-mobile-sheet-h)!important;
    max-height:calc(100dvh - 12px)!important;
    border-radius:18px 18px 0 0!important;
    overflow:hidden!important;
    transform:translateY(105%)!important;
    opacity:0!important;visibility:hidden!important;pointer-events:none!important;
    transition:transform .18s ease,opacity .14s ease!important;
    z-index:2147482500!important;
    box-shadow:0 -10px 32px rgba(0,0,0,.38)!important;
  }
  html.earthline-panel-open-16188 #earthlinePanel16188{
    transform:translateY(0)!important;
    opacity:1!important;visibility:visible!important;pointer-events:auto!important;
  }
  #earthlinePanelBody16188{
    height:100%!important;max-height:100%!important;
    overflow-y:auto!important;overflow-x:hidden!important;
    padding-bottom:max(22px,calc(14px + env(safe-area-inset-bottom)))!important;
  }

  /* The rail remains visible; overlapping map controls do not. */
  html.earthline-panel-open-16188 #earthlineRail16188,
  html.earthline-panel-open-16188 #earthlineLaunchFallbackRail16872{
    opacity:1!important;visibility:visible!important;pointer-events:auto!important;
  }
  html.earthline-panel-open-16188 .mapboxgl-ctrl-bottom-left,
  html.earthline-panel-open-16188 .mapboxgl-ctrl-bottom-right{
    opacity:0!important;visibility:hidden!important;pointer-events:none!important;
  }

  /* Mobile next-action control: no need to reopen navigation after zoom. */
  #earthlineMobilePropertyAction17004{
    position:fixed!important;
    left:calc(var(--el-mobile-rail) + 12px)!important;right:12px!important;
    bottom:max(14px,env(safe-area-inset-bottom))!important;
    min-height:48px!important;
    display:none!important;
    align-items:center!important;justify-content:center!important;
    border:1px solid rgba(78,201,255,.78)!important;border-radius:14px!important;
    background:rgba(9,40,56,.96)!important;color:#effbff!important;
    font:850 12px/1.15 system-ui,-apple-system,"Segoe UI",sans-serif!important;
    letter-spacing:.035em!important;padding:10px 14px!important;
    box-shadow:0 9px 26px rgba(0,0,0,.38)!important;
    z-index:2147482300!important;
    touch-action:manipulation!important;
  }
  html.earthline-property-ready-16188:not(.earthline-panel-open-16188) #earthlineMobilePropertyAction17004{
    display:flex!important;
  }
  html[data-earthline-analysis-tier="property"] #earthlineMobilePropertyAction17004{
    display:none!important;
  }

  #earthlineMobileBusy17004{
    position:fixed!important;
    left:calc(var(--el-mobile-rail) + 50%)!important;
    top:max(14px,env(safe-area-inset-top))!important;
    transform:translateX(-50%)!important;
    display:none!important;align-items:center!important;gap:8px!important;
    min-height:38px!important;padding:8px 12px!important;
    border:1px solid rgba(78,201,255,.60)!important;border-radius:999px!important;
    background:rgba(8,24,34,.96)!important;color:#edfaff!important;
    font:800 11px/1 system-ui,-apple-system,"Segoe UI",sans-serif!important;
    z-index:2147482750!important;
    box-shadow:0 7px 22px rgba(0,0,0,.35)!important;
    pointer-events:none!important;
  }
  #earthlineMobileBusy17004.open{display:flex!important}
  #earthlineMobileBusy17004::before{
    content:""!important;width:14px!important;height:14px!important;border-radius:50%!important;
    border:2px solid rgba(255,255,255,.28)!important;border-top-color:#4ec9ff!important;
    animation:earthlineMobileBusy17004 .72s linear infinite!important;
  }
  @keyframes earthlineMobileBusy17004{to{transform:rotate(360deg)}}

  /* Keep corridor/detail overlays above the sheet when the map is the active task. */
  #earthlineCorridorDetail16149{z-index:2147482700!important}
}
@media(max-width:420px){
  :root{--el-mobile-sheet-h:min(66dvh,560px)}
}
`;
    (document.head||document.documentElement).appendChild(style);
  }catch(err){}

  function panelOpen(){return root.classList.contains('earthline-panel-open-16188')}
  function closeSheet(){
    if(!isMobile())return;
    try{
      root.classList.remove('earthline-panel-open-16188');
      document.getElementById('earthlineRailSearch16188')?.classList.remove('active');
      setTimeout(()=>{try{(window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null))?.resize?.()}catch(_){}},180);
    }catch(_){}
  }
  function ensurePropertyAction(){
    if(!isMobile())return null;
    let b=document.getElementById('earthlineMobilePropertyAction17004');
    if(!b){
      b=document.createElement('button');
      b.id='earthlineMobilePropertyAction17004';
      b.type='button';
      b.textContent='ANALYZE 20-ACRE PROPERTY';
      b.setAttribute('aria-label','Analyze 20-acre property at selected location');
      b.addEventListener('click',async()=>{
        if(!isMobile())return;
        showBusy('ANALYZING PROPERTY…',15000);
        try{
          const original=document.getElementById('earthlineDeclareProperty16169');
          if(original){original.click();return}
          if(typeof window.earthlineDeclarePropertyAtCrosshair16169==='function')
            await window.earthlineDeclarePropertyAtCrosshair16169();
        }catch(_){hideBusy()}
      });
      document.body.appendChild(b);
    }
    return b;
  }
  function ensureBusy(){
    if(!isMobile())return null;
    let b=document.getElementById('earthlineMobileBusy17004');
    if(!b){b=document.createElement('div');b.id='earthlineMobileBusy17004';b.setAttribute('role','status');b.setAttribute('aria-live','polite');document.body.appendChild(b)}
    return b;
  }
  function showBusy(label='LOADING…',maxMs=12000){
    if(!isMobile())return;
    const b=ensureBusy();b.textContent=label;b.classList.add('open');
    clearTimeout(busyTimer);
    busyTimer=setTimeout(hideBusy,maxMs);
  }
  function hideBusy(){clearTimeout(busyTimer);const b=ensureBusy();if(b)b.classList.remove('open')}

  function targetIsCorridor(el){
    if(!el)return false;
    const a=el.closest?.('[aria-label^="Open details for A"],[aria-label^="Open details for B"],[aria-label^="Open details for C"],.earthline-swale-hit-16070,.earthline-swale-label-16149');
    return !!a;
  }
  function targetIsZoom(el){
    const c=el?.closest?.('button,[role="button"],a');
    if(!c)return false;
    const txt=String(c.textContent||c.getAttribute?.('aria-label')||'').replace(/\s+/g,' ').trim();
    return /zoom\s+to\s+location/i.test(txt);
  }

  document.addEventListener('click',e=>{
    if(!isMobile())return;
    if(e.target?.closest?.('#earthlineRailSearch16188'))root.classList.remove('earthline-mobile-zoom-active-17014');
    if(targetIsCorridor(e.target)){
      setTimeout(closeSheet,0);
      return;
    }
    if(targetIsZoom(e.target)){
      root.classList.add('earthline-mobile-zoom-active-17014');
      showBusy('ZOOMING TO LOCATION…',10000);
      closeSheet();
      try{
        const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
        if(m?.once)m.once('moveend',()=>setTimeout(hideBusy,120));
        else setTimeout(hideBusy,1200);
      }catch(_){setTimeout(hideBusy,1200)}
    }
  },true);

  document.addEventListener('pointerdown',e=>{
    if(!isMobile()||!panelOpen())return;
    const map=e.target?.closest?.('#mapboxBase,.mapboxgl-canvas-container,.mapboxgl-canvas');
    const control=e.target?.closest?.('.mapboxgl-control-container,.mapboxgl-ctrl,.mapboxgl-popup,#earthlineMobilePropertyAction17004,#earthlineMobileBusy17004');
    if(map&&!control)closeSheet();
  },true);

  document.addEventListener('earthline:analysis-complete',()=>{
    if(!isMobile())return;
    hideBusy();
    closeSheet();
  },{passive:true});

  const observer=new MutationObserver(()=>{
    if(!isMobile())return;
    ensurePropertyAction();
    if(String(root.dataset.earthlineAnalysisTier||'').toLowerCase()==='property')hideBusy();
  });

  function audit(){
    const box=id=>{const el=document.getElementById(id);if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),display:s.display,visibility:s.visibility,opacity:s.opacity}};
    return {
      version:'map-first-2',mobile:isMobile(),panelOpen:panelOpen(),
      rail:box('earthlineRail16188'),panel:box('earthlinePanel16188'),
      login:box('earthlineLaunchLogin16872'),donate:box('earthlineLaunchDonate16872'),merch:box('earthlineLaunchMerch16872'),
      propertyAction:box('earthlineMobilePropertyAction17004'),busy:box('earthlineMobileBusy17004')
    };
  }

  window.EARTHLINE_MOBILE_PANEL_STACK_17004={state:'ready',version:'map-first-2',closeSheet,showBusy,hideBusy,audit};
  const boot=()=>{
    if(isMobile()){ensurePropertyAction();ensureBusy();}
    try{observer.observe(root,{attributes:true,attributeFilter:['class','data-earthline-analysis-tier']});observer.observe(document.body,{childList:true,subtree:true})}catch(_){}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();


/* EARTHLINE_RETIRE_PUBLIC_COVERAGE_UI_17005
   Production cleanup for the historical BUILD-CHECK-15803 diagnostic UI.
   Internal coverage diagnostics remain available; the public WHY NOT HERE
   black map box is retired at its runtime owner. */
(function retirePublicCoverageUI17005(){
  function retire(){
    try{
      window.earthlineInstallCoverageUI15803=function(){
        try{document.getElementById('earthlineWhyNotHere15803')?.remove();}catch(_){}
      };
      document.getElementById('earthlineWhyNotHere15803')?.remove();
      window.EARTHLINE_PUBLIC_COVERAGE_UI_17005='retired';
    }catch(_){}
  }
  retire();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(retire,0),{once:true});
  }else{
    setTimeout(retire,0);
  }
})();


/* EARTHLINE_MOBILE_SEARCH_TOUCH_17007
   Mobile presentation/input repair only.
   The existing autocomplete owner remains authoritative; this enforces its
   touch surface above the mobile contextual sheet even when search rebuilds CSS. */
(function installEarthlineMobileSearchTouch17007(){
  if(window.EARTHLINE_MOBILE_SEARCH_TOUCH_17007)return;
  const isMobile=()=>!!(window.matchMedia&&window.matchMedia('(max-width:760px)').matches);
  function enforce(){
    if(!isMobile())return false;
    const box=document.getElementById('earthlineSearchSuggestions15970');
    if(!box)return false;
    try{
      box.style.setProperty('z-index','2147482650','important');
      box.style.setProperty('pointer-events','auto','important');
      box.style.setProperty('touch-action','manipulation','important');
      for(const el of box.querySelectorAll('[role="option"],button')){
        el.style.setProperty('pointer-events','auto','important');
        el.style.setProperty('touch-action','manipulation','important');
        el.style.setProperty('-webkit-tap-highlight-color','transparent','important');
      }
      requestAnimationFrame(()=>{
        try{
          if(!box.classList.contains('open'))return;
          const input=document.getElementById('searchInput');
          const ir=input?.getBoundingClientRect(),br=box.getBoundingClientRect();
          const vh=Math.round(window.visualViewport?.height||window.innerHeight||0);
          const topOffset=Math.round(window.visualViewport?.offsetTop||0);
          const bottomLimit=topOffset+vh-8;
          if(ir&&br.height>0&&br.bottom>bottomLimit){
            const above=Math.max(topOffset+8,Math.round(ir.top-br.height-8));
            box.style.setProperty('top',above+'px','important');
            box.style.setProperty('bottom','auto','important');
            box.style.setProperty('max-height',Math.max(96,Math.min(240,ir.top-topOffset-16))+'px','important');
            box.style.setProperty('overflow-y','auto','important');
          }
        }catch(_){}
      });
      return true;
    }catch(_){return false}
  }
  try{
    const style=document.createElement('style');
    style.id='earthlineMobileSearchTouch17007';
    style.textContent=`
@media(max-width:760px){
  #earthlineSearchSuggestions15970{
    z-index:2147482650!important;
    pointer-events:auto!important;
    touch-action:manipulation!important;
    -webkit-tap-highlight-color:transparent!important;
  }
  #earthlineSearchSuggestions15970 [role="option"],
  #earthlineSearchSuggestions15970 button{
    pointer-events:auto!important;
    touch-action:manipulation!important;
    -webkit-tap-highlight-color:transparent!important;
  }
}
`;
    (document.head||document.documentElement).appendChild(style);
  }catch(_){}
  const observer=new MutationObserver(()=>enforce());
  const boot=()=>{
    enforce();
    try{observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']})}catch(_){}
    document.addEventListener('input',e=>{if(e.target?.id==='searchInput')requestAnimationFrame(enforce)},true);
    document.addEventListener('focusin',e=>{if(e.target?.id==='searchInput')requestAnimationFrame(enforce)},true);
    document.addEventListener('touchstart',e=>{
      if(e.target?.closest?.('#earthlineSearchSuggestions15970'))enforce();
    },{capture:true,passive:true});
  };
  window.EARTHLINE_MOBILE_SEARCH_TOUCH_17007={state:'ready',enforce};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* EARTHLINE_BIOSWALE_REPORT_TOOLBAR_RESTORE_17008
   Restores the previously approved Bioswale Impact Report toolbar actions:
   Print / Save PDF, Open in New Tab, Download HTML, Close.
   Presentation/export only; report science and analysis state are unchanged. */
(function installEarthlineBioswaleReportToolbar17008(){
  if(window.EARTHLINE_BIOSWALE_REPORT_TOOLBAR_RESTORE_17008)return;

  function esc(s){
    return String(s||'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  }
  function reportPanel(){return document.getElementById('earthlineVermontReportPanel16149')}
  function reportStandaloneHtml(){
    const panel=reportPanel();
    const report=panel?.querySelector('.el49-report');
    const shell=panel?.querySelector('.el49-shell');
    const body=(report||shell||panel)?.outerHTML||'';
    const styles=[...document.querySelectorAll('style')].map(s=>s.outerHTML).join('\n');
    const links=[...document.querySelectorAll('link[rel="stylesheet"]')].map(l=>l.outerHTML).join('\n');
    const title=panel?.querySelector('.el49-toolbar strong')?.textContent?.trim()||'Earthline Bioswale Impact Report';
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title>'+links+styles+'</head><body>'+body+'</body></html>';
  }
  function openTab(){
    const child=window.open('','_blank');
    if(!child)return false;
    try{
      child.document.open();
      child.document.write(reportStandaloneHtml());
      child.document.close();
      return true;
    }catch(_){try{child.close()}catch(__){};return false}
  }
  function downloadHtml(){
    try{
      const snap=window.EARTHLINE_FROZEN_REPORT_SNAPSHOT_16149||window.EARTHLINE_FROZEN_REPORT_SNAPSHOT_16151||null;
      const raw=String(snap?.reportId||'Earthline-Bioswale-Impact-Report').replace(/[^A-Za-z0-9._-]+/g,'-');
      const blob=new Blob([reportStandaloneHtml()],{type:'text/html;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;a.download=raw+'.html';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      return true;
    }catch(_){return false}
  }
  function button(label,action,primary){
    const b=document.createElement('button');
    b.type='button';
    b.className='el49-tool'+(primary?' primary':'');
    b.dataset.action=action;
    b.textContent=label;
    return b;
  }
  function ensure(){
    const panel=reportPanel();
    if(!panel)return false;
    const actions=panel.querySelector('.el49-toolbar-actions');
    if(!actions)return false;
    const close=actions.querySelector('[data-action="close"],.el49-close');
    const wanted=[
      ['Print / Save PDF','print',true],
      ['Open in New Tab','newtab',false],
      ['Download HTML','download',false]
    ];
    for(const [label,action,primary] of wanted){
      if(actions.querySelector('[data-action="'+action+'"]'))continue;
      const b=button(label,action,primary);
      if(close)actions.insertBefore(b,close);else actions.appendChild(b);
    }
    const p=actions.querySelector('[data-action="print"]');
    const n=actions.querySelector('[data-action="newtab"]');
    const d=actions.querySelector('[data-action="download"]');
    if(p&&!p.__earthline17008){p.__earthline17008=true;p.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.print()})}
    if(n&&!n.__earthline17008){n.__earthline17008=true;n.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openTab()})}
    if(d&&!d.__earthline17008){d.__earthline17008=true;d.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();downloadHtml()})}
    try{
      let style=document.getElementById('earthlineBioswaleReportToolbar17008');
      if(!style){
        style=document.createElement('style');
        style.id='earthlineBioswaleReportToolbar17008';
        style.textContent=`
@media(max-width:760px){
  #earthlineVermontReportPanel16149 .el49-toolbar{
    align-items:flex-start!important;
    gap:8px!important;
    padding:max(10px,env(safe-area-inset-top)) 10px 10px!important;
  }
  #earthlineVermontReportPanel16149 .el49-toolbar-actions{
    display:flex!important;
    justify-content:flex-end!important;
    gap:6px!important;
    flex-wrap:wrap!important;
    max-width:58%!important;
  }
  #earthlineVermontReportPanel16149 .el49-tool{
    min-height:38px!important;
    padding:8px 10px!important;
    font-size:11px!important;
    line-height:1.1!important;
    touch-action:manipulation!important;
  }
  #earthlineVermontReportPanel16149 .el49-close{
    width:38px!important;min-width:38px!important;padding:0!important;
  }
}
`;
        (document.head||document.documentElement).appendChild(style);
      }
    }catch(_){}
    window.EARTHLINE_BIOSWALE_REPORT_TOOLBAR_RESTORE_17008.state='ready';
    return true;
  }

  window.EARTHLINE_BIOSWALE_REPORT_TOOLBAR_RESTORE_17008={state:'installing',ensure,openTab,downloadHtml};
  const schedule=()=>{for(const ms of [0,40,140,400])setTimeout(ensure,ms)};
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#earthlineVermontReport16149'))schedule();
  },true);
  const obs=new MutationObserver(()=>{const p=reportPanel();if(p?.classList?.contains('open'))ensure()});
  const boot=()=>{obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});schedule()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();


/* EARTHLINE_PROPERTY_FALLBACK_FAIL_VISIBLE_17011
   Presentation-only fail-visible guard.
   It does not render, generate, rank, filter, or replace any Property swale.
   The existing 16236 natural-texture owner remains authoritative. When that
   optional texture has not verified, keep its existing authoritative safe-line
   fallback visible instead of allowing both presentations to be transparent. */
(function installEarthlinePropertyFallbackFailVisible17011(){
  if(window.EARTHLINE_PROPERTY_FALLBACK_FAIL_VISIBLE_17011)return;
  const SAFE=[
    'earthline-property-safe-casing-16221',
    'earthline-property-safe-earth-16221',
    'earthline-property-safe-life-16221',
    'earthline-property-safe-water-16221'
  ];
  function map(){try{return window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)}catch(_){return null}}
  function propertyPublished(){
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||a?.publicationAudit||null;
    return String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase()==='property' &&
      a?.settled===true && a?.result===true && p?.published===true && Number(p?.safeCount||p?.publicationCount||0)>0;
  }
  function textureVerified(){
    const run=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const t=run?.texture||null;
    if(t?.ok===true && Number(t?.sourceFeatures||0)>0 && t?.layersReady===true && t?.imagesReady===true)return true;
    try{
      const a=typeof window.earthlinePropertyTextureAudit16169==='function'?window.earthlinePropertyTextureAudit16169():null;
      const x=a?.texture||null;
      return !!(x && Number(a?.sourceFeatures||0)>0 && x.imagesReady===true &&
        x.orientationComplete===true && x.layers &&
        Object.values(x.layers).every(Boolean));
    }catch(_){return false}
  }
  function enforce(reason='check'){
    const m=map();
    if(!m||!propertyPublished())return false;
    const textureReady=textureVerified();
    let changed=0;
    if(textureReady){
      /* EARTHLINE 17045 — presentation ownership is exclusive. Once the approved
         natural-texture owner verifies, explicitly relinquish the solid safe-line
         fallback. Geometry, ranking, safety and publication remain unchanged. */
      for(const id of SAFE){
        try{
          if(!m.getLayer?.(id))continue;
          const opacity=m.getPaintProperty?.(id,'line-opacity');
          if(opacity!==0){m.setPaintProperty(id,'line-opacity',0);changed++}
        }catch(_){}
      }
      window.EARTHLINE_PROPERTY_FALLBACK_FAIL_VISIBLE_17011.last={
        reason,changed,textureVerified:true,relinquished:true,
        safeCount:Number((window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||{}).safeCount||0),
        at:new Date().toISOString()
      };
      return changed>0;
    }
    for(const id of SAFE){
      try{
        if(!m.getLayer?.(id))continue;
        m.setLayoutProperty?.(id,'visibility','visible');
        const opacity=m.getPaintProperty?.(id,'line-opacity');
        if(opacity===0||opacity==null){m.setPaintProperty(id,'line-opacity',.98);changed++}
        m.moveLayer?.(id);
      }catch(_){}
    }
    window.EARTHLINE_PROPERTY_FALLBACK_FAIL_VISIBLE_17011.last={
      reason,changed,textureVerified:false,relinquished:false,
      safeCount:Number((window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||{}).safeCount||0),
      at:new Date().toISOString()
    };
    return changed>0;
  }
  function afterPublication(reason){
    /* EARTHLINE 17016 — use the existing bounded settlement schedule to give the
       approved natural-texture owner a post-publication chance to consume the
       already-verified Property geometry. If texture still cannot verify, the
       existing fail-visible fallback remains authoritative and visible. */
    for(const ms of [0,120,450,1100])setTimeout(async()=>{
      try{
        const syncTexture=window.earthlineSyncPropertyTexture16169;
        if(typeof syncTexture==='function')
          await Promise.resolve(syncTexture(reason+'-texture-'+ms+'-force'));
      }catch(_){}
      enforce(reason+'-'+ms);
    },ms);
  }
  window.EARTHLINE_PROPERTY_FALLBACK_FAIL_VISIBLE_17011={state:'ready',enforce,textureVerified};
  document.addEventListener('earthline:analysis-complete',()=>{
    if(String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase()==='property')
      afterPublication('analysis-complete');
  },{passive:true});
})();


/* EARTHLINE_SWALE_PRINCIPLE_COPY_17013
   Requested copy correction only: Earthline follows/uses the principle;
   this must not imply Earthline originated the concept. */
(function(){
  if(window.EARTHLINE_SWALE_PRINCIPLE_COPY_17013)return;
  const FROM1='Earthline’s three-word principle describes the sequence:';
  const FROM2="Earthline's three-word principle describes the sequence:";
  const TO='Earthline follows this three-word principle:';
  function apply(){
    const page=document.getElementById('earthlineSwalesPage16125');
    if(!page)return false;
    const walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);
    let node,changed=false;
    while((node=walker.nextNode())){
      const v=String(node.nodeValue||'');
      if(v.includes(FROM1)||v.includes(FROM2)){
        node.nodeValue=v.replace(FROM1,TO).replace(FROM2,TO);
        changed=true;
      }
    }
    return changed;
  }
  window.EARTHLINE_SWALE_PRINCIPLE_COPY_17013={state:'ready',apply};
  const boot=()=>{apply();document.addEventListener('click',e=>{
    const el=e.target?.closest?.('button,a,[role="button"]');
    const label=String(el?.textContent||el?.getAttribute?.('aria-label')||'').replace(/\s+/g,' ').trim();
    if(/how\s+bioswales\s+work/i.test(label))setTimeout(apply,0);
  },true);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();


/* EARTHLINE_ALASKA_DATELINE_LABEL_PROJECTION_17015
   Alaska-only presentation repair.
   Normalizes longitudes to the current Mapbox world copy before custom overlay
   projection so Regional A1-A30 labels/hit geometry cannot jump across the
   antimeridian. No hydrology, ranking, geometry generation, or other state changes. */
(function installEarthlineAlaskaProjection17015(){
  if(window.EARTHLINE_ALASKA_DATELINE_LABEL_PROJECTION_17015)return;
  function isAlaska(){
    try{
      const q=String(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.query||'');
      if(/\balaska\b/i.test(q))return true;
      const p=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      return /\balaska\b/i.test(String(p?.identity?.name||p?.location?.name||''));
    }catch(_){return false}
  }
  function install(){
    let m=null;try{m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)}catch(_){}
    if(!m||typeof m.project!=='function')return false;
    if(m.project.__earthlineAlaska17015)return true;
    const original=m.project.bind(m);
    const wrapped=function(input){
      if(!isAlaska())return original(input);
      try{
        const center=Number(m.getCenter?.().lng);
        if(!Number.isFinite(center))return original(input);
        let lng,lat,kind='object';
        if(Array.isArray(input)){lng=Number(input[0]);lat=Number(input[1]);kind='array'}
        else{lng=Number(input?.lng);lat=Number(input?.lat)}
        if(!Number.isFinite(lng)||!Number.isFinite(lat))return original(input);
        while(lng-center>180)lng-=360;
        while(lng-center<-180)lng+=360;
        return original(kind==='array'?[lng,lat]:{lng,lat});
      }catch(_){return original(input)}
    };
    wrapped.__earthlineAlaska17015=true;
    wrapped.__earthlineAlaska17015Original=original;
    m.project=wrapped;
    return true;
  }
  window.EARTHLINE_ALASKA_DATELINE_LABEL_PROJECTION_17015={state:'ready',install,isAlaska};
  const boot=()=>{if(install())return;for(const ms of [50,180,500,1200,2500])setTimeout(install,ms)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  document.addEventListener('earthline:analysis-complete',()=>{install();},{passive:true});
})();


/* EARTHLINE_REGIONAL_PROPERTY_PARENT_REBIND_17016
   Handoff-only repair. The governed Property owner remains authoritative.
   A missing corridor parent token may be rebound only when the canonical
   displayed Regional result, cached live Regional result, active run token,
   and published state already agree. A non-empty mismatched token is never
   rewritten and therefore continues to fail closed in EARTHLINE 16347. */
(function installEarthlineRegionalPropertyParentRebind17016(){
  if(window.EARTHLINE_REGIONAL_PROPERTY_PARENT_REBIND_17016)return;
  const prior=window.earthlineDeclarePropertyAtCrosshair16173;
  if(typeof prior!=='function'){
    window.EARTHLINE_REGIONAL_PROPERTY_PARENT_REBIND_17016={state:'unavailable',reason:'governed Property owner unavailable'};
    return;
  }
  window.earthlineDeclarePropertyAtCrosshair16173=function(){
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    let rebound=false,canonical=false,token='',liveToken='',activeToken='',tier='',published=false;
    if(target&&target.code&&!String(target.parentRunToken||'')){
      const displayed=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const live=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
      tier=String(displayed&&(displayed.tier||displayed.mode)||'').toLowerCase();
      token=String(displayed&&displayed.runToken||'');
      liveToken=String(live&&live.runToken||'');
      activeToken=String(window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||'');
      published=String(document.documentElement.dataset.earthlineRunState||'')==='published';
      canonical=tier==='regional'&&!!token&&token===liveToken&&token===activeToken&&published;
      if(canonical){
        target.parentRunToken=token;
        rebound=true;
      }
    }
    window.EARTHLINE_REGIONAL_PROPERTY_PARENT_REBIND_17016.last={
      rebound,canonical,tier,token:token||null,liveToken:liveToken||null,
      activeToken:activeToken||null,published,
      targetCode:target&&target.code?String(target.code):null,
      existingParent:target&&target.parentRunToken?String(target.parentRunToken):null,
      at:new Date().toISOString()
    };
    return prior.apply(this,arguments);
  };
  window.EARTHLINE_REGIONAL_PROPERTY_PARENT_REBIND_17016={
    state:'ready',
    rule:'missing parent token only; canonical published Regional owners must agree; non-empty mismatches remain fail-closed'
  };
})();
