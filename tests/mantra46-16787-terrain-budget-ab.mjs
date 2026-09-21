import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Iowa','Arkansas'];
const VARIANTS=[
  {id:'v32x24',budget:"Math.min(24,Math.max(12,Math.ceil(gapsBefore16780.length/2)))",grid:32},
  {id:'v36x20',budget:"Math.min(20,Math.max(10,Math.ceil(gapsBefore16780.length/2.5)))",grid:36}
];
mkdirSync('artifacts/mantra46-16787-terrain-ab',{recursive:true});

function replaceOnce(body,name,needle,repl){
  const n=body.split(needle).length-1;
  if(n!==1)throw new Error(name+' expected once, found '+n);
  return body.replace(needle,repl);
}
function patchBody(body,v){
  body=replaceOnce(body,'budget',
    'const refinementTileBudget16782=Math.min(16,Math.max(8,Math.ceil(gapsBefore16780.length/4)));',
    'const refinementTileBudget16782='+v.budget+';');
  body=replaceOnce(body,'local-grid',
    "const d16780=await loadDEM(tile16780.b,48,48,5500,'fine opportunity refinement '+tile16780.id);",
    "const d16780=await loadDEM(tile16780.b,"+v.grid+","+v.grid+",5500,'fine opportunity refinement '+tile16780.id);");
  return body;
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const v of VARIANTS){
  for(const query of CASES){
    const context=await browser.newContext({viewport:{width:1800,height:950}});
    const page=await context.newPage(); const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
    let loadError=null,timedOut=false; const started=Date.now();
    await page.route('**/*',async route=>{
      const req=route.request();
      if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
        const response=await route.fetch(); let body=await response.text(); body=patchBody(body,v);
        await route.fulfill({response,body}); return;
      }
      await route.continue();
    });
    try{
      await page.goto(BASE+'?earthline_m46_16787='+v.id+'_'+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForSelector('#searchInput',{timeout:30000});
      await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
      try{
        await page.waitForFunction(q=>{
          const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
          const r=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
          return /screening published\./i.test(s)&&r&&String(r.query||'').toLowerCase().includes(q.toLowerCase());
        },query,{timeout:45000,polling:100});
      }catch(_){timedOut=true;}
      await page.waitForTimeout(500);
    }catch(e){loadError=String(e);}
    const a=loadError?{}:await page.evaluate(()=>({
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
      fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
      publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
      flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
      anchor:window.EARTHLINE_SPATIAL_ANCHOR_AUDIT_16786||null
    }));
    const slug=(v.id+'-'+query).toLowerCase().replace(/\s+/g,'-');
    try{await page.screenshot({path:'artifacts/mantra46-16787-terrain-ab/'+slug+'.png',fullPage:false});}catch(_){}
    const row={variant:v.id,grid:v.grid,query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,
      coreMs:a?.perf?.totalMs??null,generated:a?.publication?.generated??null,
      visible:a?.display?.swaleLines??a?.publication?.overlaySwaleLines??null,unsafe:a?.flow?.unsafeSegments??null,
      rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,
      lineage:a?.root?.cellLineage??null,refinementSelected:a?.fine?.selected?.length??null,
      refinementAdded:a?.fine?.added??null,refinementElapsedMs:a?.fine?.elapsedMs??null,
      unresolvedAfter:a?.fine?.unresolvedAfter?.length??null,
      anchorSupplemental:a?.anchor?.supplementalCandidates??null
    };
    results.push(row); console.log('EARTHLINE_M46_16787_TERRAIN_AB '+JSON.stringify(row));
    await context.close();
  }
}
await browser.close();
writeFileSync('artifacts/mantra46-16787-terrain-ab/results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.pageErrors.length||Number(r.unsafe)!==0||Number(r.generated)!==Number(r.visible)))process.exitCode=1;
