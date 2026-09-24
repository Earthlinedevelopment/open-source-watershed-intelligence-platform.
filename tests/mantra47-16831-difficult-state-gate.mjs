import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra47-16831-difficult-state-gate';
const STATES=['Iowa','Arkansas','Oklahoma','Nebraska','Vermont','Texas','Florida','Louisiana','California','New York','Maryland','Colorado'];
mkdirSync(OUT,{recursive:true});

function patchOpportunitySpread(body){
  const rebuild='      rebuild16783();';
  const push="          missing16783.push({row:row16783,nearest:nearest16783,count:candidateCountByCell16783.get(cell16783)||1});";
  const sort="        missing16783.sort((a16783,b16783)=>b16783.nearest-a16783.nearest||b16783.count-a16783.count||(Number(b16783.row.candidate.score)||0)-(Number(a16783.row.candidate.score)||0));";
  const donor="          const m16783=(Number(c16783.score)||0)-duplicates16783*.025;";
  const capture='window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;';
  for(const n of [rebuild,push,sort,donor,capture]) if(body.split(n).length-1!==1) throw new Error('16831 owner occurrence mismatch: '+n.slice(0,60));
  const helper=`      const opportunityCache16830=new Map();\n      const opportunity16830=p16830=>{if(!p16830)return 0;const k16830=p16830.cell;if(opportunityCache16830.has(k16830))return opportunityCache16830.get(k16830);const x0=Math.floor(p16830.fx*hy.w/nx16783),x1=Math.min(hy.w,Math.ceil((p16830.fx+1)*hy.w/nx16783)),y0=Math.floor(p16830.fy*hy.h/ny16783),y1=Math.min(hy.h,Math.ceil((p16830.fy+1)*hy.h/ny16783));let valid16830=0,opp16830=0,pref16830=0;for(let y16830=y0;y16830<y1;y16830++)for(let x16830=x0;x16830<x1;x16830++){const i16830=y16830*hy.w+x16830;if(hy.validityMask16584?.[i16830]!==1)continue;valid16830++;const sp16830=Number(hy.slope[i16830]);if(!Number.isFinite(sp16830))continue;if(sp16830>=.05&&sp16830<=4){opp16830++;if(sp16830>=.25&&sp16830<=3.5)pref16830++;}}const value16830=valid16830?(.35*(opp16830/valid16830)+.65*(pref16830/valid16830)):0;opportunityCache16830.set(k16830,value16830);return value16830;};\n`;
  body=body.replace(rebuild,rebuild+'\n'+helper);
  body=body.replace(push,"          missing16783.push({row:row16783,nearest:nearest16783,count:candidateCountByCell16783.get(cell16783)||1,opportunity16830:opportunity16830(row16783.point)});");
  body=body.replace(sort,"        missing16783.sort((a16783,b16783)=>b16783.opportunity16830-a16783.opportunity16830||b16783.nearest-a16783.nearest||b16783.count-a16783.count||(Number(b16783.row.candidate.score)||0)-(Number(a16783.row.candidate.score)||0));");
  body=body.replace(donor,"          const m16783=opportunity16830(p16783)*.35+(Number(c16783.score)||0)*.65-duplicates16783*.025;");
  body=body.replace(capture,"window.__EARTHLINE_M47_16831={hy,candidates,chosen};"+capture);
  return body;
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const state of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document') return route.continue();
    const resp=await route.fetch(); let body=await resp.text(); body=patchOpportunitySpread(body);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });
  const page=await context.newPage(); const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false; const started=Date.now();
  try{
    await page.goto(BASE+`?m47_16831=${encodeURIComponent(state)}_${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(S=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=S;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},state);
    try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.__EARTHLINE_M47_16831;},null,{timeout:65000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(700);
  }catch(e){loadError=String(e);}
  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const root=window.EARTHLINE_ROOT_AUDIT_16784||window.EARTHLINE_STANDARDIZED_ROOT_CAUSE_AUDIT_16784||null;
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16792||window.LAST_ATOMIC_STATE_PACKAGE_16792||window.LAST_ATOMIC_STATE_PACKAGE||null;
    const spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;
    const {candidates,chosen}=window.__EARTHLINE_M47_16831;
    return {candidates:candidates?.length??null,chosen:chosen?.length??null,generated:pub?.generated??null,visible:disp?.swaleLines??pub?.overlaySwaleLines??null,unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip?.swales??null,coreMs:perf?.totalMs??null,rootPass:root?.rootPass??root?.passed??null,statePackage:pkg?.state??pkg?.stateName??pkg?.name??null,spread:spread?{initialCells:spread.initialCells,finalCells:spread.finalCells,targetCells:spread.targetCells,swaps:spread.swaps,stop:spread.selectionStopReason}:null};
  });
  const gate=!!audit&&!loadError&&!timedOut&&pageErrors.length===0&&audit.generated===audit.visible&&audit.unsafe===0&&audit.outside===0&&Number(audit.coreMs)<=15000;
  const result={state,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit,gate}; results.push(result);
  console.log('EARTHLINE_M47_16831 '+JSON.stringify(result));
  try{if(state==='Arkansas'||state==='Texas')await page.screenshot({path:`${OUT}/${state.toLowerCase().replace(/ /g,'-')}.png`,fullPage:false});}catch(_){}
  await context.close();
}
writeFileSync(`${OUT}/results.json`,JSON.stringify(results,null,2));
writeFileSync(`${OUT}/summary.json`,JSON.stringify({passed:results.filter(r=>r.gate).length,failed:results.filter(r=>!r.gate).map(r=>r.state),maxCoreMs:Math.max(...results.map(r=>Number(r.audit?.coreMs)||0)),states:results.map(r=>({state:r.state,gate:r.gate,coreMs:r.audit?.coreMs,generated:r.audit?.generated,visible:r.audit?.visible,unsafe:r.audit?.unsafe,outside:r.audit?.outside,pageErrors:r.pageErrors.length}))},null,2));
await browser.close();
if(results.some(r=>!r.gate))process.exitCode=1;
