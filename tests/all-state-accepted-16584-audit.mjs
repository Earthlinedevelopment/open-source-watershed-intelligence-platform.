import { chromium } from 'playwright';
import fs from 'node:fs';

const SITE_URL='https://earthlinedevelopment.org/';
const STATES=String(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
const acceptedPath=process.env.ACCEPTED_HTML_PATH||'accepted-16584.html';
if(!STATES.length)throw new Error('STATES is empty');
const acceptedHtml=fs.readFileSync(acceptedPath,'utf8');

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(SITE_URL)){
    const resp=await route.fetch();
    await route.fulfill({response:resp,body:acceptedHtml});
    return;
  }
  await route.continue();
});
await page.goto(SITE_URL+'?accepted16584_matrix='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'')),started=Date.now();
 await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
 let timedOut=false;
 try{await page.waitForFunction(prev=>{const t=String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'');const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return !!e||((!prev||t!==prev)&&!!t);},prior,{timeout:45000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(400);
 const snap=await page.evaluate(q=>{
   const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
   const mids=sw.map(f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;}).filter(Array.isArray);
   const xs=mids.map(p=>+p[0]).filter(Number.isFinite),ys=mids.map(p=>+p[1]).filter(Number.isFinite);
   const bbox=xs.length?[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]:null;
   let occ=null;if(bbox&&mids.length){const dx=Math.max(1e-9,bbox[2]-bbox[0]),dy=Math.max(1e-9,bbox[3]-bbox[1]),cells=new Set();for(const p of mids){const ix=Math.max(0,Math.min(3,Math.floor(4*(p[0]-bbox[0])/dx))),iy=Math.max(0,Math.min(3,Math.floor(4*(p[1]-bbox[1])/dy)));cells.add(ix+','+iy);}occ=cells.size;}
   const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,lv=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
   return {query:q,swales:sw.length,visible:d?.swaleLines??null,published:pub?.generated??g?.publishedFeatures??null,generationPublished:g?.publishedFeatures??null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,rejected:g?.jurisdictionRejectedCandidates??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,occupancy4x4:occ,swaleBBox:bbox,grid:lv?{w:lv.w??lv.grid?.w??null,h:lv.h??lv.grid?.h??null,valid:lv.validLandCellCount??null,ocean:lv.outsideLandCellCount??null,inland:lv.inlandWaterCellCount??null}:null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
 },stateName);
 const row={state:stateName,elapsedMs:Date.now()-started,timedOut,snap};rows.push(row);console.log('EARTHLINE_ACCEPTED_STATE '+JSON.stringify(row));
}
console.log('EARTHLINE_ACCEPTED_STATE_SUMMARY '+JSON.stringify({states:rows.length,rows:rows.map(r=>({state:r.state,timedOut:r.timedOut,swales:r.snap.swales,visible:r.snap.visible,published:r.snap.published,candidates:r.snap.candidates,eligible:r.snap.eligible,totalMs:r.snap.totalMs,occupancy4x4:r.snap.occupancy4x4,lastError:r.snap.lastError?String(r.snap.lastError.error||r.snap.lastError):null}))}));
await browser.close();
