import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra47-16841-isolated-gap-priority-ab';
const target={lat:34.77042,lng:-92.12943};
const capture='window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;';
const gridOld='const fineNX16780=12,fineNY16780=12,channel16780=percentile(hy.acc,.972),fineRows16780=[];';
const gridNew='const fineNX16780=24,fineNY16780=24,channel16780=percentile(hy.acc,.972),fineRows16780=[];';
const bxOld='const bx16788=Math.max(0,Math.min(11,Math.floor(Number(g16788.x)*12/Math.max(1,hy.w))));';
const bxNew='const bx16788=Math.max(0,Math.min(23,Math.floor(Number(g16788.x)*24/Math.max(1,hy.w))));';
const byOld='const by16788=Math.max(0,Math.min(11,Math.floor(Number(g16788.y)*12/Math.max(1,hy.h))));';
const byNew='const by16788=Math.max(0,Math.min(23,Math.floor(Number(g16788.y)*24/Math.max(1,hy.h))));';
const gapOld='return r16780.valid>=20&&r16780.opportunity>=8&&ratio16780>=.18&&r16780.swales===0;';
const gapNew='return r16780.valid>=8&&r16780.opportunity>=4&&ratio16780>=.18&&r16780.swales===0;';
const auditOld='r16784.valid>=20&&r16784.opportunity>=8&&(r16784.opportunity/Math.max(1,r16784.valid))>=.18';
const auditNew='r16784.valid>=8&&r16784.opportunity>=4&&(r16784.opportunity/Math.max(1,r16784.valid))>=.18';
const loopOld='      for(const row16780 of gapsBefore16780){\n        row16780.cluster16781=';
const loopNew=`      const swalePoints16841=[];\n      for(const f16841 of (swales.features||[])){const c16841=f16841&&f16841.geometry&&f16841.geometry.type==='LineString'?f16841.geometry.coordinates:null;if(!Array.isArray(c16841)||!c16841.length)continue;const m16841=c16841[Math.floor((c16841.length-1)/2)],g16841=llGrid(hy,m16841);if(g16841&&Number.isFinite(Number(g16841.x))&&Number.isFinite(Number(g16841.y)))swalePoints16841.push({x:Number(g16841.x),y:Number(g16841.y)});}\n      for(const row16780 of gapsBefore16780){\n        const cx16841=(row16780.x0+row16780.x1)/2,cy16841=(row16780.y0+row16780.y1)/2;row16780.isolation16841=swalePoints16841.length?Math.min(...swalePoints16841.map(p16841=>Math.hypot(p16841.x-cx16841,p16841.y-cy16841))):99;\n        row16780.cluster16781=`;
const metricOld='const metric16781=(row16780.coarseContourHit16788?0:10000)+pref16781*1200+ratio16781*180+row16780.preferred*6+spread16781*24+(Number(row16780.cluster16781)||0)*12+row16780.opportunity/16;';
const metricIso='const metric16781=(row16780.coarseContourHit16788?0:10000)+(Number(row16780.isolation16841)||0)*1200+ratio16781*1000+pref16781*120+spread16781*20+(Number(row16780.cluster16781)||0)*8+row16780.opportunity/16;';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});const results=[];
for(const variant of ['control','grid24Isolation']){
 const context=await browser.newContext({viewport:{width:1800,height:950}});
 await context.route('https://earthlinedevelopment.org/**',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();const resp=await route.fetch();let body=await resp.text();if(body.split(capture).length-1!==1)throw new Error('capture mismatch');
  if(variant!=='control'){
   for(const [a,b,n] of [[gridOld,gridNew,'grid'],[bxOld,bxNew,'bx'],[byOld,byNew,'by']]){if(body.split(a).length-1!==1)throw new Error(n+' mismatch '+(body.split(a).length-1));body=body.replace(a,b);} 
   if(body.split(gapOld).length-1<1)throw new Error('gap mismatch');body=body.split(gapOld).join(gapNew);if(body.split(auditOld).length-1<1)throw new Error('audit mismatch');body=body.split(auditOld).join(auditNew);
   if(body.split(loopOld).length-1!==1)throw new Error('loop mismatch '+(body.split(loopOld).length-1));body=body.replace(loopOld,loopNew);
   if(body.split(metricOld).length-1!==1)throw new Error('metric mismatch');body=body.replace(metricOld,metricIso);
  }
  body=body.replace(capture,`window.__EARTHLINE_M47_16841={hy,candidates,chosen};${capture}`);await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
 });
 const page=await context.newPage(),pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));let loadError=null,timedOut=false;const started=Date.now();
 try{await page.goto(BASE+`?m47_16841=${variant}_${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.__EARTHLINE_M47_16841;},null,{timeout:65000,polling:100});}catch(_){timedOut=true;}await page.waitForTimeout(600);}catch(e){loadError=String(e);}
 const audit=loadError||timedOut?null:await page.evaluate(target=>{const {hy,candidates,chosen}=window.__EARTHLINE_M47_16841,[west,south,east,northBound]=hy.bounds;const ll=(gx,gy)=>({lng:west+(gx/hy.w)*(east-west),lat:northBound-(gy/hy.h)*(northBound-south)}),hav=(a,b)=>{const R=6371,rad=x=>x*Math.PI/180,dlat=rad(b.lat-a.lat),dlng=rad(b.lng-a.lng),q=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlng/2)**2;return 2*R*Math.asin(Math.sqrt(q));},cp=c=>ll(Number(c.coverageGX16775??c.x),Number(c.coverageGY16775??c.y)),rings=[5,10,15,20,30,40],isNorth=c=>{const p=cp(c),d=((Math.atan2(p.lng-target.lng,p.lat-target.lat)*180/Math.PI)+360)%360;return d<=67.5||d>=292.5;},fine=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null;return {candidates:candidates.length,chosen:chosen.length,candidateRings:rings.map(r=>({r,count:candidates.filter(c=>hav(target,cp(c))<=r).length})),selectedRings:rings.map(r=>({r,count:chosen.filter(c=>hav(target,cp(c))<=r).length})),northCandidateRings:rings.map(r=>({r,count:candidates.filter(c=>isNorth(c)&&hav(target,cp(c))<=r).length})),northSelectedRings:rings.map(r=>({r,count:chosen.filter(c=>isNorth(c)&&hav(target,cp(c))<=r).length})),fineSelected:fine?.selected,fineAdded:fine?.added,fineTargetSelected:!!fine?.selected?.some(x=>Number(x.bx)===12&&Number(x.by)===11),fineTargetWestSelected:!!fine?.selected?.some(x=>Number(x.bx)===11&&Number(x.by)===11),fineTargetUnresolved:!!fine?.unresolvedAfter?.some(x=>Number(x.bx)===12&&Number(x.by)===11),pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,disp:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null};},target);
 const result={variant,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};results.push(result);console.log('EARTHLINE_M47_16841 '+JSON.stringify(result));try{await page.screenshot({path:`${OUT}/${variant}.png`,fullPage:false});}catch(_){}await context.close();
}
writeFileSync(`${OUT}/results.json`,JSON.stringify(results,null,2));await browser.close();
