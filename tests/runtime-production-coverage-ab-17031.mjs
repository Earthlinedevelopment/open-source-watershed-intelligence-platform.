import { chromium } from 'playwright';

async function runOne(browser,label,patch){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  await page.goto('https://earthlinedevelopment.org/?runtimecov='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(2500);

  const patchInfo=await page.evaluate((doPatch)=>{
    const f=window.makeSwales;
    if(typeof f!=='function') return {available:false,type:typeof f};
    const src=String(f);
    const marker='/* EARTHLINE 16783 — final published 12x12 candidate-cell spread.';
    const i=src.indexOf(marker);
    const old='if(!focusMode&&chosen.length&&candidates.length){';
    const j=i>=0?src.indexOf(old,i):-1;
    if(!doPatch)return {available:true,marker:i,guard:j,patched:false};
    if(i<0||j<0)return {available:true,marker:i,guard:j,patched:false,error:'target guard not found'};
    const next=src.slice(0,j)+'if(chosen.length&&candidates.length){'+src.slice(j+old.length);
    try{
      window.eval('makeSwales = '+next);
      return {available:true,marker:i,guard:j,patched:String(window.makeSwales).includes('if(chosen.length&&candidates.length){')};
    }catch(e){return {available:true,error:String(e?.stack||e),patched:false}}
  },patch);

  const invoke=await page.evaluate(async()=>{
    const t={lng:-105.55114,lat:39.02639,source:'crosshair',code:'',score:0,query:'Colorado',parentRunToken:'',at:new Date().toISOString()};
    window.EARTHLINE_PROPERTY_TARGET_16201=t;
    try{window.earthlineSetPropertyTarget16201?.(t);}catch(_){}
    try{window.earthlineMap?.jumpTo?.({center:[t.lng,t.lat],zoom:16.5,bearing:0,pitch:0});}catch(_){}
    try{return {value:await Promise.resolve(window.earthlineDeclarePropertyAtCrosshair16173())}}
    catch(e){return {error:String(e?.stack||e)}}
  });

  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:90000,polling:100}).catch(()=>{});
  await page.waitForTimeout(1800);

  const out=await page.evaluate(()=>{
    const raw=Array.isArray(window.M?.swales)?window.M.swales:[];
    const safeFC=window.M?.authoritativeSafeSwales15815;
    const safe=Array.isArray(safeFC?.features)?safeFC.features:[];
    const spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;
    const run=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const pub=window.M?.propertyPublication15816||window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const ev=window.earthlineGetExclusionEvidence16516?.()||null;
    return {
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      state:String(document.documentElement.dataset.earthlineRunState||''),
      rawCount:raw.length,
      safeCount:safe.length,
      spread,
      run,
      pub,
      evidence:ev
    };
  });
  await page.close();
  return {label,patchInfo,invoke,...out};
}

const browser=await chromium.launch({headless:true});
const baseline=await runOne(browser,'baseline',false);
const candidate=await runOne(browser,'runtime-candidate',true);
console.log('RUNTIME_PROPERTY_COVERAGE_AB '+JSON.stringify({baseline,candidate}));

if(candidate.patchInfo?.patched!==true)throw new Error('runtime candidate injection failed');
if(candidate.invoke?.error)throw new Error('candidate run error '+candidate.invoke.error);
if(candidate.run?.result!==true)throw new Error('candidate Property run did not complete successfully: '+JSON.stringify(candidate.run));
if(candidate.rawCount>52||candidate.safeCount>52)throw new Error('candidate exceeds accepted Property cap');
if(!candidate.spread)throw new Error('candidate spread audit missing');
if(candidate.spread.finalCells<candidate.spread.initialCells)throw new Error('candidate reduced cell coverage');
if(candidate.spread.candidateCells>candidate.spread.initialCells && candidate.spread.finalCells<=candidate.spread.initialCells)
  throw new Error('candidate had candidate-supported empty cells but did not improve coverage');
if(baseline.rawCount>0 && candidate.rawCount>baseline.rawCount)throw new Error('candidate increased corridor count');
await browser.close();