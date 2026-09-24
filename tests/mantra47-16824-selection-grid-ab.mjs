import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const TARGET={lat:34.74176,lng:-91.91143};
const OUT='artifacts/mantra47-16824-selection-grid-ab';
const MODES=[12,24,36,48];
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const results=[];

for(const grid of MODES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document') return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();
    const owner='const nx16783=12,ny16783=12;';
    const capture='window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;';
    if(body.split(owner).length-1!==1) throw new Error('final spread owner occurrence mismatch');
    if(body.split(capture).length-1!==1) throw new Error('capture owner occurrence mismatch');
    if(grid!==12) body=body.replace(owner,`const nx16783=${grid},ny16783=${grid};`);
    body=body.replace(capture,"window.__EARTHLINE_M47_16824_CHAIN={hy,candidates,chosen,map:(typeof map!=='undefined'?map:null)};"+capture);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });
  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  try{
    await page.goto(BASE+`?m47_16824=${grid}_${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    });
    try{
      await page.waitForFunction(()=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M47_16824_CHAIN;
      },null,{timeout:65000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(800);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(({T,grid})=>{
    const {hy,candidates,chosen}=window.__EARTHLINE_M47_16824_CHAIN;
    const rad=x=>x*Math.PI/180;
    const hav=(a,b)=>{const R=6371,dLat=rad(b[1]-a[1]),dLon=rad(b[0]-a[0]),q=Math.sin(dLat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));};
    const target=[T.lng,T.lat];
    const cellKey=(c,n)=>{
      if(!c||!Number.isFinite(Number(c.x))||!Number.isFinite(Number(c.y)))return null;
      const x=Math.max(0,Math.min(n-1,Math.floor(Number(c.x)*n/Math.max(1,hy.w))));
      const y=Math.max(0,Math.min(n-1,Math.floor(Number(c.y)*n/Math.max(1,hy.h))));
      return `${x},${y}`;
    };
    const minDist=c=>{
      const seg=Array.isArray(c?.segment)?c.segment:[];let d=Infinity;
      for(const p of seg)if(Array.isArray(p)&&p.length>=2)d=Math.min(d,hav(target,[Number(p[0]),Number(p[1])]));
      return d;
    };
    const rows=arr=>(arr||[]).map((c,i)=>({i,c,d:minDist(c)})).filter(r=>Number.isFinite(r.d)).sort((a,b)=>a.d-b.d);
    const cRows=rows(candidates),sRows=rows(chosen);
    const summary=rs=>{
      const counts={};for(const r of [5,10,20,40,80,120])counts[r]=rs.filter(x=>x.d<=r).length;
      return {total:rs.length,counts,nearest:rs.slice(0,12).map(r=>({i:r.i,d:Number(r.d.toFixed(3)),score:Number(r.c?.score??NaN),x:Number(r.c?.x??NaN),y:Number(r.c?.y??NaN),cell12:cellKey(r.c,12),cell18:cellKey(r.c,18),cell24:cellKey(r.c,24),cell36:cellKey(r.c,36),cell48:cellKey(r.c,48),activeCell:cellKey(r.c,grid)}))};
    };
    const nearest3=cRows.slice(0,3).map(r=>r.c);
    const pairwise=[];
    for(let i=0;i<nearest3.length;i++)for(let j=i+1;j<nearest3.length;j++){
      const a=nearest3[i],b=nearest3[j];
      pairwise.push({i,j,gridDistance:Number(Math.hypot(Number(a.x)-Number(b.x),Number(a.y)-Number(b.y)).toFixed(3)),cell12Same:cellKey(a,12)===cellKey(b,12),cell18Same:cellKey(a,18)===cellKey(b,18),cell24Same:cellKey(a,24)===cellKey(b,24),cell36Same:cellKey(a,36)===cellKey(b,36),cell48Same:cellKey(a,48)===cellKey(b,48)});
    }
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;
    const fine=window.EARTHLINE_FINE_DISPERSION_REBALANCE_16778||null;
    return {
      grid,
      candidates:summary(cRows),chosen:summary(sRows),pairwise,
      generated:pub?.generated??null,visible:disp?.swaleLines??pub?.overlaySwaleLines??null,
      unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip?.swales??null,
      coreMs:perf?.totalMs??null,
      spread:spread?{initialCells:spread.initialCells??null,finalCells:spread.finalCells??null,targetCells:spread.targetCells??null,attainableTargetCells:spread.attainableTargetCells??null,stop:spread.selectionStopReason??null,swaps:spread.swaps??null,chosenCount:spread.chosenCount??null,candidateCells:spread.candidateCells??null}:null,
      fine:fine?{candidateCells:fine.candidateCells??null,chosenCount:fine.chosenCount??null,initialChosenCells:fine.initialChosenCells??null,finalChosenCells:fine.finalChosenCells??null,swaps:fine.swaps??null,targetCells:fine.targetCells??null}:null
    };
  },{T:TARGET,grid});

  const result={grid,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};
  results.push(result);
  writeFileSync(`${OUT}/grid-${grid}.json`,JSON.stringify(result,null,2));
  try{await page.screenshot({path:`${OUT}/arkansas-grid-${grid}.png`,fullPage:false});}catch(_){}
  console.log('EARTHLINE_M47_16824 '+JSON.stringify(result));
  await context.close();
}

writeFileSync(`${OUT}/results.json`,JSON.stringify(results,null,2));
await browser.close();
if(results.some(r=>r.loadError||r.timedOut||r.pageErrors.length||!r.audit))process.exitCode=1;
