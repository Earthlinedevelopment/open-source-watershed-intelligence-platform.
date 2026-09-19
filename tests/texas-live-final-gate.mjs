import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const old='await Promise.resolve();';
  const n=body.split(old).length-1;
  patches.computeYieldMatches=n;
  if(n!==5)throw new Error('expected 5 deployed compute microtask yields, found '+n);
  body=body.split(old).join("await(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function'?globalThis.scheduler.yield():new Promise(r=>requestAnimationFrame(()=>r())));");
  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_scheduler_yield='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=5;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
  await page.evaluate(()=>{
    window.__earthlineFrameProbe={frames:0,maxGap:0,last:performance.now(),started:performance.now(),stopped:false};
    const tick=t=>{const p=window.__earthlineFrameProbe;if(!p||p.stopped)return;const g=t-p.last;if(g>p.maxGap)p.maxGap=g;p.last=t;p.frames++;requestAnimationFrame(tick);};requestAnimationFrame(tick);
  });
  const started=Date.now();
  await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(400);
  const state=await page.evaluate(()=>{
    if(window.__earthlineFrameProbe)window.__earthlineFrameProbe.stopped=true;
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    return {frameProbe:window.__earthlineFrameProbe||null,schedulerYield:!!(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function'),swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,outside:b?.outsideAfterClip??null,aquifer:a,unsafe:flow?.unsafeSegments??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
  });
  const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_SCHEDULER_YIELD '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_SCHEDULER_YIELD_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
const bad=rows.some(r=>r.timedOut||r.state.lastError||!(r.state.totalMs<=15000)||r.elapsedMs>15000||r.state.visible!==66||r.state.published!==66||Number(r.state.unsafe)!==0||Number(r.state.outside?.swales||0)!==0||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10||!/Principal Aquifers/i.test(String(r.state.aquifer?.source||''))||Number(r.state.aquifer?.features||0)!==83);
if(bad)process.exitCode=1;
