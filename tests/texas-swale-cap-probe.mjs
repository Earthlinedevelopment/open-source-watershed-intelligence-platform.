import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL='https://earthlinedevelopment.org/?earthline_tx_cap_probe='+Date.now();
const variants=[52,64,80,96];
const browser=await chromium.launch({headless:true});
const results=[];

function coverageFrom(features,boundary){
  const pts=[];
  const walk=v=>{if(Array.isArray(v)&&v.length>=2&&Number.isFinite(+v[0])&&Number.isFinite(+v[1])){pts.push([+v[0],+v[1]]);return;}if(Array.isArray(v))v.forEach(walk);};
  walk(boundary?.coordinates||[]);
  if(!pts.length)return null;
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const cells=new Set(),halves={west:0,east:0,north:0,south:0};
  for(const f of features||[]){
    const c=f?.geometry?.coordinates||[]; if(!c.length)continue;
    let sx=0,sy=0,n=0; for(const p of c){if(Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1])){sx+=+p[0];sy+=+p[1];n++;}}
    if(!n)continue; const x=sx/n,y=sy/n;
    const gx=Math.max(0,Math.min(3,Math.floor((x-minX)/Math.max(1e-9,maxX-minX)*4)));
    const gy=Math.max(0,Math.min(3,Math.floor((y-minY)/Math.max(1e-9,maxY-minY)*4)));
    cells.add(gx+','+gy); if(x<(minX+maxX)/2)halves.west++;else halves.east++; if(y<(minY+maxY)/2)halves.south++;else halves.north++;
  }
  return {grid4x4Occupied:cells.size,halves,bbox:[minX,minY,maxX,maxY]};
}

for(const cap of variants){
  const page=await browser.newPage({viewport:{width:1800,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  let patched=false,matchCount=0;
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.resourceType()==='document'&&req.url().startsWith('https://earthlinedevelopment.org/')){
      const response=await route.fetch(); let body=await response.text();
      const needle='if(chosen.length>=52)break;'; matchCount=body.split(needle).length-1;
      if(cap!==52&&matchCount===1){body=body.replace(needle,`if(chosen.length>=${cap})break;`);patched=true;}
      await route.fulfill({response,body}); return;
    }
    await route.continue();
  });
  const started=Date.now();
  await page.goto(URL+'&cap='+cap,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const prev=await page.evaluate(()=>window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584?.runToken||null);
  const clickStarted=Date.now();
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const f=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return (e&&e.runToken&&e.runToken!==prev)||(f?.runToken&&f.runToken!==prev&&/screening published\./i.test(s));},prev,{timeout:30000,polling:50});}catch(_){timedOut=true;}
  const clickToPublishedMs=Date.now()-clickStarted;
  const data=await page.evaluate(()=>({
    generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,
    performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    flowAudit:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    visual:window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,
    pkg:window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')
  }));
  const finalFeatures=data.visual?.swales?.features||[];
  const boundaryGeom=data.pkg?.boundary?.geometry||null;
  const r={cap,patched,matchCount,timedOut,clickToPublishedMs,totalElapsedMs:Date.now()-started,candidates:data.generation?.candidates??null,chosenBeforeTierGate:data.generation?.chosenBeforeTierGate??null,beforeClip:data.boundary?.before?.swales??null,afterClip:data.boundary?.after?.swales??null,removedByBoundary:data.boundary?.removed?.swales??null,published:data.publication?.generated??null,visible:data.display?.swaleLines??null,coreMs:data.performance?.totalMs??null,unsafeSegments:data.flowAudit?.unsafeSegments??null,grid:data.flowAudit?.gridAudit?.grid??null,coverage:coverageFrom(finalFeatures,boundaryGeom),lastError:data.lastError,status:data.status,errors};
  results.push(r);console.log('EARTHLINE_TX_CAP_PROBE '+JSON.stringify(r));
  await page.close();
}
await browser.close();
writeFileSync('texas-swale-cap-probe.json',JSON.stringify(results,null,2));
const baseline=results.find(r=>r.cap===52),valid=results.filter(r=>!r.timedOut&&!r.lastError&&!r.errors.length&&Number(r.unsafeSegments)===0&&Number(r.clickToPublishedMs)<=15000);
if(!baseline||valid.length<2)process.exitCode=1;
