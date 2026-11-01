import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/lab.html';
const HARD_CEILING_MS=15000;
const WAIT_LIMIT_MS=26000;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
const host=await page.waitForSelector('#earthline-lab-frame',{timeout:20000});
const frame=await host.contentFrame();if(!frame)throw new Error('lab iframe unavailable');
await frame.waitForSelector('#searchInput',{timeout:30000});
await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});

/* Test-only probe. It does not alter rendering; it records the projected screen geometry
   passed to the existing authoritative Regional renderer before that renderer returns. */
await frame.evaluate(()=>{
  const base=window.earthlineRenderRegionalOverlay16020;
  if(typeof base!=='function'||base.__earthlineProbe16601)return;
  const wrapped=function(data){
    try{
      const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const rows=[];
      for(const f of (data?.swales?.features||[])){
        const coords=f?.geometry?.type==='LineString'?(f.geometry.coordinates||[]):[];
        const pts=[];
        for(const ll of coords){
          try{const p=map?.project?.({lng:Number(ll[0]),lat:Number(ll[1])})||map?.project?.([Number(ll[0]),Number(ll[1])]);if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))pts.push({x:p.x,y:p.y});}catch(_){ }
        }
        let len=0;for(let i=1;i<pts.length;i++)len+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);
        rows.push({geometryType:String(f?.geometry?.type||''),coordCount:coords.length,projectedPoints:pts.length,pixelLength:Number(len.toFixed(3)),grade:String(f?.properties?.grade||''),rank:Number(f?.properties?.rank||0)});
      }
      const lengths=rows.map(r=>r.pixelLength).filter(Number.isFinite).sort((a,b)=>a-b);
      window.EARTHLINE_REGIONAL_RENDER_PROBE_16601={features:rows.length,rows,min:lengths[0]??null,max:lengths.at(-1)??null,median:lengths.length?lengths[Math.floor(lengths.length/2)]:null,ge22:lengths.filter(v=>v>=22).length,ge10:lengths.filter(v=>v>=10).length,at:new Date().toISOString()};
    }catch(e){window.EARTHLINE_REGIONAL_RENDER_PROBE_16601={error:String(e),at:new Date().toISOString()};}
    return base.apply(this,arguments);
  };
  wrapped.__earthlineProbe16601=true;wrapped.__base=base;
  window.earthlineRenderRegionalOverlay16020=wrapped;
});

const snap=()=>{
  const m=typeof M!=='undefined'&&M;
  const r=window.earthlineRegional15778||{};
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const lock=m&&m.propertyResultLock15815||null;
  const s=m&&m.safetyAudit15806||null;
  const why=document.getElementById('earthlineWhyNotHere15803');
  const btn=document.getElementById('earthlineDeclareProperty16169');
  let debug=false;
  if(why){const cs=getComputedStyle(why),b=why.getBoundingClientRect();debug=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&b.width>1&&b.height>1;}
  return {
    searchGen:Number(m&&m.searchGen||0),
    locName:String(m&&m.loc&&m.loc.name||''),
    locFullName:String(m&&m.loc&&m.loc.fullName||''),
    displayed:{tier:String(d.tier||d.mode||''),name:String(d.name||d.label||d.location||'')},
    regional:{active:!!r.active,mode:String(r.mode||'')},
    analysisReady:!!(m&&m.analysisReady),
    propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    propertyReady:document.documentElement.classList.contains('earthline-property-ready-16188'),
    propertyButton:!!btn,
    propertyButtonDisabled:!!(btn&&btn.disabled),
    audit:a,
    lock,
    safety:s,
    jurisdiction:m&&m.propertyJurisdiction16516||null,
    water:m&&m.vectorNoBuildCoverage&&m.vectorNoBuildCoverage.mappedWater16601||null,
    swales:Number(m&&m.swales&&m.swales.length||0),
    recharge:Number(m&&m.rechZones&&m.rechZones.length||0),
    regionalDisplayAudit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    corridorPublicationAudit:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    generationAudit:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    regionalRenderProbe16601:window.EARTHLINE_REGIONAL_RENDER_PROBE_16601||null,
    mapZoom:Number((window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null))?.getZoom?.()||0),
    debugVisible:debug,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1200)
  };
};

const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

async function regional(query){
  const before=await frame.evaluate(snap);const startErr=errors.length;const started=Date.now();
  await frame.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');if(!i||!b)throw new Error('search controls unavailable');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  let timeout=false;
  try{await frame.waitForFunction(({q,g})=>{const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const m=typeof M!=='undefined'&&M,r=window.earthlineRegional15778||{},d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};const text=n([m&&m.loc&&m.loc.name,m&&m.loc&&m.loc.fullName,d.name,d.label,d.location].join(' '));const words=n(q).split(' ').filter(Boolean);const identity=words.every(w=>text.includes(w));return identity&&Number(m&&m.searchGen||0)>=Number(g||0)&&r.active!==true&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';},{q:query,g:before.searchGen},{timeout:WAIT_LIMIT_MS,polling:200});}catch(_){timeout=true;}
  const elapsedMs=Date.now()-started;const after=await frame.evaluate(snap);const text=norm([after.locName,after.locFullName,after.displayed.name].join(' '));const identity=norm(query).split(' ').filter(Boolean).every(w=>text.includes(w));
  const pass=!timeout&&elapsedMs<=HARD_CEILING_MS&&identity&&!after.debugVisible&&after.regional.active!==true;
  return {stage:`${query} Regional`,query,pass,timeout,elapsedMs,identity,after,errors:errors.slice(startErr,startErr+12)};
}

async function property(label){
  try{await frame.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&document.documentElement.classList.contains('earthline-property-ready-16188')&&!b.disabled;},null,{timeout:8000,polling:150});}catch(_){ }
  const pre=await frame.evaluate(snap);const startErr=errors.length;const started=Date.now();
  const clicked=await frame.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true;});
  if(!clicked)return {stage:`${label} Property`,pass:false,reason:'Property control unavailable',elapsedMs:0,pre,after:pre,errors:[]};
  let timeout=false;
  try{await frame.waitForFunction(({priorGen})=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};const state=String(document.documentElement.dataset.earthlinePropertyRunState||'');return a.settled===true&&Number(a.searchGenAtSettle||a.searchGen||0)>=Number(priorGen||0)&&state!=='running';},{priorGen:pre.searchGen},{timeout:WAIT_LIMIT_MS,polling:150});}catch(_){timeout=true;}
  const elapsedMs=Date.now()-started;const after=await frame.evaluate(snap);const a=after.audit||{};
  const published=a.settled===true&&a.result===true&&(String(after.displayed.tier).toLowerCase()==='property'||after.analysisReady);
  const safe=after.safety?.verified===true&&after.lock?.safetyVerified===true;
  const staleRegional=after.regional.active===true||/regional opportunity/i.test(after.status);
  const pass=!timeout&&elapsedMs<=HARD_CEILING_MS&&published&&safe&&!staleRegional&&!after.debugVisible;
  return {stage:`${label} Property`,pass,timeout,elapsedMs,published,safe,staleRegional,after,errors:errors.slice(startErr,startErr+12)};
}

const stages=[];
stages.push(await regional('Vermont'));
if(stages.at(-1).pass)stages.push(await property('Vermont'));
else stages.push({stage:'Vermont Property',pass:false,skipped:true,reason:'Vermont Regional failed'});
stages.push(await regional('New York'));
if(stages.at(-1).pass)stages.push(await property('New York'));
else stages.push({stage:'New York Property',pass:false,skipped:true,reason:'New York Regional failed'});

const pass=stages.length===4&&stages.every(x=>x.pass===true);
const report={test:'Earthline final VT/NY end-to-end launch regression',labBuild:16601,acceptedParent:16584,sequence:['Vermont Regional','Vermont Property','New York Regional','New York Property'],hardCeilingMs:HARD_CEILING_MS,pass,stages,browserErrors:errors.slice(0,40)};
console.log('EARTHLINE_FINAL_VT_NY '+JSON.stringify(report));
await browser.close();
if(!pass)process.exitCode=1;
