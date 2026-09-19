import fs from 'node:fs';
import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=String(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
if(!STATES.length) throw new Error('STATES is empty');
const verdictPath=new URL('../earthline-state-verdicts.json',import.meta.url);
const persistedVerdicts=JSON.parse(fs.readFileSync(verdictPath,'utf8')).states||{};

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const rows=[];

page.on('pageerror',e=>console.log('PAGEERROR '+String(e)));
await page.goto(URL+'?all_state_regression='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});

for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'')),started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);

  let timedOut=false;
  try{
    await page.waitForFunction(prev=>{
      const t=String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'');
      const busy=document.getElementById('runBtn')?.getAttribute('aria-busy')==='true';
      return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||t!==prev)&&!!t&&!busy);
    },prior,{timeout:35000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(500);

  const snap=await page.evaluate(q=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const contours=Array.isArray(v?.contours?.features)?v.contours.features:[];
    const flows=Array.isArray(v?.flows?.features)?v.flows.features:[];
    const mids=sw.map(f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;}).filter(Array.isArray);
    const xs=mids.map(p=>+p[0]).filter(Number.isFinite),ys=mids.map(p=>+p[1]).filter(Number.isFinite);
    const bbox=xs.length?[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]:null;
    const loc=(typeof M!=='undefined'&&M&&M.loc)||null;
    const locBounds=Array.isArray(loc?.bounds)?loc.bounds:null;
    let occ=null;
    if(bbox&&mids.length){
      const dx=Math.max(1e-9,bbox[2]-bbox[0]),dy=Math.max(1e-9,bbox[3]-bbox[1]);
      const cells=new Set();
      for(const p of mids){const ix=Math.max(0,Math.min(3,Math.floor(4*(p[0]-bbox[0])/dx))),iy=Math.max(0,Math.min(3,Math.floor(4*(p[1]-bbox[1])/dy)));cells.add(ix+','+iy);}
      occ=cells.size;
    }
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null;
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const aq=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;
    const lv=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
    return {
      query:q,
      locName:String(loc?.name||loc?.fullName||''),
      locBounds,
      swaleBBox:bbox,
      occupancy4x4:occ,
      swales:sw.length,
      contours:contours.length,
      flows:flows.length,
      visible:d?.swaleLines??null,
      published:g?.publishedFeatures??null,
      candidates:g?.candidates??null,
      eligible:g?.jurisdictionEligibleCandidates??null,
      rejected:g?.jurisdictionRejectedCandidates??null,
      totalMs:p?.totalMs??null,
      unsafe:flow?.unsafeSegments??null,
      grid:lv?{w:lv.w??lv.grid?.w??null,h:lv.h??lv.grid?.h??null,valid:lv.validLandCellCount??null,ocean:lv.outsideLandCellCount??null,inland:lv.inlandWaterCellCount??null}:null,
      outside:b?.outsideAfterClip??null,
      aquifer:aq?{source:aq.source||null,features:aq.features??null}:null,
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    };
  },stateName);

  const row={state:stateName,elapsedMs:Date.now()-started,timedOut,snap};
  row.failReasons=[];
  if(timedOut)row.failReasons.push('timeout');
  if(snap.lastError)row.failReasons.push('live-error');
  if(!(Number(snap.totalMs)<=15000))row.failReasons.push('core>15s-or-missing');
  if(Number(snap.visible)!==Number(snap.published))row.failReasons.push('visible!=published');
  if(Number(snap.published||0)<=0)row.failReasons.push('no-published-swales');
  if(Number(snap.outside?.swales||0)!==0)row.failReasons.push('outside-swales');
  if(Number(snap.unsafe||0)!==0)row.failReasons.push('unsafe-water');
  if(Number(snap.eligible||0)>=160&&Number(snap.published||0)>=75&&Number(snap.occupancy4x4||0)<=7)row.failReasons.push('possible-distribution-cap-concentration');
  const persisted=persistedVerdicts[stateName]||null;
  if(persisted&&['MANUAL_FAIL','AUTOMATED_FAIL'].includes(String(persisted.verdict||'')))row.failReasons.push('persisted-'+String(persisted.verdict).toLowerCase());
  row.persistedVerdict=persisted;
  row.pass=row.failReasons.length===0;
  rows.push(row);
  console.log('EARTHLINE_ALL_STATE '+JSON.stringify(row));
}

console.log('EARTHLINE_ALL_STATE_SUMMARY '+JSON.stringify({
  states:rows.length,
  pass:rows.filter(r=>r.pass).length,
  fail:rows.filter(r=>!r.pass).length,
  failed:rows.filter(r=>!r.pass).map(r=>({state:r.state,reasons:r.failReasons,totalMs:r.snap.totalMs,swales:r.snap.swales,visible:r.snap.visible,published:r.snap.published,candidates:r.snap.candidates,eligible:r.snap.eligible,occupancy4x4:r.snap.occupancy4x4}))
}));
await browser.close();
if(rows.some(r=>!r.pass))process.exitCode=1;
