import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra47-16839-ultraflat-generation-ab';
const target={lat:34.77042,lng:-92.12943};
const capture='window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;';
const fineCall='makeSwales(h16780,c16780,false,swaleJurisdictionGeometry16539,null)';
const fineCallRelax='makeSwales(h16780,c16780,true,swaleJurisdictionGeometry16539,null)';
const metricOld='const metric16781=(row16780.coarseContourHit16788?0:10000)+pref16781*1200+ratio16781*180+row16780.preferred*6+spread16781*24+(Number(row16780.cluster16781)||0)*12+row16780.opportunity/16;';
const metricNew='const metric16781=(row16780.coarseContourHit16788?0:10000)+ratio16781*1200+pref16781*180+row16780.opportunity*6+spread16781*24+(Number(row16780.cluster16781)||0)*12+row16780.preferred/16;';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const variants=['control','relaxedFine','opportunityRelaxedFine'];
const results=[];
for(const variant of variants){
 const context=await browser.newContext({viewport:{width:1800,height:950}});
 await context.route('https://earthlinedevelopment.org/**',async route=>{
  if(route.request().resourceType()!=='document') return route.continue();
  const resp=await route.fetch(); let body=await resp.text();
  if(body.split(capture).length-1!==1) throw new Error('capture mismatch');
  if(variant!=='control'){
    if(body.split(fineCall).length-1!==1) throw new Error('fine makeSwales occurrence mismatch');
    body=body.replace(fineCall,fineCallRelax);
  }
  if(variant==='opportunityRelaxedFine'){
    if(body.split(metricOld).length-1!==1) throw new Error('metric occurrence mismatch');
    body=body.replace(metricOld,metricNew);
  }
  body=body.replace(capture,`window.__EARTHLINE_M47_16839={hy,candidates,chosen};${capture}`);
  await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
 });
 const page=await context.newPage(); const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
 let loadError=null,timedOut=false; const started=Date.now();
 try{
  await page.goto(BASE+`?m47_16839=${variant}_${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.__EARTHLINE_M47_16839;},null,{timeout:65000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(600);
 }catch(e){loadError=String(e);}
 const audit=loadError||timedOut?null:await page.evaluate(target=>{
  const {hy,candidates,chosen}=window.__EARTHLINE_M47_16839;const [west,south,east,northBound]=hy.bounds;
  const ll=(gx,gy)=>({lng:west+(gx/hy.w)*(east-west),lat:northBound-(gy/hy.h)*(northBound-south)});
  const hav=(a,b)=>{const R=6371,rad=x=>x*Math.PI/180,dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng),q=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;return 2*R*Math.asin(Math.sqrt(q));};
  const cp=c=>ll(Number(c.coverageGX16775??c.x),Number(c.coverageGY16775??c.y));
  const rings=[5,10,15,20,30,40];
  const ringCounts=list=>rings.map(r=>({r,c:list.filter(c=>hav(target,cp(c))<=r).length}));
  const isNorth=(c)=>{const p=cp(c),d=((Math.atan2(p.lng-target.lng,p.lat-target.lat)*180/Math.PI)+360)%360;return d<=67.5||d>=292.5;};
  const fine=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null;
  return {candidates:candidates.length,chosen:chosen.length,candidateRings:ringCounts(candidates),selectedRings:ringCounts(chosen),northCandidateRings:rings.map(r=>({r,count:candidates.filter(c=>isNorth(c)&&hav(target,cp(c))<=r).length})),northSelectedRings:rings.map(r=>({r,count:chosen.filter(c=>isNorth(c)&&hav(target,cp(c))<=r).length})),fine,fineTargetSelected:!!fine?.selected?.some(x=>Number(x.bx)===6&&Number(x.by)===5),fineTargetUnresolved:!!fine?.unresolvedAfter?.some(x=>Number(x.bx)===6&&Number(x.by)===5),pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,disp:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null};
 },target);
 const result={variant,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};results.push(result);console.log('EARTHLINE_M47_16839 '+JSON.stringify(result));
 try{await page.screenshot({path:`${OUT}/${variant}.png`,fullPage:false});}catch(_){}
 await context.close();
}
writeFileSync(`${OUT}/results.json`,JSON.stringify(results,null,2));
await browser.close();
