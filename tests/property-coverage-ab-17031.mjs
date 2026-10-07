import { chromium } from 'playwright';

async function run(page,path,label){
  await page.goto('http://127.0.0.1:8787/'+path+'?covab='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(2200);
  const pre=await page.evaluate(()=>({
    declare:typeof window.earthlineDeclarePropertyAtCrosshair16173,
    setTarget:typeof window.earthlineSetPropertyTarget16201,
    map:!!window.earthlineMap
  }));
  if(pre.declare!=='function') throw new Error(label+' missing Property owner');
  const invoke=await page.evaluate(async()=>{
    const t={lng:-105.55114,lat:39.02639,source:'crosshair',code:'',score:0,query:'Colorado',parentRunToken:'',at:new Date().toISOString()};
    window.EARTHLINE_PROPERTY_TARGET_16201=t;
    try{window.earthlineSetPropertyTarget16201?.(t);}catch(_){}
    try{window.earthlineMap?.jumpTo?.({center:[t.lng,t.lat],zoom:16.5,bearing:0,pitch:0});}catch(_){}
    try{
      const value=await Promise.resolve(window.earthlineDeclarePropertyAtCrosshair16173());
      return {value};
    }catch(e){return {error:String(e?.stack||e)}}
  });
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:70000,polling:100}).catch(()=>{});
  await page.waitForTimeout(1600);
  const out=await page.evaluate(()=>{
    const raw=Array.isArray(window.M?.swales)?window.M.swales:[];
    const safeFC=window.M?.authoritativeSafeSwales15815;
    const safe=Array.isArray(safeFC?.features)?safeFC.features:[];
    const spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;
    const run=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const pub=window.M?.propertyPublication15816||window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    return {
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      state:String(document.documentElement.dataset.earthlineRunState||''),
      rawCount:raw.length,
      safeCount:safe.length,
      spread,
      run,
      pub
    };
  });
  return {label,invoke,...out};
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:1000}});
const p1=await context.newPage();
const baseline=await run(p1,'baseline-9a830.html','baseline');
await p1.close();
const p2=await context.newPage();
const candidate=await run(p2,'index.html','candidate');
await p2.close();

console.log('PROPERTY_COVERAGE_AB '+JSON.stringify({baseline,candidate}));

if(candidate.invoke?.error) throw new Error('candidate Property run error: '+candidate.invoke.error);
if(candidate.rawCount>52 || candidate.safeCount>52) throw new Error('candidate exceeds accepted Property cap');
if(!candidate.spread) throw new Error('candidate missing final spread audit');
if(candidate.spread.finalCells < candidate.spread.initialCells) throw new Error('candidate reduced represented cells');
if(candidate.spread.swaps<=0 && candidate.spread.finalCells===candidate.spread.initialCells) {
  console.log('NOTE no redistribution needed/possible at this run');
}
if(baseline.spread && candidate.spread.finalCells < baseline.spread.finalCells) throw new Error('candidate covers fewer candidate cells than baseline');
if(candidate.spread.candidateCells>candidate.spread.initialCells && candidate.spread.finalCells===candidate.spread.initialCells) {
  throw new Error('candidate found missing candidate-supported cells but did not redistribute');
}
await browser.close();