import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const variants=[
  {label:'112_spacing1',lower:112},
  {label:'112x96_spacing1',lower:96}
];
const browser=await chromium.launch({headless:true});
const rows=[];
for(const variant of variants){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  let resPatch=0,spacingPatch=0;
  await page.route('**/*',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();let body=await resp.text();
    if(variant.lower!==112){
      const a=`const d16702=await loadDEM(tile16702.b,112,112,6000,'scale refinement '+tile16702.id)`;
      const ar=`const localRes16708=tile16702.id==='coast-1'?112:${variant.lower},d16702=await loadDEM(tile16702.b,localRes16708,localRes16708,6000,'scale refinement '+tile16702.id)`;
      resPatch=body.split(a).length-1;if(resPatch!==1)throw new Error('resolution anchor '+resPatch);body=body.replace(a,ar);
    }else resPatch=1;
    const b=`      const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));
      if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<spacing))continue;`;
    const br=`      const spacing=(c&&c.refined16702)?1:(chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72)));
      if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<spacing))continue;`;
    spacingPatch=body.split(b).length-1;if(spacingPatch!==1)throw new Error('spacing anchor '+spacingPatch);body=body.replace(b,br);
    return route.fulfill({response:resp,body});
  });
  await page.goto(URL+'?tx_refined_spacing='+variant.label+'&t='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  for(let repeat=1;repeat<=3;repeat++){
    const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
    await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
    let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:45000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(400);
    const snap=await page.evaluate(()=>{
      const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[],mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;},count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
      const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
      return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,input:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,selection:window.EARTHLINE_REFINED_SELECTION_16702||null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandle:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midGulf:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerGulf:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
    });
    const row={variant:variant.label,repeat,elapsedMs:Date.now()-started,timedOut,resPatch,spacingPatch,snap};rows.push(row);console.log('EARTHLINE_TX_REFINED_SPACING '+JSON.stringify(row));
  }
  await page.close();
}
console.log('EARTHLINE_TX_REFINED_SPACING_SUMMARY '+JSON.stringify(rows));
await browser.close();
if(rows.some(r=>r.timedOut||r.resPatch!==1||r.spacingPatch!==1||r.snap.lastError||Number(r.snap.unsafe||0)!==0||Number(r.snap.outside?.swales||0)!==0||Number(r.snap.visible)!==Number(r.snap.published)||!(Number(r.snap.totalMs)<=15000)))process.exitCode=1;
