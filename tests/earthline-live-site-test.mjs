// Earthline SWALE-ENGINE CANDIDATE TEST. Visits the public site as a visitor would, with index.html and the two swale files replaced
// by the candidate in this checkout (nothing is published). Changes nothing on the live site.
// Usage: EARTHLINE_PROFILE=desktop-chrome node tests/earthline-live-site-test.mjs
import {chromium,firefox,webkit,devices} from 'playwright';
import {mkdirSync,writeFileSync,readFileSync,renameSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {geometryAudit} from './geometry-audit.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);

const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const PROFILE=process.env.EARTHLINE_PROFILE||'desktop-chrome';
const PROFILES={
  'desktop-chrome': {engine:chromium,ctx:{viewport:{width:1440,height:900}}},
  'desktop-firefox':{engine:firefox, ctx:{viewport:{width:1440,height:900}}},
  'desktop-safari': {engine:webkit,  ctx:{viewport:{width:1440,height:900}}},
  'iphone':         {engine:webkit,  ctx:{...devices['iPhone 14']}},
  'android':        {engine:chromium,ctx:{...devices['Pixel 7']}},
};
const REGIONAL=(process.env.EARTHLINE_SKIP_REGIONAL==='1')?[]:['Vermont','Arizona','Iowa'];
const PROPERTY=[
  {name:'iowa-farmland',q:'42.13000, -93.68000',at:[-93.68000,42.13000]},
  {name:'iowa-creek',   q:'41.95748, -93.38977',at:[-93.38977,41.95748]},
  {name:'vermont',      q:'43.88279, -72.45147',at:[-72.45147,43.88279]},
  {name:'arizona',      q:'34.21572, -111.93073',at:[-111.93073,34.21572]},
  {name:'darling-mine', q:'33.73774, -114.33439',at:[-114.33439,33.73774]},
  {name:'essex',        q:'61 Sleepy Hollow Road, Essex, Vermont'},
];
// Coverage sites for the release gate on missing areas: other farmland states and a state line. Same measurements, no pass/fail judged here.
const COVERAGE=[
  {name:'arkansas-delta-farmland', q:'34.50000, -91.55000', at:[-91.55000,34.50000]},
  {name:'nebraska-farmland',       q:'40.87000, -98.00000', at:[-98.00000,40.87000]},
  {name:'iowa-minnesota-line',     q:'43.50000, -93.50000', at:[-93.50000,43.50000]},
];
// Jonathan's screenshots (Nov 18, 2026): two Arkansas, two New York. Run on every browser profile, first.
const FOCUS=[
  {name:'arkansas-your-screenshot-1',q:'34.77042, -92.12943',at:[-92.12943,34.77042]},
  {name:'arkansas-your-screenshot-2',q:'34.75262, -92.14778',at:[-92.14778,34.75262]},
  {name:'newyork-your-screenshot-1',q:'42.78781, -75.76996',at:[-75.76996,42.78781]},
  {name:'newyork-your-screenshot-2',q:'42.78860, -75.77379',at:[-75.77379,42.78860]},
];
const SITE_FILTER=(process.env.EARTHLINE_SITES||'').split(',').map(x=>x.trim()).filter(Boolean);
// Candidate mode: the public site is loaded as normal, but its main page (index.html) is replaced by the
// candidate file in this checkout. Nothing is published; the live site is not changed.
const PINNED=process.env.EARTHLINE_PINNED==='1';
const PINNED_HTML=PINNED?readFileSync('index.html'):null;
// Extra repository files served in place of the public site's copy (comma-separated, repo-relative), e.g. the Elder detector.
const EXTRA=PINNED?Object.fromEntries((process.env.EARTHLINE_PINNED_EXTRA||'').split(',').map(x=>x.trim()).filter(Boolean).map(f=>['/'+f,readFileSync(f)])):{};
const PINNED_SHA=PINNED?createHash('sha256').update(PINNED_HTML).digest('hex'):null;
const OUT=(PINNED?(process.env.EARTHLINE_RESULTS_DIR||'candidate-test-results')+'/':'live-test-results/')+PROFILE;
mkdirSync(OUT,{recursive:true});
const prof=PROFILES[PROFILE];
if(!prof){console.error('unknown profile '+PROFILE);process.exit(2);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rows=[];
let firstArrivalGlobeAudit=null;
function saveCheckpoint(error=null){
  const result={profile:PROFILE,candidateMode:PINNED,candidateIndexSha256:PINNED_SHA,
    candidateExtraFiles:Object.keys(EXTRA),url:BASE,testedAt:new Date().toISOString(),
    launchError:error,startupGlobe:firstArrivalGlobeAudit,rows};
  const tmp=OUT+'/results.json.tmp';
  writeFileSync(tmp,JSON.stringify(result,null,1));
  renameSync(tmp,OUT+'/results.json');
}

// Runs inside the page: one snapshot of everything a visitor would be looking at.
function snap(){
  const hav=(a,b)=>{const R=6371008.8,r=Math.PI/180,p1=a[1]*r,p2=b[1]*r,dp=(b[1]-a[1])*r,dl=(b[0]-a[0])*r;
    const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));};
  const m=(typeof M!=='undefined'&&M)||null;
  let map=null;try{map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;}catch(_){}
  const srcCount=id=>{try{const s=map&&map.getSource&&map.getSource(id);const d=s&&(s._data||(s.serialize&&s.serialize().data));
    return d&&Array.isArray(d.features)?d.features.length:null;}catch(_){return null;}};
  let swales=[];
  try{const fc=typeof earthlineSwaleGeoJSON==='function'?earthlineSwaleGeoJSON():null;
    swales=((fc&&fc.features)||[]).filter(f=>f&&f.geometry&&/LineString/.test(f.geometry.type)).map(f=>{
      const c=f.geometry.type==='LineString'?f.geometry.coordinates:(f.geometry.coordinates[0]||[]);
      let len=0;for(let i=1;i<c.length;i++)len+=hav(c[i-1],c[i]);
      const p=f.properties||{};
      return {id:p.id||p.label||null,lengthM:Math.round(len*10)/10,slopePct:Number(p.slope_pct??p.slope??p.mean_slope_pct)};
    });}catch(e){swales=[{error:String(e)}];}
  let elder=null;
  try{const e=window.EARTHLINE_ELDER_TREE_LAST_17097;
    if(e){elder={};for(const k of Object.keys(e)){const v=e[k];
      elder[k]=Array.isArray(v)?('array:'+v.length):(v&&typeof v==='object'?'object':v);}}}catch(_){}
  const de=document.documentElement,vis=id=>{const el=document.getElementById(id);if(!el)return null;
    const b=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return {shown:cs.display!=='none'&&cs.visibility!=='hidden'&&b.width>1&&b.height>1,
      insideScreen:b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1,
      w:Math.round(b.width),h:Math.round(b.height)};};
  const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  let eng=null;
  try{const h=window.__EARTHLINE_SWALE_ENGINE_HOOK_16600,r=h&&h.result();
    if(r){eng={verified:r.verified,code:r.code||null,detail:r.detail?JSON.stringify(r.detail).slice(0,400):null,engineVersion:r.engineVersion,bridgeVersion:r.bridgeVersion,hash:r.determinismHash||null,message:r.message||null,
      acquisition:r.acquisition?{status:r.acquisition.status,sourceTier:r.acquisition.sourceTier,counts:r.acquisition.counts,tiles:r.acquisition.tiles&&r.acquisition.tiles.length,source:r.acquisition.source,vermontApplicable:r.acquisition.vermontApplicable,vermontVerified:r.acquisition.vermontVerified,extraVermontFeatures:r.acquisition.extraVermontFeatures,manualNoBuild:r.acquisition.manualNoBuild}:null,
      engineSwales:r.engineSwales,publishedSwales:r.publishedSwales,terrain:(r.evidence&&r.evidence.terrain)||null,rejections:r.rejections||null,coverage:r.coverage||null,params:r.params||null,
      audit:r.audit?{checked:r.audit.checked,rejectedCount:r.audit.rejected.length,rejected:r.audit.rejected.slice(0,10),minClearanceM:r.audit.minClearanceM}:null,
      timing:r.timing||null,
      stableIds:Array.isArray(r.features)?r.features.map(f=>f.properties.id):[],
      swalesMeanSlopeMax:Array.isArray(r.features)?Math.max(0,...r.features.map(f=>f.properties.mean_slope_pct)):null,
      swalesMax5ptMedianMax:Array.isArray(r.features)?Math.max(0,...r.features.map(f=>f.properties.max_5pt_median_slope_pct)):null,
      swalesMinLengthM:Array.isArray(r.features)&&r.features.length?Math.min(...r.features.map(f=>f.properties.length_m)):null};}}catch(e){eng={error:String(e).slice(0,200)};}
  let closestPairM=null;
  try{const sw=(m&&Array.isArray(m.swales))?m.swales:[],cell=Number(m&&m.cellM)||0,pts=[];
    sw.forEach((s,si)=>{for(const p of (s.pts||[]))pts.push([p[0],p[1],si]);});
    if(cell>0&&pts.length){const bucket=new Map(),B=3;let best=Infinity;
      for(const p of pts){const k=Math.floor(p[0]/B)+','+Math.floor(p[1]/B);if(!bucket.has(k))bucket.set(k,[]);bucket.get(k).push(p);}
      for(const p of pts){const bx=Math.floor(p[0]/B),by=Math.floor(p[1]/B);
        for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const b=bucket.get((bx+dx)+','+(by+dy));if(!b)continue;
          for(const q of b){if(q[2]===p[2])continue;const d=Math.hypot(p[0]-q[0],p[1]-q[1])*cell;if(d<best)best=d;}}}
      closestPairM=Number.isFinite(best)?Math.round(best*100)/100:null;}}catch(_){}
  return {
    engine16600:eng,closestPairM,
    tier:de.dataset.earthlineAnalysisTier||null,
    runState:de.dataset.earthlineRunState||null,
    propertyRunState:de.dataset.earthlinePropertyRunState||null,
    location:m&&m.loc?String(m.loc.name||''):null,
    center:m?{lat:Number(m.centerLat),lng:Number(m.centerLng)}:null,
    analysisReady:!!(m&&m.analysisReady),
    engineSwales:m&&Array.isArray(m.swales)?m.swales.length:null,
    engineSlopes:m&&Array.isArray(m.swales)?m.swales.map(w=>Number(w&&(w.slope??w.slope_pct??w.meanSlope))).filter(Number.isFinite).map(v=>Math.round(v*10)/10):[],
    shownSwales:swales.length,swales,
    rechargeTargets:m&&Array.isArray(m.rechZones)?m.rechZones.length:null,
    regionalSwaleFeatures:srcCount('el-live-swales-15970'),
    drawnLivingSwales:srcCount('earthline-living-swales-15792'),drawnTexture:srcCount('earthline-property-swale-texture-16174'),drawnLegacy:srcCount('earthline-swales'),
    aquiferFeatures:srcCount('el-live-aquifer-15970'),
    elder,
    propertyAudit:audit?{settled:audit.settled??null,result:audit.result??null,error:audit.error?String(audit.error).slice(0,300):null}:null,
    statusText:(()=>{try{return Array.from(document.querySelectorAll('[id*="Status"],[id*="status"],[id*="Notice"]')).filter(e=>!/^(STYLE|SCRIPT)$/.test(e.tagName)&&e.getBoundingClientRect().width>1).map(e=>e.textContent.trim().replace(/\s+/g,' ')).filter(Boolean).join(' | ').slice(0,500);}catch(_){return null;}})(),
    integrity:(()=>{try{const i=window.EARTHLINE_LOCATION_INTEGRITY_15801;return i?{ok:i.ok,phase:i.phase,mode:i.mode,reasons:Array.isArray(i.reasons)?i.reasons.slice(0,6):null,mapDeltaM:i.mapDeltaM??null,identityDeltaM:i.identityDeltaM??null,toleranceM:i.toleranceM??null,zoom:i.zoom??null,anchor:i.anchor||null}:null;}catch(_){return null;}})(),
    propertyFailure:(()=>{try{const f=m&&m.propertyRunFailure16539;return f?{stage:String(f.stage||''),reason:String(f.reason||'').slice(0,200)}:null;}catch(_){return null;}})(),
    regionalError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970?String(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970).slice(0,300):null,
    layout:{screen:[innerWidth,innerHeight],pageWiderThanScreen:de.scrollWidth>innerWidth+2,
      searchBox:vis('searchInput'),runButton:vis('runBtn'),propertyButton:vis('earthlineDeclareProperty16169'),
      mapCanvas:!!document.querySelector('.mapboxgl-canvas'),
      searchDirectlyBelowLogo:(()=>{const h=document.getElementById('earthlinePanelBrand16201'),l=h&&h.querySelector(':scope > .brand'),q=document.getElementById('earthlineSearchSection16188');return !!(h&&l&&q&&q.parentElement===h&&q.previousElementSibling===l);})()},
  };
}

// ---- Independent exclusion check (Node side). Fetches the same Mapbox Streets tiles itself, decodes them with @mapbox/vector-tile
// (not the candidate's decoder) and measures every published swale vertex-to-segment with its own distance code.
// Rules here are looser than the candidate's (centerline distance only, no assumed road width), so any hit is a real violation.
let VT=null,PBF=null;
function loadDecoders(){if(VT!==null)return !!VT;try{VT=require('@mapbox/vector-tile').VectorTile;PBF=require('pbf');}catch(e){VT=false;}return !!VT;}
const TILE_CACHE=new Map();
async function tileFeatures(token,z,x,y){
  const key=z+'/'+x+'/'+y;if(TILE_CACHE.has(key))return TILE_CACHE.get(key);
  const r=await fetch(`https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/${z}/${x}/${y}.vector.pbf?access_token=${encodeURIComponent(token)}`);
  if(!r.ok)throw new Error('tile HTTP '+r.status);
  const t=new VT(new PBF(new Uint8Array(await r.arrayBuffer())));const out={lines:[],polys:[]};
  const n=2**z,ll=(px,py,ext)=>[((x+px/ext)/n)*360-180,Math.atan(Math.sinh(Math.PI*(1-2*(y+py/ext)/n)))*180/Math.PI];
  const add=(layer,filter,kind,req)=>{const L=t.layers[layer];if(!L)return;
    for(let i=0;i<L.length;i++){const f=L.feature(i);if(!filter(f.properties,f.type))continue;const g=f.loadGeometry();
      if(f.type===2)for(const part of g)out.lines.push({kind,req,layer,pts:part.map(p=>ll(p.x,p.y,L.extent))});
      else if(f.type===3)out.polys.push({kind,req,layer,rings:g.map(r=>r.map(p=>ll(p.x,p.y,L.extent)))});}};
  add('road',(p,ty)=>p.structure!=='tunnel'&&p.class!=='ferry'&&p.class!=='aerialway','built',3.05);
  add('building',()=>true,'built',3.05);
  add('landuse',p=>p.class==='parking','built',3.05);
  add('aeroway',()=>true,'built',3.05);
  add('water',()=>true,'water',18);
  add('waterway',()=>true,'water',18);
  add('landuse_overlay',p=>p.class==='wetland'||p.class==='wetland_noveg','water',18);
  TILE_CACHE.set(key,out);return out;
}
const mx=(lat0)=>111320*Math.cos(lat0*Math.PI/180);
function pSeg(px,py,ax,ay,bx,by){const vx=bx-ax,vy=by-ay,L=vx*vx+vy*vy;let t=L?((px-ax)*vx+(py-ay)*vy)/L:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+t*vx),py-(ay+t*vy));}
function inPoly(px,py,rings){let c=false;for(const r of rings)for(let i=0,j=r.length-1;i<r.length;j=i++){const[xi,yi]=r[i],[xj,yj]=r[j];if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))c=!c;}return c;}
async function independentCheck(page,swales){
  if(!swales||!swales.length)return {ran:true,swales:0,violations:0};
  if(!loadDecoders())return {ran:false,reason:'decoder packages not installed'};
  try{
    const token=await page.evaluate(()=>typeof MAPBOX_TOKEN==='string'?MAPBOX_TOKEN:null);if(!token)return {ran:false,reason:'no token in page'};
    let w=1e9,e=-1e9,s=1e9,n=-1e9;for(const f of swales)for(const [lng,lat] of f.geometry.coordinates){w=Math.min(w,lng);e=Math.max(e,lng);s=Math.min(s,lat);n=Math.max(n,lat);}
    const Z=15,N2=2**Z,tx=lng=>Math.floor((lng+180)/360*N2),ty=lat=>{const r=lat*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*N2);};
    const pad=0.0007,x0=tx(w-pad),x1=tx(e+pad),y0=ty(n+pad),y1=ty(s-pad),feats={lines:[],polys:[]};
    for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const f=await tileFeatures(token,Z,x,y);feats.lines.push(...f.lines);feats.polys.push(...f.polys);}
    const lat0=(s+n)/2,mX=mx(lat0),mY=111320;let viol=0,closestBuilt=Infinity,closestWater=Infinity;const examples=[];
    for(const f of swales){const P=f.geometry.coordinates;
      // dense sample at ~0.5 m
      const samples=[];for(let i=1;i<P.length;i++){const dx=(P[i][0]-P[i-1][0])*mX,dy=(P[i][1]-P[i-1][1])*mY,k=Math.max(1,Math.ceil(Math.hypot(dx,dy)/0.5));
        for(let j=0;j<=k;j++)samples.push([P[i-1][0]+(P[i][0]-P[i-1][0])*j/k,P[i-1][1]+(P[i][1]-P[i-1][1])*j/k]);}
      let bad=null;
      for(const sm of samples){const px=sm[0]*mX,py=sm[1]*mY;
        for(const l of feats.lines){for(let i=1;i<l.pts.length;i++){const d=pSeg(px,py,l.pts[i-1][0]*mX,l.pts[i-1][1]*mY,l.pts[i][0]*mX,l.pts[i][1]*mY);
          if(l.kind==='built'&&d<closestBuilt)closestBuilt=d;if(l.kind==='water'&&d<closestWater)closestWater=d;if(d<l.req-0.5){bad={layer:l.layer,d:Math.round(d*100)/100,req:l.req};break;}}if(bad)break;}
        if(bad)break;
        for(const pg of feats.polys){let d=Infinity;if(inPoly(sm[0],sm[1],pg.rings))d=0;else for(const r of pg.rings)for(let i=1;i<r.length;i++){const dd=pSeg(px,py,r[i-1][0]*mX,r[i-1][1]*mY,r[i][0]*mX,r[i][1]*mY);if(dd<d)d=dd;}
          if(pg.kind==='built'&&d<closestBuilt)closestBuilt=d;if(pg.kind==='water'&&d<closestWater)closestWater=d;if(d<pg.req-0.5){bad={layer:pg.layer,d:Math.round(d*100)/100,req:pg.req};break;}}
        if(bad)break;}
      if(bad){viol++;if(examples.length<5)examples.push({id:f.properties.id,...bad});}}
    return {ran:true,swales:swales.length,violations:viol,examples,tiles:(x1-x0+1)*(y1-y0+1),featuresChecked:{lines:feats.lines.length,polygons:feats.polys.length},
      closestBuiltM:Number.isFinite(closestBuilt)?Math.round(closestBuilt*100)/100:null,closestWaterM:Number.isFinite(closestWater)?Math.round(closestWater*100)/100:null};
  }catch(e){return {ran:false,reason:String(e).slice(0,300)};}
}
async function typeAndRun(page,q){
  await page.evaluate(query=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    if(!i||!b)throw Error('search box or Run button missing');
    i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},q);
}
// Watches the aquifer layer while a Regional run is in progress: counts every time it goes from filled to empty.
async function watchAquifer(page,ms){
  let last=null,blanks=0,max=0,samples=0,seenEmpty=false,refilled=false,midRun=0;const end=Date.now()+ms;
  while(Date.now()<end){
    let n=null;try{n=await page.evaluate(()=>{try{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
      const s=map&&map.getSource&&map.getSource('el-live-aquifer-15970');const d=s&&(s._data||(s.serialize&&s.serialize().data));
      return d&&Array.isArray(d.features)?d.features.length:null;}catch(_){return null;}});}catch(_){}
    samples++;if(n!=null){if(last>0&&n===0){blanks++;if(refilled)midRun++;}if(n===0)seenEmpty=true;if(n>0&&(seenEmpty||last===null||last===0))refilled=true;if(n>max)max=n;last=n;}
    await sleep(250);
  }
  return {samples,maxFeatures:max,timesWentBlank:blanks,blankedAfterRefillThisRun:midRun,endedWith:last};
}
async function open(browser){
  const ctx=await browser.newContext(prof.ctx);const page=await ctx.newPage();const errors=[];
  if(PINNED){const origin=new URL(BASE).origin;
    // Route at context scope so Worker script loads use the candidate Elder code too.
    await ctx.route('**/*',route=>{let u;try{u=new URL(route.request().url());}catch(_){return route.continue();}
      if(u.origin===origin&&(u.pathname==='/'||u.pathname==='/index.html')&&route.request().resourceType()==='document')
        return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:PINNED_HTML});
      if(u.origin===origin&&EXTRA[u.pathname])return route.fulfill({status:200,contentType:u.pathname.endsWith('.py')?'text/x-python; charset=utf-8':u.pathname.endsWith('.js')?'application/javascript; charset=utf-8':'application/octet-stream',body:EXTRA[u.pathname]});
      return route.continue();});}
  page.on('pageerror',e=>errors.push('pageerror: '+String(e).slice(0,300)));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,300));});
  await page.goto(BASE+'?livetest='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000,state:'attached'});
  await sleep(4000);
  // Evidence of an ordinary visitor arriving WITHOUT clicking Search or Property.
  if(firstArrivalGlobeAudit===null){
    const capture=()=>page.evaluate(()=>{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const c=m?.getCenter?.();
      const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
      return {mapPresent:!!m,center:c?{lat:c.lat,lng:c.lng}:null,
        zoom:m?.getZoom?.()??null,projection:m?.getProjection?.()?.name||null,
        target:target?{lat:target.lat,lng:target.lng,source:target.source}:null,
        baseGlobe:!!document.getElementById('mapboxBase')?.classList.contains('globe-overview')};
    });
    const first=await capture();
    await sleep(5000);
    const settled=await capture();
    firstArrivalGlobeAudit={at4s:first,at9s:settled};
    await shot(page,'startup-globe-before-search');
  }
  return {ctx,page,errors};
}
async function shot(page,name){try{await page.screenshot({path:OUT+'/'+name+'.png'});}catch(_){}}

async function regional(browser,q){
  const row={kind:'regional',query:q,profile:PROFILE};const t=Date.now();let h=null;
  try{
    h=await open(browser);row.before=await h.page.evaluate(snap);
    for(const run of [1,2]){
      const t0=Date.now();await typeAndRun(h.page,q);
      const watch=await watchAquifer(h.page,run===1?45000:30000);
      let finished=false;const f0=Date.now();
      while(Date.now()-f0<105000){finished=await h.page.evaluate(()=>{const b=document.getElementById('runBtn');return !!b&&!/deriving|loading|running/i.test(b.textContent||'');});if(finished)break;await sleep(1000);}
      const s=await h.page.evaluate(snap);
      row['run'+run]={seconds:Math.round((Date.now()-t0)/100)/10,finished,aquiferWatch:watch,
        tier:s.tier,location:s.location,regionalSwaleFeatures:s.regionalSwaleFeatures,aquiferFeatures:s.aquiferFeatures,
        elder:s.elder,regionalError:s.regionalError,layout:s.layout};
      await shot(h.page,'regional-'+q.toLowerCase()+'-run'+run);
    }
  }catch(e){row.couldNotRun=String(e).slice(0,400);}
  row.pageErrors=h?h.errors.slice(0,15):[];row.totalSeconds=Math.round((Date.now()-t)/1000);
  if(h)await h.ctx.close().catch(()=>{});
  rows.push(row);saveCheckpoint();console.log('EARTHLINE_LIVE_TEST '+JSON.stringify(row));
}
async function propertyOnce(page,pressNow){
  // After the search: if the site shows the Property button, press it (as a visitor would); then wait for Property to settle.
  const t0=Date.now();let pressed=false,timedOut=false,clickKind=null;
  const end=Date.now()+75000;
  while(Date.now()<end){
    const st=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};const de=document.documentElement;
      const bv=!!b&&getComputedStyle(b).display!=='none'&&!b.disabled&&b.getBoundingClientRect().width>1;
      return {button:bv,readyClass:de.classList.contains('earthline-property-ready-16188'),settled:a.settled===true,state:String(de.dataset.earthlinePropertyRunState||''),
        ready:(typeof M!=='undefined'&&M&&M.analysisReady&&de.dataset.earthlineAnalysisTier==='property')};});
    if(pressed&&st.settled&&st.state!=='running')break;
    if(!pressed&&st.ready&&st.state!=='running'&&Date.now()-t0>6000)break; // site went straight to Property
    if(!pressed&&st.button&&(pressNow||st.readyClass||Date.now()-t0>20000)){ // wait for the site to offer Property; after 20 s press anyway and record it
      try{await page.click('#earthlineDeclareProperty16169',{timeout:5000});clickKind='real click';}catch(_){await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169').click());clickKind='real click failed, scripted click used';}
      pressed=true;}
    await sleep(300);
  }
  if(Date.now()>=end)timedOut=true;
  await sleep(2500); // let the map finish drawing
  const s=await page.evaluate(snap);
  let geometry=null;try{geometry=await page.evaluate(geometryAudit);}catch(e){geometry={ok:false,error:String(e).slice(0,160)};}
  // Wait for terminal Elder outcome; a truthy "property-pending" snapshot is NOT a result.
  const e0=Date.now();let elder=s.elder,elderFinal=null;
  while(Date.now()-e0<90000){
    elderFinal=await page.evaluate(()=>{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      let sourceFeatures=null;
      try{const src=m?.getSource?.('earthline-elder-trees-17097');
        const data=src?._data||(src?.serialize?.().data);
        if(Array.isArray(data?.features))sourceFeatures=data.features.length;
      }catch(_){}
      return {state:e?.state||null,error:e?.error||null,
        propertyRunIdentity:e?.propertyRunIdentity||null,
        featureCount:e?.featureCount??null,
        poolCount:e?.dynamicCandidatePoolCount??null,
        mapPublished:e?.mapPublished??null,sourceFeatures,
        gauge:document.getElementById('earthlineElderTreesGauge17097')?.textContent||null,
        candidateCount:e?.summary?.candidates??null};
    });
    if(['committed','failed'].includes(elderFinal?.state))break;
    await sleep(2000);
  }
  elder=elderFinal;
  const sl=(s.engineSlopes&&s.engineSlopes.length)?s.engineSlopes:s.swales.filter(x=>Number.isFinite(x.slopePct)).map(x=>x.slopePct),ln=s.swales.filter(x=>Number.isFinite(x.lengthM)).map(x=>x.lengthM);
  return {seconds:Math.round((Date.now()-t0)/100)/10,propertyButtonPressed:pressed,clickKind,timedOut,
    tier:s.tier,location:s.location,center:s.center,analysisReady:s.analysisReady,
    engineSwales:s.engineSwales,shownSwales:s.shownSwales,slopesMeasured:sl.length,statusText:s.statusText,
    steepestSwalePct:sl.length?Math.max(...sl):null,swalesOver4pct:sl.filter(v=>v>4.0001).length,
    shortestSwaleM:ln.length?Math.min(...ln):null,longestSwaleM:ln.length?Math.max(...ln):null,
    rechargeTargets:s.rechargeTargets,elder,elderFinal,elderWaitSeconds:Math.round((Date.now()-e0)/1000),
    propertyAudit:s.propertyAudit,integrity:s.integrity,propertyFailure:s.propertyFailure,layout:s.layout,swales:s.swales,engine16600:s.engine16600,closestPairM:s.closestPairM,drawnLivingSwales:s.drawnLivingSwales,drawnTexture:s.drawnTexture,drawnLegacy:s.drawnLegacy,geometry};
}
async function property(browser,site){
  const row={kind:'property',site:site.name,query:site.q,profile:PROFILE};const t=Date.now();let h=null;
  try{
    h=await open(browser);
    for(const run of [1,2]){ // run 1 = first click on a fresh page; run 2 = same search again on the same page
      if(site.at){ // move the map so the crosshair sits on the coordinate, as a visitor does by dragging
        row.reachedBy='map moved to coordinate';
        await h.page.evaluate(c=>{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
          if(!map)throw Error('map not available');
          // A real map drag releases the country-center lock then commits the
          // new crosshair/Property target. Scripted jumpTo alone skips dragend.
          window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;
          map.jumpTo({center:c,zoom:17});
          map.fire?.('dragend');
        },site.at);
        await sleep(5000);
        row['targetBeforeRun'+run]=await h.page.evaluate(()=>{
          const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
          const c=m?.getCenter?.()||null,t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
          return {camera:c?{lng:c.lng,lat:c.lat}:null,
            target:t?{lng:t.lng,lat:t.lat,source:t.source,code:t.code}:null};
        });
      }else{row.reachedBy='address typed in search';await typeAndRun(h.page,site.q);}
      row['run'+run]=await propertyOnce(h.page,!!site.at);
      const R=row['run'+run];
      try{const feats=await h.page.evaluate(()=>{const r=window.__EARTHLINE_SWALE_ENGINE_HOOK_16600&&window.__EARTHLINE_SWALE_ENGINE_HOOK_16600.result();return r&&Array.isArray(r.features)?r.features:[];});
        R.independentExclusionCheck=await independentCheck(h.page,feats);}catch(e){R.independentExclusionCheck={ran:false,reason:String(e).slice(0,200)};}
      if(run===1){try{R.sensitivity=await h.page.evaluate(()=>{const hk=window.__EARTHLINE_SWALE_ENGINE_HOOK_16600;return hk?hk.sensitivity([0.78,1,3,5,10]):null;});}catch(e){R.sensitivity={error:String(e).slice(0,200)};}}
      await shot(h.page,'property-'+site.name+'-run'+run);
    }
    const a=row.run1,b=row.run2;
    row.sameResultBothRuns=!!(a&&b&&a.shownSwales===b.shownSwales&&JSON.stringify(a.swales)===JSON.stringify(b.swales));
    row.sameEngineHashBothRuns=!!(a&&b&&a.engine16600&&b.engine16600&&a.engine16600.hash&&a.engine16600.hash===b.engine16600.hash);
    row.sameStableIdsBothRuns=!!(a&&b&&a.engine16600&&b.engine16600&&JSON.stringify(a.engine16600.stableIds)===JSON.stringify(b.engine16600.stableIds));
    row.shownEqualsPublishedBothRuns=!!(a&&b&&a.engine16600&&b.engine16600&&a.shownSwales===a.engine16600.publishedSwales&&b.shownSwales===b.engine16600.publishedSwales);
  }catch(e){row.couldNotRun=String(e).slice(0,400);}
  row.pageErrors=h?h.errors.slice(0,15):[];row.totalSeconds=Math.round((Date.now()-t)/1000);
  if(h)await h.ctx.close().catch(()=>{});
  rows.push(row);saveCheckpoint();console.log('EARTHLINE_LIVE_TEST '+JSON.stringify(Object.assign({},row,{run1:row.run1&&Object.assign({},row.run1,{swales:undefined}),run2:row.run2&&Object.assign({},row.run2,{swales:undefined})})));
}


// Fail-closed test: the direct road/water tile request (the one WITHOUT the map's own sku parameter) is blocked. Property must halt and publish nothing.
async function failClosed(browser){
  const site=PROPERTY[0],row={kind:'fail-closed',site:site.name,profile:PROFILE};const t=Date.now();let h=null;
  try{
    h=await open(browser);let blocked=0;
    await h.page.route('**/api.mapbox.com/v4/mapbox.mapbox-streets-v8/**',route=>{const u=route.request().url();if(!/[?&]sku=/.test(u)){blocked++;return route.abort('failed');}return route.continue();});
    await h.page.evaluate(c=>{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;map.jumpTo({center:c,zoom:17});},site.at);await sleep(5000);
    row.run=await propertyOnce(h.page,true);row.blockedRequests=blocked;
    const snapNow=await h.page.evaluate(snap);row.after={engine:snapNow.engine16600,shownSwales:snapNow.shownSwales,engineSwales:snapNow.engineSwales,statusText:snapNow.statusText};
    await shot(h.page,'fail-closed-'+site.name);
  }catch(e){row.couldNotRun=String(e).slice(0,400);}
  row.pageErrors=h?h.errors.slice(0,15):[];row.totalSeconds=Math.round((Date.now()-t)/1000);
  if(h)await h.ctx.close().catch(()=>{});
  rows.push(row);saveCheckpoint();console.log('EARTHLINE_LIVE_TEST '+JSON.stringify(Object.assign({},row,{run:row.run&&Object.assign({},row.run,{swales:undefined})})));
}
async function waitRegionalDone(page,ms){const f0=Date.now();
  while(Date.now()-f0<ms){const ok=await page.evaluate(()=>{const b=document.getElementById('runBtn');return !!b&&!/deriving|loading|running/i.test(b.textContent||'');});if(ok)return true;await sleep(1000);}return false;}
async function lifecycle(browser,q){
  const row={kind:'lifecycle',query:q,profile:PROFILE,steps:[]};const t=Date.now();let h=null;
  try{
    h=await open(browser);
    for(const round of [1,2]){
      await typeAndRun(h.page,q);const watch=await watchAquifer(h.page,20000);const finished=await waitRegionalDone(h.page,130000);await sleep(2000);
      const r=await h.page.evaluate(snap);
      row.steps.push({step:'regional '+round,finished,tier:r.tier,regionalSwaleFeatures:r.regionalSwaleFeatures,aquiferFeatures:r.aquiferFeatures,blankedAfterRefillThisRun:watch.blankedAfterRefillThisRun,regionalError:r.regionalError});
      await shot(h.page,'lifecycle-'+q.toLowerCase()+'-regional'+round);
      const pr=await propertyOnce(h.page,false);
      row.steps.push({step:'property '+round,seconds:pr.seconds,clickKind:pr.clickKind,timedOut:pr.timedOut,tier:pr.tier,analysisReady:pr.analysisReady,engineSwales:pr.engineSwales,shownSwales:pr.shownSwales,steepestSwalePct:pr.steepestSwalePct,swalesOver4pct:pr.swalesOver4pct,rechargeTargets:pr.rechargeTargets,elder:pr.elder,propertyAudit:pr.propertyAudit,center:pr.center,swales:pr.swales});
      await shot(h.page,'lifecycle-'+q.toLowerCase()+'-property'+round);
    }
    const P=row.steps.filter(x=>x.step.startsWith('property')),R=row.steps.filter(x=>x.step.startsWith('regional'));
    row.propertySameBothRounds=P.length===2&&JSON.stringify(P[0].swales)===JSON.stringify(P[1].swales);
    row.regionalSameBothRounds=R.length===2&&R[0].regionalSwaleFeatures===R[1].regionalSwaleFeatures&&R[0].aquiferFeatures===R[1].aquiferFeatures;
    for(const x of P)x.swales=undefined;
  }catch(e){row.couldNotRun=String(e).slice(0,400);}
  row.pageErrors=h?h.errors.slice(0,15):[];row.totalSeconds=Math.round((Date.now()-t)/1000);
  if(h)await h.ctx.close().catch(()=>{});
  rows.push(row);saveCheckpoint();console.log('EARTHLINE_LIVE_TEST '+JSON.stringify(row));
}
let browser=null,launchError=null;
try{browser=await prof.engine.launch(PROFILE==='desktop-firefox'&&process.env.EARTHLINE_HEADFUL==='1'?{headless:false,firefoxUserPrefs:{'webgl.force-enabled':true,'webgl.disabled':false,'gfx.webrender.all':true,'webgl.enable-webgl2':true}}:{headless:true});}catch(e){launchError=String(e).slice(0,400);}
if(browser){
  for(const q of REGIONAL)await regional(browser,q);
  const want=s=>!SITE_FILTER.length||SITE_FILTER.includes(s.name);
  for(const s of FOCUS.filter(want))await property(browser,s);
  for(const s of PROPERTY.filter(want))await property(browser,s);
  if(process.env.EARTHLINE_COVERAGE==='1')for(const s of COVERAGE.filter(want))await property(browser,s);
  if(process.env.EARTHLINE_FAIL_CLOSED!=='0')await failClosed(browser);
  if(process.env.EARTHLINE_SKIP_LIFECYCLE!=='1')for(const q of (process.env.EARTHLINE_LIFECYCLE_REGION?[process.env.EARTHLINE_LIFECYCLE_REGION]:['Arizona','Vermont']))await lifecycle(browser,q);
  await browser.close().catch(()=>{});
}
saveCheckpoint(launchError);
console.log('EARTHLINE_LIVE_TEST_DONE '+PROFILE+' rows='+rows.length+(launchError?' launchError':''));
