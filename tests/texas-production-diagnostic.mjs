import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const CASES=['Oklahoma','Texas'];
const browser=await chromium.launch({headless:true});
const results=[];

function snapshot(){
  const m=typeof M!=='undefined'&&M?M:null;
  const r=window.earthlineRegional15778||null;
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const a=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  let swales=0,flows=0;
  try{
    const s=map?.getSource?.('el-live-swales-15970'),f=map?.getSource?.('el-live-flows-15970');
    swales=Number(s?._data?.features?.length||s?._options?.data?.features?.length||0);
    flows=Number(f?._data?.features?.length||f?._options?.data?.features?.length||0);
  }catch(_){}
  return {
    readyState:document.readyState,
    mapReady:!!map,
    searchGen:Number(m?.searchGen||0),
    locName:String(m?.loc?.name||''),
    locFullName:String(m?.loc?.fullName||''),
    analysisReady:!!m?.analysisReady,
    runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',
    regional:r?{active:!!r.active,mode:String(r.mode||''),summary:r.summary||null}:null,
    displayed:d?{tier:String(d.tier||d.mode||''),name:String(d.name||d.label||d.location||''),runToken:d.runToken||d.token||null}:null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1000),
    preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    corridorAudit:a?{tier:a.tier,generated:a.generated,sourceFeatures:a.sourceFeatures,overlaySwaleLines:a.overlaySwaleLines,checkedAt:a.checkedAt}:null,
    swales,flows,
    landValidity:window.EARTHLINE_LAND_VALIDITY_16584?{source:window.EARTHLINE_LAND_VALIDITY_16584.source,landAreas:window.EARTHLINE_LAND_VALIDITY_16584.landAreas,waterAreas:window.EARTHLINE_LAND_VALIDITY_16584.waterAreas,waterParts:Array.isArray(window.EARTHLINE_LAND_VALIDITY_16584.waterParts)?window.EARTHLINE_LAND_VALIDITY_16584.waterParts.length:null}:null,
    basinAudit:window.EARTHLINE_BASIN_WATER_DISPLAY_AUDIT_MANTRA38||null
  };
}

for(const query of CASES){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e),stack:String(e?.stack||'').slice(0,2500)}));
  page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text().slice(0,2500)});});
  const started=Date.now();
  let loadError=null,timedOut=false;
  try{
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      if(!i||!b)throw new Error('search controls unavailable');
      i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
        const m=typeof M!=='undefined'&&M?M:null,r=window.earthlineRegional15778||{},d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
        const loc=n([m?.loc?.name,m?.loc?.fullName,d?.name,d?.label,d?.location].filter(Boolean).join(' '));
        const identity=n(q).split(' ').filter(Boolean).every(w=>loc.includes(w));
        const failed=!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
        const settled=document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true'&&r.active!==true;
        return failed||(identity&&settled);
      },query,{timeout:45000,polling:150});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(1200);
  }catch(e){loadError=String(e);}
  let after=null;
  try{after=await page.evaluate(snapshot);}catch(e){loadError=loadError||String(e);}
  const elapsedMs=Date.now()-started;
  const result={query,elapsedMs,timedOut,loadError,after,errors:errors.slice(0,30)};
  results.push(result);
  console.log('EARTHLINE_TEXAS_DIAGNOSTIC '+JSON.stringify(result));
  await page.close();
}

console.log('EARTHLINE_TEXAS_DIAGNOSTIC_SUMMARY '+JSON.stringify(results));
const texas=results.find(x=>x.query==='Texas');
if(!texas||texas.loadError||texas.timedOut||texas.after?.lastError||texas.after?.runBusy||texas.after?.regional?.active)process.exitCode=1;
await browser.close();
