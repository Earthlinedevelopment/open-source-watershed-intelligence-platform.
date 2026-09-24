import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const TARGET={lat:34.74176,lng:-91.91143};
const OUT='artifacts/mantra47-16827-fine-priority-ab';
const MODES=[
  {name:'control18',N:18,quality:false},
  {name:'quality24',N:24,quality:true},
  {name:'quality36',N:36,quality:true},
  {name:'quality48',N:48,quality:true}
];
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];

for(const mode of MODES){
  const {name,N,quality}=mode;
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document') return route.continue();
    const resp=await route.fetch(); let body=await resp.text();
    const sx="const fx16778=Math.max(0,Math.min(17,Math.floor(gx16778*18/Math.max(1,hy.w))));";
    const sy="const fy16778=Math.max(0,Math.min(17,Math.floor(gy16778*18/Math.max(1,hy.h))));";
    const sp="return {fx:fx16778,fy:fy16778,cell:fx16778+','+fy16778,parent:Math.floor(fx16778/3)+','+Math.floor(fy16778/3)};";
    const sort="missing16778.sort((a16778,b16778)=>b16778.needThree-a16778.needThree||a16778.parentRatio-b16778.parentRatio||b16778.nearest-a16778.nearest||(Number(b16778.row.candidate.score)||0)-(Number(a16778.row.candidate.score)||0));";
    const capture='window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;';
    for(const needle of [sx,sy,sp,sort,capture])if(body.split(needle).length-1!==1)throw new Error('16778 owner/capture occurrence mismatch: '+needle.slice(0,40));
    if(N!==18){
      body=body.replace(sx,`const fx16778=Math.max(0,Math.min(${N-1},Math.floor(gx16778*${N}/Math.max(1,hy.w))));`);
      body=body.replace(sy,`const fy16778=Math.max(0,Math.min(${N-1},Math.floor(gy16778*${N}/Math.max(1,hy.h))));`);
      body=body.replace(sp,`return {fx:fx16778,fy:fy16778,cell:fx16778+','+fy16778,parent:Math.floor(fx16778*6/${N})+','+Math.floor(fy16778*6/${N})};`);
    }
    if(quality){
      body=body.replace(sort,"missing16778.sort((a16778,b16778)=>b16778.needThree-a16778.needThree||(Number(b16778.row.candidate.score)||0)-(Number(a16778.row.candidate.score)||0)||a16778.parentRatio-b16778.parentRatio||b16778.nearest-a16778.nearest);");
    }
    body=body.replace(capture,"window.__EARTHLINE_M47_16827_CHAIN={hy,candidates,chosen};"+capture);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });
  const page=await context.newPage(); const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false; const started=Date.now();
  try{
    await page.goto(BASE+`?m47_16827=${name}_${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
    try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.__EARTHLINE_M47_16827_CHAIN;},null,{timeout:65000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(800);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(({T,N})=>{
    const {hy,candidates,chosen}=window.__EARTHLINE_M47_16827_CHAIN;
    const rad=x=>x*Math.PI/180;
    const hav=(a,b)=>{const R=6371,dLat=rad(b[1]-a[1]),dLon=rad(b[0]-a[0]),q=Math.sin(dLat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));};
    const target=[T.lng,T.lat];
    const minDist=c=>{let d=Infinity;for(const p of (Array.isArray(c?.segment)?c.segment:[]))if(Array.isArray(p)&&p.length>=2)d=Math.min(d,hav(target,[Number(p[0]),Number(p[1])]));return d;};
    const fineKey=c=>{const gx=Number.isFinite(Number(c?.coverageGX16775))?Number(c.coverageGX16775):Number(c?.x),gy=Number.isFinite(Number(c?.coverageGY16775))?Number(c.coverageGY16775):Number(c?.y);if(!Number.isFinite(gx)||!Number.isFinite(gy))return null;return `${Math.max(0,Math.min(N-1,Math.floor(gx*N/Math.max(1,hy.w))))},${Math.max(0,Math.min(N-1,Math.floor(gy*N/Math.max(1,hy.h))))}`;};
    const rows=arr=>(arr||[]).map((c,i)=>({i,c,d:minDist(c)})).filter(r=>Number.isFinite(r.d)).sort((a,b)=>a.d-b.d);
    const summary=rs=>{const counts={};for(const r of [5,10,20,40,80,120])counts[r]=rs.filter(x=>x.d<=r).length;return {total:rs.length,counts,nearest:rs.slice(0,15).map(r=>({i:r.i,d:Number(r.d.toFixed(3)),score:Number(r.c?.score??NaN),x:Number(r.c?.x??NaN),y:Number(r.c?.y??NaN),fineCell:fineKey(r.c)}))};};
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,fine=window.EARTHLINE_FINE_DISPERSION_REBALANCE_16778||null,spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;
    return {candidates:summary(rows(candidates)),chosen:summary(rows(chosen)),generated:pub?.generated??null,visible:disp?.swaleLines??pub?.overlaySwaleLines??null,unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip?.swales??null,coreMs:perf?.totalMs??null,fine:fine?{candidateCells:fine.candidateCells,chosenCount:fine.chosenCount,initialChosenCells:fine.initialChosenCells,finalChosenCells:fine.finalChosenCells,swaps:fine.swaps,targetCells:fine.targetCells}:null,spread:spread?{initialCells:spread.initialCells,finalCells:spread.finalCells,targetCells:spread.targetCells,swaps:spread.swaps}:null};
  },{T:TARGET,N});
  const result={name,N,quality,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit}; results.push(result); writeFileSync(`${OUT}/${name}.json`,JSON.stringify(result,null,2));
  try{await page.screenshot({path:`${OUT}/arkansas-${name}.png`,fullPage:false});}catch(_){}
  console.log('EARTHLINE_M47_16827 '+JSON.stringify(result)); await context.close();
}
writeFileSync(`${OUT}/results.json`,JSON.stringify(results,null,2)); await browser.close();
if(results.some(r=>r.loadError||r.timedOut||r.pageErrors.length||!r.audit))process.exitCode=1;
