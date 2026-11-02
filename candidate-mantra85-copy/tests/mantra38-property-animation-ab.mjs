import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

async function run(suppressAfterProperty){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const snap=()=>{const m=(typeof M!=='undefined'&&M)||null,r=window.earthlineRegional15778||{},a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return {regionalActive:!!r.active,propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),propertyAudit:a,visual:Number(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features?.length||0),stall:window.EARTHLINE_REGIONAL_STALL_WATCHDOG_16347||null,orb:window.EARTHLINE_ORB_RESPONSIVENESS_16245||null,preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().replace(/\s+/g,' ').slice(0,500),searchGen:Number(m?.searchGen||0)};};
  async function regional(){
    const oldToken=await page.evaluate(()=>window.EARTHLINE_REGIONAL_STALL_WATCHDOG_16347?.runToken||null);
    const t0=Date.now();
    await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
    let publishedAt=null,last=null;
    while(Date.now()-t0<22000){await page.waitForTimeout(250);last=await page.evaluate(snap);const token=last.stall?.runToken||null;const newRun=token&&token!==oldToken;if(newRun&&last.preflight?.runToken===token&&last.preflight?.passed===true&&last.visual>0){publishedAt=Date.now()-t0;break;}}
    return {elapsedMs:publishedAt??Date.now()-t0,published:publishedAt!=null,last:last||await page.evaluate(snap)};
  }
  const first=await regional();
  try{await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&!b.disabled;},null,{timeout:10000,polling:100})}catch(_){}
  const pt0=Date.now();const clicked=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true;});
  if(clicked){try{await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:15000,polling:100})}catch(_){}}
  const property={clicked,elapsedMs:Date.now()-pt0,snap:await page.evaluate(snap)};
  if(suppressAfterProperty){await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);}
  const reclaim=await regional();
  await page.close();
  return {suppressAfterProperty,first,property,reclaim,errors:errors.slice(0,20)};
}

const control=await run(false);
const treatment=await run(true);
console.log('MANTRA38_PROPERTY_ANIMATION_AB '+JSON.stringify({control,treatment,deltaMs:control.reclaim.elapsedMs-treatment.reclaim.elapsedMs}));
await browser.close();
