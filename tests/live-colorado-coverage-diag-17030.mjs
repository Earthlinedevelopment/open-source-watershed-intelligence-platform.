import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto('https://earthlinedevelopment.org/?covdiag='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(2000);

const result=await page.evaluate(async()=>{
  const t={lng:-105.55114,lat:39.02639,source:'coverage-diagnostic',code:'CROSSHAIR',score:0,query:'Colorado',parentRunToken:'diag-regional',at:new Date().toISOString()};
  window.EARTHLINE_PROPERTY_TARGET_16201=t;
  try{window.earthlineSetPropertyTarget16201?.(t);}catch(_){}
  window.EARTHLINE_DISPLAYED_RUN_16151={tier:'regional',mode:'regional',runToken:'diag-regional'};
  window.EARTHLINE_DISPLAYED_RUN_16147=window.EARTHLINE_DISPLAYED_RUN_16151;
  window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167={runToken:'diag-regional',generated:10};
  document.documentElement.dataset.earthlineRunState='published';
  try{if(window.earthlineMap?.jumpTo)window.earthlineMap.jumpTo({center:[t.lng,t.lat],zoom:16.5,bearing:0,pitch:0});}catch(_){}
  try{return await Promise.resolve(window.earthlineDeclarePropertyAtCrosshair16173())}
  catch(e){return {error:String(e?.stack||e)}}
});
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:70000,polling:100}).catch(()=>{});
await page.waitForTimeout(2000);

const out=await page.evaluate(()=>{
  const keys=Object.keys(window).filter(k=>/SWALE|COVERAGE|CANDIDATE|REFINED|PROPERTY.*AUDIT|PUBLICATION/i.test(k)).sort();
  const audits={};
  for(const k of keys){
    try{
      const v=window[k];
      if(v&&typeof v==='object')audits[k]=v;
    }catch(_){}
  }
  const raw=Array.isArray(M?.swales)?M.swales:[];
  const safeFC=M?.authoritativeSafeSwales15815;
  const safe=Array.isArray(safeFC?.features)?safeFC.features:[];
  const toMid=row=>{
    const coords=row?.geometry?.coordinates||row?.segment||row?.pts||[];
    if(!Array.isArray(coords)||!coords.length)return null;
    const p=coords[Math.floor((coords.length-1)/2)];
    if(!Array.isArray(p)||p.length<2)return null;
    return [Number(p[0]),Number(p[1])];
  };
  const rows=safe.length?safe:raw;
  const mids=rows.map(toMid).filter(Boolean);
  const canvas=window.earthlineMap?.getCanvas?.();
  const bins6={};
  for(const p of mids){
    try{
      const q=window.earthlineMap?.project?.({lng:p[0],lat:p[1]});
      if(!q||!canvas||!canvas.clientWidth||!canvas.clientHeight)continue;
      const bx=Math.max(0,Math.min(5,Math.floor(q.x*6/canvas.clientWidth)));
      const by=Math.max(0,Math.min(5,Math.floor(q.y*6/canvas.clientHeight)));
      const k=bx+','+by;bins6[k]=(bins6[k]||0)+1;
    }catch(_){}
  }
  return {
    result,
    tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
    runState:String(document.documentElement.dataset.earthlineRunState||''),
    rawCount:raw.length,
    safeCount:safe.length,
    bins6,
    occupiedBins6:Object.keys(bins6).length,
    audits,
    vectorNoBuildCoverage:M?.vectorNoBuildCoverage||null,
    publication:M?.propertyPublication15816||null,
    handoff:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null
  };
});
console.log('LIVE_COLORADO_COVERAGE_DIAG '+JSON.stringify(out));
await browser.close();