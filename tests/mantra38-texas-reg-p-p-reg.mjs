import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const HARD=15000;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
page.on('console',m=>{ if(m.type()==='error') errors.push('console:'+m.text()); });
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});

const snap=()=>{
  const m=(typeof M!=='undefined'&&M)||null;
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const r=window.earthlineRegional15778||{};
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const style=mp?.getStyle?.()||{};
  const swaleLayers=(style.layers||[]).filter(x=>/swale|corridor/i.test(String(x.id||''))).map(x=>({id:x.id,type:x.type,source:x.source,visibility:x.layout?.visibility||'visible'}));
  const swaleSources=[];
  for(const l of swaleLayers){
    if(!l.source||swaleSources.some(x=>x.id===l.source))continue;
    let count=null;try{const s=mp?.getSource?.(l.source);const data=s?._data||s?._options?.data||null;count=Number(data?.features?.length??NaN);if(!Number.isFinite(count))count=null;}catch(_){}
    swaleSources.push({id:l.source,count});
  }
  const c=mp?.getCenter?.();
  return {
    searchGen:Number(m?.searchGen||0), locName:String(m?.loc?.name||''), locFullName:String(m?.loc?.fullName||''),
    displayedTier:String(d.tier||d.mode||''), regionalActive:!!r.active, analysisReady:!!m?.analysisReady,
    propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''), propertyAudit:a,
    propertyReady:document.documentElement.classList.contains('earthline-property-ready-16188'),
    swales:Number(m?.swales?.length||0), recharge:Number(m?.rechZones?.length||0), swaleLayers, swaleSources,
    zoom:Number(mp?.getZoom?.()||0), center:c?{lng:Number(c.lng),lat:Number(c.lat)}:null,
    regionalVisualSwales:Number(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features?.length||0),
    regionalDisplayAudit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    corridorPublicationAudit:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    generationAudit:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    propertyLock:m?.propertyResultLock15815||null,
    safety:m?.safetyAudit15806||null,
    runError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().replace(/\s+/g,' ').slice(0,900)
  };
};

async function regional(label){
  const before=await page.evaluate(snap), t0=Date.now();
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timeout=false;
  try{await page.waitForFunction(()=>{const m=(typeof M!=='undefined'&&M)||null,r=window.earthlineRegional15778||{},d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};const text=String([m?.loc?.name,m?.loc?.fullName,d?.name,d?.label].join(' ')).toLowerCase();return text.includes('texas')&&!r.active&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';},null,{timeout:24000,polling:200});}catch(_){timeout=true;}
  const after=await page.evaluate(snap); return {stage:label,elapsedMs:Date.now()-t0,timeout,pass:!timeout&&Date.now()-t0<=HARD&&after.regionalVisualSwales>0,after};
}

async function property(label){
  try{await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&!b.disabled;},null,{timeout:10000,polling:150});}catch(_){}
  const before=await page.evaluate(snap); const priorAt=String(before.propertyAudit?.at||before.propertyAudit?.settledAt||''); const t0=Date.now();
  const clicked=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true;});
  if(!clicked)return {stage:label,clicked:false,pass:false,elapsedMs:0,before,after:before};
  let timeout=false;
  try{await page.waitForFunction(prior=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;const state=String(document.documentElement.dataset.earthlinePropertyRunState||'');if(!a||a.settled!==true||state==='running')return false;const now=String(a.at||a.settledAt||'');return !prior||!now||now!==prior;},priorAt,{timeout:20000,polling:150});}catch(_){timeout=true;}
  await page.waitForTimeout(400);
  const after=await page.evaluate(snap); const sourceVisible=after.swaleSources.some(s=>Number(s.count)>0); const generated=after.swales>0||Number(after.generationAudit?.generated||after.generationAudit?.selected||0)>0;
  const published=after.analysisReady&&String(after.displayedTier).toLowerCase()==='property';
  return {stage:label,clicked:true,elapsedMs:Date.now()-t0,timeout,generated,sourceVisible,published,pass:!timeout&&(Date.now()-t0)<=HARD&&generated&&sourceVisible&&published,before,after};
}

const stages=[];
stages.push(await regional('Texas Regional 1'));
stages.push(await property('Texas Property 1'));
stages.push(await property('Texas Property 2'));
stages.push(await regional('Texas Regional reclaim'));
const report={test:'Texas reg-p-p-reg from locked NY-water build',baseCommit:'16e601d9037107de94d72cf319f9827e91341bfa',hardCeilingMs:HARD,pass:stages.every(s=>s.pass===true),stages,errors:errors.slice(0,30)};
console.log('MANTRA38_TEXAS_SEQUENCE '+JSON.stringify(report));
await browser.close();
if(!report.pass)process.exitCode=1;
