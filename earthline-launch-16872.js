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

/* EARTHLINE_REPORT_VISUAL_REPAIR_16953 — authoritative report presentation owner.
   Presentation only: no hydrology, geometry, ranking, search, or run-state changes. */
(function installReportVisualRepair16953(){
  if(window.EARTHLINE_REPORT_VISUAL_REPAIR_16953)return;
  window.EARTHLINE_REPORT_VISUAL_REPAIR_16953=true;
  const STYLE_ID='earthlineReportVisualRepair16953';
  const CONTROL_SELECTOR=[
    '#earthlineRail16188','#earthlineLaunchFallbackRail16872','#earthlineLaunchLogin16872',
    '#earthlineLaunchDonate16872','#earthlineLaunchMerch16872','#searchOrb','[id*="SearchOrb"]',
    '[id^="earthlineRail"]','.earthline-launch-rail-btn-16872','.el-rail-control-16188','.mapboxgl-ctrl'
  ].join(',');

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const st=document.createElement('style'); st.id=STYLE_ID;
    st.textContent=[
      'html.earthline-impact-report-open-16953 #earthlineRail16188,',
      'html.earthline-impact-report-open-16953 #earthlineLaunchFallbackRail16872,',
      'html.earthline-impact-report-open-16953 #earthlineLaunchLogin16872,',
      'html.earthline-impact-report-open-16953 #earthlineLaunchDonate16872,',
      'html.earthline-impact-report-open-16953 #earthlineLaunchMerch16872,',
      'html.earthline-impact-report-open-16953 #searchOrb,',
      'html.earthline-impact-report-open-16953 [id*="SearchOrb"],',
      'html.earthline-impact-report-open-16953 [id^="earthlineRail"],',
      'html.earthline-impact-report-open-16953 .earthline-launch-rail-btn-16872,',
      'html.earthline-impact-report-open-16953 .el-rail-control-16188,',
      'html.earthline-impact-report-open-16953 .mapboxgl-ctrl{display:none!important;visibility:hidden!important;pointer-events:none!important}',
      '.el49-report .el49-figure{border:0!important;background:#eee9dc!important;padding:14px!important;box-shadow:0 16px 42px rgba(30,48,40,.16)!important}',
      '.el49-report .el49-figure svg.el-report-plan-map-16953{display:block!important;width:100%!important;height:auto!important;border:1px solid #98a69a!important;border-radius:2px!important;background:#f3efe3!important}',
      '.el49-report .el49-figure figcaption{margin:12px 5px 2px!important;max-width:82ch!important;color:#425752!important;font-size:11.5px!important;line-height:1.48!important}',
      '.el49-report .el16953-map-title{font-family:"Noto Sans",Arial,sans-serif!important;font-size:15px!important;font-weight:850!important;letter-spacing:.15px!important;fill:#173c3b!important}',
      '.el49-report .el16953-map-subtitle{font-family:"Noto Sans",Arial,sans-serif!important;font-size:8px!important;font-weight:750!important;letter-spacing:1.05px!important;fill:#5b6c63!important}',
      '.el49-report .el16953-aquifer-label rect{fill:#f7fcff;fill-opacity:.96;stroke:#176f9c;stroke-width:1}',
      '.el49-report .el16953-aquifer-label text{fill:#0d6089;font:800 9.3px "Noto Sans",Arial,sans-serif;letter-spacing:.28px}',
      '.el49-report .el16953-map-key text{font-family:"Noto Sans",Arial,sans-serif}'
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

  function forceControlsHidden(open){
    document.querySelectorAll(CONTROL_SELECTOR).forEach(el=>{
      if(el.closest&&el.closest('.el49-report'))return;
      if(open){
        if(!el.hasAttribute('data-el-report-prev-style-16953'))el.setAttribute('data-el-report-prev-style-16953',el.getAttribute('style')||'');
        el.style.setProperty('display','none','important');
        el.style.setProperty('visibility','hidden','important');
        el.style.setProperty('pointer-events','none','important');
      }else if(el.hasAttribute('data-el-report-prev-style-16953')){
        const prev=el.getAttribute('data-el-report-prev-style-16953')||'';
        if(prev)el.setAttribute('style',prev); else el.removeAttribute('style');
        el.removeAttribute('data-el-report-prev-style-16953');
      }
    });
  }

  function setAttr(el,k,v){try{el.setAttribute(k,String(v))}catch(_){}}
  function svgEl(name,attrs,text){
    const e=document.createElementNS('http://www.w3.org/2000/svg',name);
    Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,String(v)));
    if(text!=null)e.textContent=text; return e;
  }

  function addDefs(svg){
    let defs=svg.querySelector('defs'); if(!defs){defs=svgEl('defs');svg.insertBefore(defs,svg.firstChild)}
    if(!svg.querySelector('#el16953MapWash')){
      const g=svgEl('linearGradient',{id:'el16953MapWash',x1:'0',y1:'0',x2:'1',y2:'1'});
      g.append(svgEl('stop',{offset:'0','stop-color':'#f7f2e6'}),svgEl('stop',{offset:'.50','stop-color':'#e9eee1'}),svgEl('stop',{offset:'1','stop-color':'#d9e5d7'}));
      defs.appendChild(g);
    }
    if(!svg.querySelector('#el16953ReliefBlur')){
      const f=svgEl('filter',{id:'el16953ReliefBlur',x:'-10%',y:'-10%',width:'120%',height:'120%'});
      f.appendChild(svgEl('feGaussianBlur',{stdDeviation:'2.6'})); defs.appendChild(f);
    }
  }

  function aquiferLabel(svg,path,index){
    if(svg.querySelector('.el16953-aquifer-label[data-i="'+index+'"]'))return;
    let bb; try{bb=path.getBBox()}catch(_){return}
    if(!bb||bb.width<18||bb.height<18)return;
    const x=bb.x+bb.width/2,y=bb.y+bb.height/2,w=142,h=22;
    const g=svgEl('g',{class:'el16953-aquifer-label','data-i':index});
    g.append(svgEl('rect',{x:x-w/2,y:y-h/2,width:w,height:h,rx:4}),svgEl('text',{x:x,y:y+3.5,'text-anchor':'middle'},'MAPPED AQUIFER CONTEXT'));
    svg.appendChild(g);
  }

  function addLandformWash(svg,contours){
    if(svg.querySelector('.el16953-landform'))return;
    const vb=svg.viewBox.baseVal,W=vb.width||820,H=vb.height||500;
    const wash=svgEl('g',{class:'el16953-landform','pointer-events':'none'});
    wash.appendChild(svgEl('rect',{x:0,y:0,width:W,height:H,fill:'url(#el16953MapWash)',opacity:'.46'}));
    const relief=svgEl('g',{opacity:'.58',filter:'url(#el16953ReliefBlur)'});
    contours.slice(0,110).forEach((p,i)=>{
      const c=p.cloneNode(false); c.removeAttribute('class'); c.setAttribute('fill','none');
      c.setAttribute('stroke',i%5===0?'#55705d':'#788475');
      c.setAttribute('stroke-width',i%5===0?'5.8':'3.1');
      c.setAttribute('opacity',i%5===0?'.082':'.034'); relief.appendChild(c);
    });
    wash.appendChild(relief);
    const firstPath=svg.querySelector('path');
    if(firstPath)svg.insertBefore(wash,firstPath); else svg.appendChild(wash);
  }

  function removeOldFurniture(svg){
    svg.querySelectorAll('.el16952-aquifer-label,.el16953-aquifer-label,.el16953-map-key,.el16953-map-subtitle,.el16953-landform').forEach(x=>x.remove());
    [...svg.querySelectorAll('text')].forEach(t=>{
      const tx=(t.textContent||'').trim();
      if(tx==='GENERATED BY THE EARTHLINE SEARCH ENGINE'){const g=t.closest('g');if(g)g.remove()}
      if(tx==='Aquifer context'||tx==='Mapped aquifer context'){const g=t.closest('g');if(g&&g.querySelectorAll('text').length>=3)g.remove()}
    });
  }

  function addMapFurniture(svg){
    const vb=svg.viewBox.baseVal,W=vb.width||820,H=vb.height||500;
    const title=[...svg.querySelectorAll('text')].find(t=>(t.textContent||'').startsWith('Earthline Water + Recharge Opportunity Map'));
    if(title){title.classList.add('el16953-map-title');setAttr(title,'x',40);setAttr(title,'y',27)}
    svg.appendChild(svgEl('text',{class:'el16953-map-subtitle',x:40,y:42},'LANDSCAPE HYDROLOGY + RECHARGE OPPORTUNITY PLAN'));
    const key=svgEl('g',{class:'el16953-map-key',transform:'translate('+(W-292)+','+(H-139)+')'});
    key.appendChild(svgEl('rect',{width:268,height:88,rx:4,fill:'#fffdf7','fill-opacity':'.95',stroke:'#9eaa9e','stroke-width':'.8'}));
    key.appendChild(svgEl('text',{x:12,y:17,fill:'#28463f','font-size':'8.2','font-weight':'850','letter-spacing':'.75'},'PLAN KEY'));
    key.appendChild(svgEl('rect',{x:12,y:29,width:23,height:9,rx:2,fill:'rgba(61,169,211,.38)',stroke:'#1978a5','stroke-width':'1.1'}));
    key.appendChild(svgEl('text',{x:43,y:37,fill:'#405852','font-size':'7.7'},'Mapped aquifer context'));
    key.appendChild(svgEl('path',{d:'M12 55 H35',stroke:'#1686bb','stroke-width':'2.8','stroke-linecap':'round'}));
    key.appendChild(svgEl('text',{x:43,y:58,fill:'#405852','font-size':'7.7'},'Modeled water path'));
    key.appendChild(svgEl('path',{d:'M146 33 H170',stroke:'#2e7049','stroke-width':'7.2','stroke-linecap':'round'}));
    key.appendChild(svgEl('text',{x:178,y:37,fill:'#405852','font-size':'7.7'},'Priority bioswale'));
    key.appendChild(svgEl('path',{d:'M146 55 H170',stroke:'#8c887b','stroke-width':'.8'}));
    key.appendChild(svgEl('text',{x:178,y:58,fill:'#405852','font-size':'7.7'},'Contour / elevation'));
    key.appendChild(svgEl('text',{x:12,y:77,fill:'#66736c','font-size':'6.8'},'Screening plan — field verification required before design.'));
    svg.appendChild(key);
  }

  function polishMap(svg){
    if(!svg)return;
    svg.classList.add('el-report-plan-map-16953');
    svg.classList.remove('el-report-plan-map-16952');
    setAttr(svg,'preserveAspectRatio','xMidYMid meet');
    addDefs(svg); removeOldFurniture(svg);
    const paths=[...svg.querySelectorAll('path')];
    const contourPaths=[]; let aq=0;
    paths.forEach(p=>{
      const stroke=(p.getAttribute('stroke')||'').toLowerCase();
      const fill=(p.getAttribute('fill')||'').toLowerCase();
      const sw=parseFloat(p.getAttribute('stroke-width')||'0');
      if(fill.includes('92,170,202')||fill.includes('69,151,207')||fill.includes('61,169,211')){
        setAttr(p,'fill','rgba(61,169,211,.38)'); setAttr(p,'stroke','#1978a5'); setAttr(p,'stroke-width',2.25); setAttr(p,'opacity','.96');
        if(aq<3)aquiferLabel(svg,p,aq++); return;
      }
      if(stroke==='#5b9fc2'||stroke==='#087bb4'||stroke==='#2188b2'||stroke==='#1686bb'){
        setAttr(p,'stroke','#1686bb'); setAttr(p,'stroke-width',Math.max(2.85,sw||0)); setAttr(p,'opacity','.97'); return;
      }
      if(stroke==='#4f8b5d'||stroke==='#177c58'||stroke==='#2e7049'){
        setAttr(p,'stroke','#2e7049'); setAttr(p,'stroke-width',Math.max(8.4,sw||0)); setAttr(p,'opacity','.95'); return;
      }
      if(stroke==='#789557'||stroke==='#ad842e'||stroke==='#64894f'){
        setAttr(p,'stroke','#64894f'); setAttr(p,'stroke-width',Math.max(7.0,sw||0)); setAttr(p,'opacity','.86'); return;
      }
      if(stroke==='#9b8b61'||stroke==='#aa6846'||stroke==='#927c55'){
        setAttr(p,'stroke','#927c55'); setAttr(p,'stroke-width',Math.max(5.8,sw||0)); setAttr(p,'opacity','.72'); return;
      }
      if(stroke==='#839186'||stroke==='#7b8a84'||stroke==='#8c887b'){
        setAttr(p,'stroke','#8c887b'); setAttr(p,'stroke-width',Math.max(.52,sw||0)); setAttr(p,'opacity','.29'); contourPaths.push(p);
      }
    });
    addLandformWash(svg,contourPaths);
    addMapFurniture(svg);
    svg.dataset.earthlinePlan16953='1';
  }

  function sync(){
    ensureStyle();
    const open=reportOpen();
    document.documentElement.classList.toggle('earthline-impact-report-open-16953',open);
    forceControlsHidden(open);
    if(!open)return;
    document.querySelectorAll('.el49-report .el49-figure svg').forEach(polishMap);
  }

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})};
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','aria-hidden']});
  addEventListener('hashchange',schedule);
  document.addEventListener('click',schedule,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true}); else sync();
})();

})();
