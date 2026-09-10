// Final VT/NY launch transition gate — test only; no product mutation.
import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const HARD_CEILING_MS=15000;
const TARGETS={
  Vermont:{lng:-73.012909,lat:44.513845,label:'61 Sleepy Hollow Rd, Essex, Vermont, USA'},
  'New York':{lng:-73.6077454739776,lat:43.5729282555177,label:'Lake George shoreline-adjacent land'}
};
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const browserErrors=[];
page.on('pageerror',e=>browserErrors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')browserErrors.push({type:'console',message:m.text()});});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602?.installed===true&&window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602?.auditOnly===true,null,{timeout:20000});

async function snap(){return await page.evaluate(()=>{
  const m=typeof M!=='undefined'?M:null;
  const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const rd=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
  const ca=window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null;
  const fa=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
  const pa=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const safety=m?.safetyAudit15806||null;
  const lock=m?.propertyResultLock15815||null;
  const water=m?.vectorNoBuildCoverage?.mappedWater16601||null;
  const why=document.getElementById('earthlineWhyNotHere15803');
  let debugVisible=false;
  if(why){const cs=getComputedStyle(why),r=why.getBoundingClientRect();debugVisible=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&r.width>1&&r.height>1;}
  let canvas={w:0,h:0,display:null,visibility:null};let rendered=null;let propertyLayersVisible=0;
  try{const c=map?.getCanvas?.();const r=c?.getBoundingClientRect?.();canvas={w:r?.width||0,h:r?.height||0,display:c?getComputedStyle(c).display:null,visibility:c?getComputedStyle(c).visibility:null};rendered=map?.queryRenderedFeatures?.()?.length??null;
    const style=map?.getStyle?.();for(const l of (style?.layers||[])){if(/earthline-property-safe/i.test(String(l.id||''))){const v=map?.getLayoutProperty?.(l.id,'visibility');if(v!=='none')propertyLayersVisible++;}}
  }catch(_){}
  return {
    loc:{name:String(m?.loc?.name||''),fullName:String(m?.loc?.fullName||''),countryCode:String(m?.loc?.countryCode||'')},
    displayed:d,
    renderSettlement:d?.renderSettlement||null,
    regionalDisplay:rd,
    cameraAudit:ca,
    flowAudit:fa,
    propertyAudit:pa,
    safety,lock,water,
    analysisReady:!!m?.analysisReady,
    propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',
    propertyReady:document.documentElement.classList.contains('earthline-property-ready-16188'),
    propertyButtonDisabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1600),
    map:{exists:!!map,canvas,rendered,propertyLayersVisible},
    debugVisible
  };
});}

async function chooseRegion(name){
  const started=Date.now(),err0=browserErrors.length;
  await page.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},name);
  await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const picked=await page.evaluate(name=>{
    const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const b=opts.find(x=>/state|region/i.test(x.textContent||'')&&(n(x.dataset.query||'')===n(name)||n(x.textContent||'').includes(n(name))))||opts.find(x=>n(x.textContent||'').includes(n(name)));
    if(!b)return null;const r={text:(b.textContent||'').trim(),q:b.dataset.query||''};b.click();return r;
  },name);
  if(!picked)throw new Error(`${name} suggestion not found`);
  let timeout=false;
  try{await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    const rs=d?.renderSettlement;
    return /ANALYSIS FAILED|screening published/i.test(s)&&(rs?.coreVisible===true||/ANALYSIS FAILED/i.test(s));
  },null,{timeout:18000,polling:150});}catch(_){timeout=true;}
  const elapsedMs=Date.now()-started,after=await snap();
  const identityText=norm([after.loc.name,after.loc.fullName,after.displayed?.name,after.displayed?.label,after.displayed?.location,after.displayed?.stateBoundary?.query,after.displayed?.jurisdictionBoundary?.query,after.status].filter(Boolean).join(' '));
  const identity=norm(name).split(' ').every(w=>identityText.includes(w));
  const mapVisible=after.map.exists&&after.map.canvas.w>300&&after.map.canvas.h>250&&after.map.canvas.display!=='none'&&after.map.canvas.visibility!=='hidden'&&Number(after.map.rendered||0)>0;
  const cameraReady=after.cameraAudit?.settled===true&&Number(after.cameraAudit?.coverage||0)>=0.98;
  const flowSafe=after.flowAudit?.safe===true&&Number(after.flowAudit?.unsafeSegments??after.flowAudit?.unsafeDisplayedSegments??0)===0;
  const presentation=Number(after.regionalDisplay?.waterPaths||0)>0&&Number(after.regionalDisplay?.swaleLines||0)>0;
  const noStaleProperty=after.map.propertyLayersVisible===0;
  const published=/screening published/i.test(after.status)&&after.renderSettlement?.coreVisible===true&&!/ANALYSIS FAILED/i.test(after.status);
  const pass=!timeout&&elapsedMs<=HARD_CEILING_MS&&identity&&mapVisible&&cameraReady&&flowSafe&&presentation&&noStaleProperty&&published&&!after.debugVisible;
  return {stage:`${name} Regional`,pass,timeout,elapsedMs,identity,mapVisible,cameraReady,flowSafe,presentation,noStaleProperty,published,picked,after,errors:browserErrors.slice(err0)};
}

async function property(name){
  const target=TARGETS[name],started=Date.now(),err0=browserErrors.length;
  const prepared=await page.evaluate(async target=>{
    const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
    const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'applyLocation rejected'};
    await new Promise(r=>setTimeout(r,800));
    const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'final-launch-transition-gate'},{openPanel:false});
    const b=document.getElementById('earthlineDeclareProperty16169');
    return {ok:!!set&&!!b&&!b.disabled};
  },target);
  if(!prepared.ok)return {stage:`${name} Property`,pass:false,prepared,elapsedMs:Date.now()-started};
  const call=await page.evaluate(async()=>{try{return {result:await window.earthlineDeclarePropertyAtCrosshair16169(),error:null}}catch(e){return {result:null,error:String(e)}}});
  let timeout=false;
  try{await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:15000,polling:120});}catch(_){timeout=true;}
  const elapsedMs=Date.now()-started,after=await snap();
  const a=after.propertyAudit||{};
  const mapVisible=after.map.exists&&after.map.canvas.w>300&&after.map.canvas.h>250&&after.map.canvas.display!=='none'&&after.map.canvas.visibility!=='hidden'&&Number(after.map.rendered||0)>0;
  const published=a.settled===true&&a.result===true&&(String(after.displayed?.tier||after.displayed?.mode||'').toLowerCase()==='property'||after.analysisReady);
  const safe=after.safety?.verified===true&&after.lock?.safetyVerified===true;
  const noStaleRegional=!/regional opportunity/i.test(after.status);
  let waterGate=true;
  if(name==='New York'){
    const w=after.water;waterGate=w?.status==='verified'&&Number(w?.waterFeatures||0)>0&&Number(w?.waterCells||0)>0&&Number(after.safety?.acceptedIntersections||0)===0;
  }
  const pass=!timeout&&!call.error&&elapsedMs<=HARD_CEILING_MS&&mapVisible&&published&&safe&&noStaleRegional&&waterGate&&!after.debugVisible;
  return {stage:`${name} Property`,pass,timeout,elapsedMs,mapVisible,published,safe,noStaleRegional,waterGate,prepared,call,after,errors:browserErrors.slice(err0)};
}

const stages=[];
stages.push(await chooseRegion('Vermont'));
if(stages.at(-1).pass)stages.push(await property('Vermont'));else stages.push({stage:'Vermont Property',pass:false,skipped:true,reason:'Vermont Regional failed'});
stages.push(await chooseRegion('New York'));
if(stages.at(-1).pass)stages.push(await property('New York'));else stages.push({stage:'New York Property',pass:false,skipped:true,reason:'New York Regional failed'});

const pass=stages.length===4&&stages.every(s=>s.pass===true);
const report={test:'Earthline final VT/NY no-scab launch transition gate',surface:'public-index',acceptedParent:16584,requiredLivePatches:[16601,16602,16603],hardCeilingMs:HARD_CEILING_MS,sequence:['Vermont Regional','Vermont Property','New York Regional','New York Property'],pass,stages,browserErrors:browserErrors.slice(0,40)};
console.log('EARTHLINE_FINAL_VT_NY '+JSON.stringify(report));
await browser.close();
if(!pass)process.exitCode=1;
