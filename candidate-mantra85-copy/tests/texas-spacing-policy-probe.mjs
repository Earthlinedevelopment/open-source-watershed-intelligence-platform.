import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const variants=[
  {name:'baseline-6-4',primary:6,secondary:4},
  {name:'4-3',primary:4,secondary:3},
  {name:'3-3',primary:3,secondary:3},
  {name:'3-2',primary:3,secondary:2}
];

function coverageFrom(features,boundary){
  const pts=[];
  const walk=v=>{if(Array.isArray(v)&&v.length>=2&&Number.isFinite(+v[0])&&Number.isFinite(+v[1])){pts.push([+v[0],+v[1]]);return;}if(Array.isArray(v))v.forEach(walk);};
  walk(boundary?.coordinates||[]);
  if(!pts.length)return null;
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const cells=new Set(),halves={west:0,east:0,north:0,south:0};
  for(const f of features||[]){
    const c=f?.geometry?.coordinates||[];if(!c.length)continue;
    let sx=0,sy=0,n=0;for(const p of c){if(Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1])){sx+=+p[0];sy+=+p[1];n++;}}
    if(!n)continue;const x=sx/n,y=sy/n;
    const gx=Math.max(0,Math.min(3,Math.floor((x-minX)/Math.max(1e-9,maxX-minX)*4)));
    const gy=Math.max(0,Math.min(3,Math.floor((y-minY)/Math.max(1e-9,maxY-minY)*4)));
    cells.add(gx+','+gy);if(x<(minX+maxX)/2)halves.west++;else halves.east++;if(y<(minY+maxY)/2)halves.south++;else halves.north++;
  }
  return {grid4x4Occupied:cells.size,halves};
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const v of variants){
  const page=await browser.newPage({viewport:{width:1800,height:950}});
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let patch={primaryMatches:0,secondaryMatches:0};
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
      const response=await route.fetch();let body=await response.text();
      const pNeedle='const chosen=[],primarySpacing=Math.max(6,Math.round(hy.w/31));';
      const sNeedle='const spacing=chosen.length<20?primarySpacing:Math.max(4,Math.round(primarySpacing*.72));';
      patch.primaryMatches=body.split(pNeedle).length-1;patch.secondaryMatches=body.split(sNeedle).length-1;
      if(v.primary!==6&&patch.primaryMatches===1)body=body.replace(pNeedle,`const chosen=[],primarySpacing=Math.max(${v.primary},Math.round(hy.w/31));`);
      if(v.secondary!==4&&patch.secondaryMatches===1)body=body.replace(sNeedle,`const spacing=chosen.length<20?primarySpacing:Math.max(${v.secondary},Math.round(primarySpacing*.72));`);
      await route.fulfill({response,body});return;
    }
    await route.continue();
  });
  const url=BASE+'?earthline_tx_spacing_policy='+encodeURIComponent(v.name)+'_'+Date.now();
  let loadError=null,timedOut=false;
  try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});}catch(e){loadError=String(e);}
  const started=Date.now();
  if(!loadError){
    const prev=await page.evaluate(()=>window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584?.runToken||null);
    await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
    try{await page.waitForFunction(prev=>{const f=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return (e&&e.runToken&&e.runToken!==prev)||(f?.runToken&&f.runToken!==prev&&/screening published\./i.test(s));},prev,{timeout:30000,polling:50});}catch(_){timedOut=true;}
  }
  const data=loadError?{}:await page.evaluate(()=>({
    generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,
    performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    flowAudit:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    visual:window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,
    pkg:window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
  }));
  const features=data.visual?.swales?.features||[];
  const r={variant:v.name,primary:v.primary,secondary:v.secondary,patch,loadError,timedOut,clickToTerminalMs:Date.now()-started,candidates:data.generation?.candidates??null,eligible:data.generation?.jurisdictionEligibleCandidates??null,chosen:data.generation?.chosenBeforeTierGate??null,beforeClip:data.boundary?.before?.swales??null,afterClip:data.boundary?.after?.swales??null,removedByBoundary:data.boundary?.removed?.swales??null,published:data.publication?.generated??null,visible:data.display?.swaleLines??null,coreMs:data.performance?.totalMs??null,unsafe:data.flowAudit?.unsafeSegments??null,grid:data.flowAudit?.gridAudit?.grid??null,coverage:coverageFrom(features,data.pkg?.boundary?.geometry||null),lastError:data.lastError||null,pageErrors,status:data.status||''};
  results.push(r);console.log('EARTHLINE_TX_SPACING_POLICY '+JSON.stringify(r));
  await page.close();
}
await browser.close();
writeFileSync('texas-spacing-policy-probe.json',JSON.stringify(results,null,2));
const valid=results.filter(r=>!r.loadError&&!r.timedOut&&!r.lastError&&!r.pageErrors.length&&Number(r.unsafe)===0&&Number(r.removedByBoundary)===0&&Number(r.clickToTerminalMs)<=15000);
if(valid.length<2)process.exitCode=1;
