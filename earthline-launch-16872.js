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
function donateTarget(){try{return String(window.EARTHLINE_DONATE_URL_16872||localStorage.getItem('earthlineDonateUrl16872')||'')}catch(_){return String(window.EARTHLINE_DONATE_URL_16872||'')}}
function donate(){track('donate_click');const u=donateTarget();if(u){window.open(u,'_blank','noopener');return}window.open('donate.html','_blank','noopener')}
function installRail(){if(document.getElementById('earthlineLaunchLogin16872'))return;const rail=document.getElementById('earthlineRail16188');const contact=document.getElementById('earthlineRailContact16512');const host=rail||contact?.parentElement||document.body;const mk=(id,txt)=>{const b=document.createElement('button');b.id=id;b.type='button';b.className=(rail?'el-rail-control-16188 ':'')+'earthline-launch-rail-btn-16872';b.textContent=txt;b.setAttribute('aria-label',txt);return b};const L=mk('earthlineLaunchLogin16872',t().login),D=mk('earthlineLaunchDonate16872',t().donate),M=mk('earthlineLaunchMerch16872',t().merch);L.onclick=()=>openAccount('login');D.onclick=donate;M.onclick=()=>{track('merch_click');window.open('merchandise.html','_blank','noopener')};if(rail){rail.append(L,D,M)}else if(contact){host.append(L,D,M)}else{const wrap=document.createElement('div');wrap.id='earthlineLaunchFallbackRail16872';wrap.append(L,D,M);document.body.appendChild(wrap)}renderAccount()}
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


/* EARTHLINE_REPORT_VISUAL_REPAIR_16958 — real-world aerial illustration renderer.
   Presentation only: preserves analysis geometry and rebuilds the report SVG as a lightweight aerial landscape rendering. */
(function installReportVisualRepair16958(){
  if(window.EARTHLINE_REPORT_VISUAL_REPAIR_16958)return;
  window.EARTHLINE_REPORT_VISUAL_REPAIR_16958=true;

  const STYLE_ID='earthlineReportVisualRepair16958';
  const NS='http://www.w3.org/2000/svg';
  const TOWNS=new Set(['Burlington','Montpelier','Rutland','St. Johnsbury','Middlebury','St. Albans','Bennington','Brattleboro','Newport','Charlotte']);

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const st=document.createElement('style');st.id=STYLE_ID;
    st.textContent=[
      'html.earthline-impact-report-open-16958 #earthlineRail16188,',
      'html.earthline-impact-report-open-16958 #earthlineLaunchFallbackRail16872,',
      'html.earthline-impact-report-open-16958 #earthlineLaunchLogin16872,',
      'html.earthline-impact-report-open-16958 #earthlineLaunchDonate16872,',
      'html.earthline-impact-report-open-16958 #earthlineLaunchMerch16872,',
      'html.earthline-impact-report-open-16958 #searchOrb,',
      'html.earthline-impact-report-open-16958 [id*="SearchOrb"],',
      'html.earthline-impact-report-open-16958 [id^="earthlineRail"],',
      'html.earthline-impact-report-open-16958 .earthline-launch-rail-btn-16872,',
      'html.earthline-impact-report-open-16958 .el-rail-control-16188,',
      'html.earthline-impact-report-open-16958 .mapboxgl-ctrl{display:none!important;visibility:hidden!important;pointer-events:none!important}',
      '.el49-report .el49-toolbar-actions .el49-tool:not(.el49-close){display:none!important}',
      '.el49-report .el49-close{width:34px!important;height:34px!important;min-width:34px!important;padding:0!important;border-radius:50%!important;background:#eef1ee!important;color:#31413d!important;box-shadow:none!important;font-size:22px!important}',
      '.el49-report .el49-toolbar-actions{gap:0!important}',
      '.el49-report .el49-figure{background:#f3efe4!important;padding:8px!important;border:0!important;box-shadow:0 14px 34px rgba(26,43,36,.12)!important}',
      '.el49-report .el49-figure svg.el-report-aerial-16958{display:block!important;width:100%!important;height:auto!important;border:0!important;background:#e9ede3!important}',
      '.el49-report .el49-figure figcaption{margin:11px 4px 2px!important;max-width:82ch!important;color:#465b55!important;font-size:11.5px!important;line-height:1.46!important}'
    ].join('\n');
    (document.head||document.documentElement).appendChild(st);
  }

  function visible(el){
    if(!el||!el.isConnected||!el.getClientRects().length)return false;
    let n=el;
    while(n&&n!==document.documentElement){
      const cs=getComputedStyle(n);
      if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0')return false;
      n=n.parentElement;
    }
    return true;
  }
  function reportOpen(){return [...document.querySelectorAll('.el49-report')].some(visible)}
  function svgEl(name,attrs,text){
    const e=document.createElementNS(NS,name);
    Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,String(v)));
    if(text!=null)e.textContent=text;
    return e;
  }
  function color(v){return String(v||'').trim().toLowerCase()}
  function addPath(g,d,attrs){if(!d)return null;const p=svgEl('path',Object.assign({d,fill:'none'},attrs||{}));g.appendChild(p);return p}

  function collect(svg){
    const out={aquifer:[],water:[],a:[],b:[],c:[],contour:[],road:[],boundary:[],towns:[],elev:[],north:null,scale:null};
    [...svg.querySelectorAll('path')].forEach(p=>{
      const d=p.getAttribute('d');if(!d)return;
      const st=color(p.getAttribute('stroke')),fi=color(p.getAttribute('fill'));
      if(fi.includes('92,170,202')||fi.includes('69,151,207')||fi.includes('74,177,211')||fi.includes('61,169,211')||fi.includes('226,132,43')){out.aquifer.push(d);return}
      if(['#5b9fc2','#087bb4','#2188b2','#2287bb','#1686bb','#1578a6'].includes(st)){out.water.push(d);return}
      if(['#4f8b5d','#177c58','#2e7049','#315f48','#4e7756'].includes(st)){out.a.push(d);return}
      if(['#789557','#ad842e','#64894f','#71855f'].includes(st)){out.b.push(d);return}
      if(['#9b8b61','#aa6846','#927c55','#a19577'].includes(st)){out.c.push(d);return}
      if(['#839186','#7b8a84','#8c887b','#8b887c','#8f9088'].includes(st)){out.contour.push(d);return}
      if(st==='#aa9675'||st==='#b7a58c'){out.road.push(d);return}
      if(st==='#6f857c'||st==='#6f7e73'){out.boundary.push(d);return}
    });
    [...svg.querySelectorAll('text')].forEach(t=>{
      const tx=(t.textContent||'').trim();
      if(TOWNS.has(tx))out.towns.push(t.cloneNode(true));
      else if(/^\d+\s*m$/.test(tx))out.elev.push(t.cloneNode(true));
      else if(tx==='N'){const g=t.closest('g');if(g)out.north=g.cloneNode(true)}
      else if(/^\d+(?:\.\d+)?\s*km$/.test(tx)){const g=t.closest('g');if(g)out.scale=g.cloneNode(true)}
    });
    return out;
  }

  function defs(){
    const d=svgEl('defs');
    const land=svgEl('linearGradient',{id:'elLand16958',x1:'0',y1:'0',x2:'1',y2:'1'});
    [['0','#d4dfcf'],['.28','#e7eadc'],['.58','#e5dfcf'],['1','#cdd9cc']].forEach(x=>land.appendChild(svgEl('stop',{offset:x[0],'stop-color':x[1]})));
    d.appendChild(land);

    const aq=svgEl('linearGradient',{id:'elAq16958',x1:'0',y1:'0',x2:'1',y2:'1'});
    [['0','#f6b15b','.76'],['.52','#e68b2f','.57'],['1','#d36f20','.43']].forEach(x=>aq.appendChild(svgEl('stop',{offset:x[0],'stop-color':x[1],'stop-opacity':x[2]})));
    d.appendChild(aq);

    const pat=svgEl('pattern',{id:'elAqDots16958',width:'12',height:'12',patternUnits:'userSpaceOnUse'});
    pat.append(svgEl('circle',{cx:'2.5',cy:'2.5',r:'1.15',fill:'#a95618',opacity:'.28'}),svgEl('circle',{cx:'9',cy:'8',r:'.8',fill:'#ffd6a0',opacity:'.32'}));
    d.appendChild(pat);

    const tex=svgEl('filter',{id:'elTerrainTexture16958',x:'-10%',y:'-10%',width:'120%',height:'120%'});
    tex.append(svgEl('feTurbulence',{type:'fractalNoise',baseFrequency:'.016 .032',numOctaves:'2',seed:'31'}),svgEl('feColorMatrix',{type:'saturate',values:'.18'}));
    const comp=svgEl('feComponentTransfer');comp.appendChild(svgEl('feFuncA',{type:'table',tableValues:'0 .10'}));tex.appendChild(comp);d.appendChild(tex);

    const blur=svgEl('filter',{id:'elHill16958',x:'-15%',y:'-15%',width:'130%',height:'130%'});blur.appendChild(svgEl('feGaussianBlur',{stdDeviation:'5.5'}));d.appendChild(blur);
    const sw=svgEl('filter',{id:'elSwaleShadow16958',x:'-20%',y:'-20%',width:'140%',height:'140%'});sw.appendChild(svgEl('feDropShadow',{dx:'0',dy:'1.5',stdDeviation:'1.4','flood-color':'#213a2d','flood-opacity':'.30'}));d.appendChild(sw);
    const wa=svgEl('filter',{id:'elWaterShadow16958',x:'-20%',y:'-20%',width:'140%',height:'140%'});wa.appendChild(svgEl('feDropShadow',{dx:'0',dy:'1',stdDeviation:'1.1','flood-color':'#0b587d','flood-opacity':'.24'}));d.appendChild(wa);

    const vig=svgEl('radialGradient',{id:'elVig16958',cx:'.5',cy:'.46',r:'.76'});
    vig.append(svgEl('stop',{offset:'.64','stop-color':'#fff','stop-opacity':'0'}),svgEl('stop',{offset:'1','stop-color':'#51675a','stop-opacity':'.16'}));d.appendChild(vig);
    return d;
  }

  function rebuild(svg){
    if(!svg||svg.dataset.earthlineAerial16958==='1')return;
    const vb=svg.viewBox&&svg.viewBox.baseVal?svg.viewBox.baseVal:null;
    const W=(vb&&vb.width)||820,H=(vb&&vb.height)||500;
    const data=collect(svg);
    const label=(svg.getAttribute('aria-label')||'Earthline').replace(/^Earthline\s*/i,'').replace(/screening map/i,'').trim();

    while(svg.firstChild)svg.removeChild(svg.firstChild);
    svg.classList.add('el-report-aerial-16958');
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.appendChild(defs());

    svg.appendChild(svgEl('rect',{width:W,height:H,fill:'#f5f2e9'}));
    svg.appendChild(svgEl('rect',{x:14,y:14,width:W-28,height:H-28,rx:7,fill:'url(#elLand16958)'}));
    svg.appendChild(svgEl('rect',{x:14,y:14,width:W-28,height:H-28,rx:7,fill:'#6b806f',opacity:'.065',filter:'url(#elTerrainTexture16958)'}));

    const relief=svgEl('g',{opacity:'.13',filter:'url(#elHill16958)'});
    data.contour.filter((_,i)=>i%6===0).forEach((d,i)=>addPath(relief,d,{stroke:i%2===0?'#55705c':'#9a815e','stroke-width':i%3===0?18:12,'stroke-linecap':'round'}));
    svg.appendChild(relief);

    const aq=svgEl('g',{class:'el16958-aquifers'});
    data.aquifer.forEach(d=>{
      aq.appendChild(svgEl('path',{d,fill:'url(#elAq16958)','fill-rule':'evenodd',stroke:'#cd711f','stroke-width':'1.5',opacity:'.96','vector-effect':'non-scaling-stroke'}));
      aq.appendChild(svgEl('path',{d,fill:'url(#elAqDots16958)','fill-rule':'evenodd',stroke:'none',opacity:'.38'}));
    });
    svg.appendChild(aq);

    const context=svgEl('g',{class:'el16958-context'});
    data.boundary.forEach(d=>addPath(context,d,{stroke:'#6c7b70','stroke-width':'1.0',opacity:'.48'}));
    data.road.forEach(d=>addPath(context,d,{stroke:'#b19c82','stroke-width':'1.15',opacity:'.24','stroke-linecap':'round'}));
    svg.appendChild(context);

    const contours=svgEl('g',{class:'el16958-contours'});
    data.contour.filter((_,i)=>i%2===0).forEach((d,i)=>addPath(contours,d,{stroke:i%7===0?'#70776f':'#969a92','stroke-width':i%7===0?'.72':'.34',opacity:i%7===0?'.34':'.14','vector-effect':'non-scaling-stroke'}));
    svg.appendChild(contours);

    const water=svgEl('g',{class:'el16958-water',filter:'url(#elWaterShadow16958)'});
    [...new Set(data.water)].forEach(d=>{
      addPath(water,d,{stroke:'#f6f7ef','stroke-width':'6.4',opacity:'.78','stroke-linecap':'round','stroke-linejoin':'round'});
      addPath(water,d,{stroke:'#0f6996','stroke-width':'3.2',opacity:'.97','stroke-linecap':'round','stroke-linejoin':'round'});
      addPath(water,d,{stroke:'#75c7df','stroke-width':'.95',opacity:'.94','stroke-linecap':'round','stroke-linejoin':'round'});
    });
    svg.appendChild(water);

    const swales=svgEl('g',{class:'el16958-swales',filter:'url(#elSwaleShadow16958)'});
    const paint=(arr,grade)=>{
      const cfg=grade==='A'?{outer:'#294a38',mid:'#4f8056',lush:'#8ab17c',blue:'#80c7d1',w:9.0,a:.97}:grade==='B'?{outer:'#536b51',mid:'#78956c',lush:'#a8bb94',blue:'#a0cbd0',w:7.1,a:.79}:{outer:'#77745f',mid:'#99967b',lush:'#beb9a0',blue:'#abc9c9',w:5.4,a:.46};
      [...new Set(arr)].forEach(d=>{
        addPath(swales,d,{stroke:'#f3f2e8','stroke-width':cfg.w+5.3,opacity:'.76','stroke-linecap':'round','stroke-linejoin':'round'});
        addPath(swales,d,{stroke:cfg.outer,'stroke-width':cfg.w,opacity:String(cfg.a),'stroke-linecap':'round','stroke-linejoin':'round'});
        addPath(swales,d,{stroke:cfg.mid,'stroke-width':cfg.w*.72,opacity:String(cfg.a),'stroke-linecap':'round','stroke-linejoin':'round'});
        addPath(swales,d,{stroke:cfg.lush,'stroke-width':cfg.w*.30,opacity:'.94','stroke-linecap':'round','stroke-linejoin':'round'});
        addPath(swales,d,{stroke:cfg.blue,'stroke-width':Math.max(.7,cfg.w*.09),opacity:grade==='A'?'.78':'.46','stroke-linecap':'round','stroke-linejoin':'round'});
        addPath(swales,d,{stroke:'#d8e6c3','stroke-width':'1.3',opacity:grade==='A'?'.46':'.26','stroke-linecap':'round','stroke-dasharray':'0.2 5.2'});
      });
    };
    paint(data.c,'C');paint(data.b,'B');paint(data.a,'A');
    svg.appendChild(swales);

    data.elev.filter((_,i)=>i%2===0).slice(0,7).forEach(t=>{
      t.setAttribute('fill','#5f675f');t.setAttribute('font-size','7.6');t.setAttribute('font-weight','700');t.setAttribute('opacity','.84');
      svg.appendChild(t);
    });
    data.towns.forEach(t=>{t.setAttribute('fill','#40544d');t.setAttribute('font-size','8.4');t.setAttribute('font-weight','650');t.setAttribute('opacity','.82');svg.appendChild(t)});

    svg.appendChild(svgEl('rect',{x:14,y:14,width:W-28,height:H-28,rx:7,fill:'url(#elVig16958)','pointer-events':'none'}));
    svg.appendChild(svgEl('rect',{x:14,y:14,width:W-28,height:H-28,rx:7,fill:'none',stroke:'#9ba79e','stroke-width':'.9'}));

    const head=svgEl('g',{transform:'translate(32,34)'});
    head.append(svgEl('text',{x:0,y:0,fill:'#1f4038','font-size':'15','font-weight':'850'},label||'Earthline Water + Recharge Opportunity'));
    head.append(svgEl('text',{x:0,y:16,fill:'#66746c','font-size':'7.7','font-weight':'750','letter-spacing':'1.15'},'EARTHLINE · AERIAL LANDSCAPE RENDERING'));
    svg.appendChild(head);

    if(data.north)svg.appendChild(data.north);
    if(data.scale)svg.appendChild(data.scale);

    const key=svgEl('g',{transform:'translate('+(W-286)+','+(H-103)+')'});
    key.appendChild(svgEl('rect',{width:258,height:66,rx:5,fill:'#fffdf8','fill-opacity':'.93',stroke:'#acb4ad','stroke-width':'.7'}));
    key.appendChild(svgEl('rect',{x:12,y:13,width:24,height:10,rx:2,fill:'url(#elAq16958)',stroke:'#cd711f','stroke-width':'.9'}));
    key.appendChild(svgEl('text',{x:44,y:21,fill:'#465a55','font-size':'7.4'},'Aquifer context'));
    addPath(key,'M12 42 H36',{stroke:'#0f6996','stroke-width':'2.7','stroke-linecap':'round'});addPath(key,'M12 42 H36',{stroke:'#75c7df','stroke-width':'.8','stroke-linecap':'round'});
    key.appendChild(svgEl('text',{x:44,y:45,fill:'#465a55','font-size':'7.4'},'Water path'));
    addPath(key,'M139 18 H164',{stroke:'#294a38','stroke-width':'7','stroke-linecap':'round'});addPath(key,'M139 18 H164',{stroke:'#8ab17c','stroke-width':'2.4','stroke-linecap':'round'});addPath(key,'M139 18 H164',{stroke:'#80c7d1','stroke-width':'.7','stroke-linecap':'round'});
    key.appendChild(svgEl('text',{x:172,y:21,fill:'#465a55','font-size':'7.4'},'Bioswale'));
    addPath(key,'M139 42 H164',{stroke:'#777d76','stroke-width':'.7'});
    key.appendChild(svgEl('text',{x:172,y:45,fill:'#465a55','font-size':'7.4'},'Elevation'));
    key.appendChild(svgEl('text',{x:12,y:58,fill:'#788078','font-size':'6.3'},'Modeled screening · field verification required'));
    svg.appendChild(key);

    svg.dataset.earthlineAerial16958='1';
  }

  function sync(){
    ensureStyle();
    const open=reportOpen();
    document.documentElement.classList.toggle('earthline-impact-report-open-16958',open);
    if(!open)return;
    document.querySelectorAll('.el49-report .el49-figure svg').forEach(rebuild);
  }

  let q=false;
  const schedule=()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;sync()})};
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','aria-hidden']});
  document.addEventListener('click',schedule,true);
  addEventListener('hashchange',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
})();

})();
