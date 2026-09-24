import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const TARGET={lat:34.74176,lng:-91.91143};
const OUT='artifacts/mantra47-16822-ar-pipeline';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:950}});
await context.route('https://earthlinedevelopment.org/**',async route=>{
  if(route.request().resourceType()!=='document') return route.continue();
  const resp=await route.fetch();
  let body=await resp.text();
  const needle='window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;';
  if(body.split(needle).length-1!==1) throw new Error('generation capture owner not found');
  body=body.replace(needle,"window.__EARTHLINE_M47_16822_CHAIN={hy,candidates,chosen,map:(typeof map!=='undefined'?map:null)};"+needle);
  await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
});

const page=await context.newPage();
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
let loadError=null,timedOut=false;const started=Date.now();
try{
  await page.goto(BASE+'?m47_16822='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  });
  try{
    await page.waitForFunction(()=>{
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      return /screening published\./i.test(s)&&!!window.__EARTHLINE_M47_16822_CHAIN;
    },null,{timeout:60000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(1000);
}catch(e){loadError=String(e);}

const audit=loadError||timedOut?null:await page.evaluate(T=>{
  const {hy,candidates,chosen,map}=window.__EARTHLINE_M47_16822_CHAIN;
  const rad=x=>x*Math.PI/180;
  const hav=(a,b)=>{const R=6371,dLat=rad(b[1]-a[1]),dLon=rad(b[0]-a[0]),q=Math.sin(dLat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));};
  const t=[T.lng,T.lat];
  const minDist=c=>{
    const seg=Array.isArray(c?.segment)?c.segment:[];let d=Infinity;
    for(const p of seg){if(Array.isArray(p)&&p.length>=2)d=Math.min(d,hav(t,[Number(p[0]),Number(p[1])])));}
    return d;
  };
  const summarise=(arr)=>{
    const ds=(arr||[]).map((c,i)=>({i,d:minDist(c),score:Number(c?.score??c?.rankScore??NaN),len:Array.isArray(c?.segment)?c.segment.length:0})).filter(x=>Number.isFinite(x.d)).sort((a,b)=>a.d-b.d);
    const counts={};for(const r of [5,10,20,40,80,120])counts[r]=ds.filter(x=>x.d<=r).length;
    return {total:(arr||[]).length,counts,nearest:ds.slice(0,20)};
  };
  const vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  const channel=vals.length?vals[Math.max(0,Math.min(vals.length-1,Math.floor((vals.length-1)*.972)))]:Infinity;
  const [w,s,e,n]=hy.bounds;
  const x=(T.lng-w)/(e-w)*Math.max(1,hy.w-1),y=(n-T.lat)/(n-s)*Math.max(1,hy.h-1);
  const cellStats=(nx,ny)=>{
    const bx=Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))));
    const by=Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))));
    let valid=0,opp=0,preferred=0,channelCells=0;
    const x0=Math.floor(bx*hy.w/nx),x1=Math.min(hy.w,Math.ceil((bx+1)*hy.w/nx));
    const y0=Math.floor(by*hy.h/ny),y1=Math.min(hy.h,Math.ceil((by+1)*hy.h/ny));
    for(let yy=y0;yy<y1;yy++)for(let xx=x0;xx<x1;xx++){
      const i=yy*hy.w+xx;if(hy.validityMask16584?.[i]!==1)continue;valid++;
      const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);if(!Number.isFinite(sp)||!Number.isFinite(ac))continue;
      if(ac>=channel){channelCells++;continue;}
      if(sp>=.05&&sp<=4){opp++;if(sp>=.25&&sp<=3.5)preferred++;}
    }
    return {nx,ny,bx,by,valid,opp,preferred,channelCells,oppRatio:valid?Number((opp/valid).toFixed(4)):null};
  };
  const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
  const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
  const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
  const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
  const gapAudit=window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null;
  const gapRefine=window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null;
  const lateGap=window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null;
  const fineGap=window.EARTHLINE_FINE_TERRAIN_GAP_RECOVERY_16780||window.EARTHLINE_FINE_TERRAIN_REFINEMENT_16780||null;
  const slim=o=>o?{passed:o.passed??null,unresolved:Array.isArray(o.unresolved)?o.unresolved.length:null,selected:Array.isArray(o.selected)?o.selected.length:null,added:o.added??null,elapsedMs:o.elapsedMs??null}:null;
  let style=null;
  try{style=map?.getStyle?.()||null;}catch(_){style=null;}
  return {
    target:T,bounds:hy.bounds,grid:{w:hy.w,h:hy.h,targetX:Number(x.toFixed(2)),targetY:Number(y.toFixed(2)),channel},
    cell6:cellStats(6,6),cell12:cellStats(12,12),cell24:cellStats(24,24),
    candidates:summarise(candidates),chosen:summarise(chosen),
    generated:pub?.generated??null,visible:display?.swaleLines??pub?.overlaySwaleLines??null,
    unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip?.swales??null,
    coreMs:perf?.totalMs??null,
    gapAudit:slim(gapAudit),gapRefine:slim(gapRefine),lateGap:slim(lateGap),fineGap:slim(fineGap),
    styleLayers:style?.layers?.map(l=>l.id).filter(id=>/swale|corridor/i.test(id))||[]
  };
},TARGET);

const result={loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};
writeFileSync(OUT+'/results.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_M47_16822 '+JSON.stringify(result));
try{await page.screenshot({path:OUT+'/arkansas.png',fullPage:false});}catch(_){}
await browser.close();
if(loadError||timedOut||pageErrors.length||!audit)process.exitCode=1;
