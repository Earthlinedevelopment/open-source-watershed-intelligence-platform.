import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Iowa','Arkansas'];
const VARIANTS=[
  {name:'dense20',budget:'Math.min(20,Math.max(12,Math.ceil(gapsBefore16780.length*.65)))',res:24},
  {name:'dense24',budget:'Math.min(24,Math.max(14,Math.ceil(gapsBefore16780.length*.75)))',res:24}
];
mkdirSync('artifacts/mantra46-16792-ia-ar-dense',{recursive:true});

function once(body,name,needle,repl){
  const n=body.split(needle).length-1;
  if(n!==1)throw new Error(name+' expected once, found '+n);
  return body.replace(needle,repl);
}
function patchBody(body,v){
  body=once(body,'budget',
    'const refinementTileBudget16782=Math.min(16,Math.max(8,Math.ceil(gapsBefore16780.length/3)));',
    'const refinementTileBudget16782='+v.budget+';');
  body=once(body,'resolution',
    "const d16780=await loadDEM(tile16780.b,32,32,5500,'fine opportunity refinement '+tile16780.id);",
    "const d16780=await loadDEM(tile16780.b,"+v.res+","+v.res+",5500,'fine opportunity refinement '+tile16780.id);");
  return body;
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const v of VARIANTS){
  for(const query of CASES){
    const context=await browser.newContext({viewport:{width:1920,height:1080}});
    const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
    let loadError=null,timedOut=false;const started=Date.now();
    await page.route('**/*',async route=>{
      const req=route.request();
      if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
        const response=await route.fetch();let body=await response.text();body=patchBody(body,v);
        await route.fulfill({response,body});return;
      }
      await route.continue();
    });
    try{
      await page.goto(BASE+'?m46_16792='+v.name+'_'+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForSelector('#searchInput',{timeout:30000});
      await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
      try{
        await page.waitForFunction(q=>{
          const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(e)return true;
          const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
          return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&String(window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784?.query||'').toLowerCase().includes(q.toLowerCase());
        },query,{timeout:45000,polling:100});
      }catch(_){timedOut=true;}
      await page.waitForTimeout(1000);
    }catch(e){loadError=String(e);}
    const a=loadError?{}:await page.evaluate(()=>({
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
      flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
      boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
      root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
      spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
      fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    }));
    const slug=v.name+'-'+query.toLowerCase();
    try{await page.screenshot({path:'artifacts/mantra46-16792-ia-ar-dense/'+slug+'.png',fullPage:false});}catch(_){}
    const row={variant:v.name,query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,
      coreMs:a?.perf?.totalMs??null,generated:a?.pub?.generated??null,visible:a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null,
      unsafe:a?.flow?.unsafeSegments??null,rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,
      candidateCells:a?.spread?.candidateCells??null,finalCells:a?.spread?.finalCells??null,targetCells:a?.spread?.targetCells??null,
      tileBudget:a?.fine?.tileBudget??null,selectedCount:a?.fine?.selected?.length??null,added:a?.fine?.added??null,
      unresolvedAfter:a?.fine?.unresolvedAfter?.length??null,unresolved:a?.fine?.unresolvedAfter??null,
      refineMs:a?.fine?.elapsedMs??null,outsideAfterClip:a?.boundary?.outsideAfterClip??null,lastError:a?.lastError||null};
    results.push(row);console.log('EARTHLINE_M46_16792_DENSE '+JSON.stringify(row));
    await context.close();
  }
}
await browser.close();
writeFileSync('artifacts/mantra46-16792-ia-ar-dense/results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.coreMs)>15000||Number(r.unsafe)!==0||Number(r.generated)!==Number(r.visible)||Number(r.outsideAfterClip?.swales||0)!==0))process.exitCode=1;
