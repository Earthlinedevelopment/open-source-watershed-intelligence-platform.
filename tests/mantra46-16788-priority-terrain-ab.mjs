import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Iowa','Arkansas'];
const VARIANTS=[
  {name:'priority-8x16',budget:'Math.min(16,Math.max(8,Math.ceil(gapsBefore16780.length/3)))'},
  {name:'priority-10x18',budget:'Math.min(18,Math.max(10,Math.ceil(gapsBefore16780.length/2.5)))'}
];
mkdirSync('artifacts/mantra46-16788-ab',{recursive:true});

function once(body,name,needle,repl){
  const n=body.split(needle).length-1;
  if(n!==1)throw new Error(name+' expected once, found '+n);
  return body.replace(needle,repl);
}
function patchBody(body,v){
  body=once(body,'budget',
    'const refinementTileBudget16782=Math.min(24,Math.max(12,Math.ceil(gapsBefore16780.length/2)));',
    'const refinementTileBudget16782='+v.budget+';');

  const oldClass="      const selected16780=[],parentUse16780=new Map();\n      for(const row16780 of gapsBefore16780){\n        row16780.cluster16781=gapsBefore16780.filter(o16781=>Math.hypot(o16781.bx-row16780.bx,o16781.by-row16780.by)<=1.5).length;\n      }";
  const newClass="      const selected16780=[],parentUse16780=new Map(),coarseContourCells16788=new Set();\n      for(const f16788 of (swaleCandidateContours16609&&swaleCandidateContours16609.features||[])){\n        const coords16788=f16788&&f16788.geometry&&f16788.geometry.type==='LineString'?f16788.geometry.coordinates:null;\n        if(!Array.isArray(coords16788))continue;\n        for(const p16788 of coords16788){\n          const g16788=llGrid(hy,p16788);if(!g16788||!Number.isFinite(Number(g16788.x))||!Number.isFinite(Number(g16788.y)))continue;\n          const bx16788=Math.max(0,Math.min(11,Math.floor(Number(g16788.x)*12/Math.max(1,hy.w))));\n          const by16788=Math.max(0,Math.min(11,Math.floor(Number(g16788.y)*12/Math.max(1,hy.h))));\n          coarseContourCells16788.add(bx16788+','+by16788);\n        }\n      }\n      for(const row16780 of gapsBefore16780){\n        row16780.cluster16781=gapsBefore16780.filter(o16781=>Math.hypot(o16781.bx-row16780.bx,o16781.by-row16780.by)<=1.5).length;\n        row16780.coarseContourHit16788=coarseContourCells16788.has(row16780.bx+','+row16780.by)?1:0;\n      }";
  body=once(body,'classification',oldClass,newClass);

  body=once(body,'metric',
    'const metric16781=(Number(row16780.cluster16781)||0)*100+spread16781*24+ratio16781*20+pref16781*5+row16780.opportunity/16;',
    'const metric16781=(row16780.coarseContourHit16788?0:10000)+pref16781*1200+ratio16781*180+row16780.preferred*6+spread16781*24+(Number(row16780.cluster16781)||0)*12+row16780.opportunity/16;');

  body=once(body,'selected-audit',
    'selected:selected16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred,cluster:Number(r16780.cluster16781||0)}))',
    'selected:selected16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred,cluster:Number(r16780.cluster16781||0),coarseContourHit16788:Number(r16780.coarseContourHit16788||0)}))');
  return body;
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const v of VARIANTS){
  for(const query of CASES){
    const context=await browser.newContext({viewport:{width:1800,height:950}});
    const page=await context.newPage();
    const pageErrors=[];
    page.on('pageerror',e=>pageErrors.push(String(e)));
    let loadError=null,timedOut=false;
    const started=Date.now();

    await page.route('**/*',async route=>{
      const req=route.request();
      if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
        const response=await route.fetch();
        let body=await response.text();
        body=patchBody(body,v);
        await route.fulfill({response,body});
        return;
      }
      await route.continue();
    });

    try{
      await page.goto(BASE+'?earthline_m46_16788='+v.name+'_'+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForSelector('#searchInput',{timeout:30000});
      await page.evaluate(q=>{
        const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
        i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
      },query);
      try{
        await page.waitForFunction(q=>{
          const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
          if(e)return true;
          const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
          const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
          return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
        },query,{timeout:45000,polling:100});
      }catch(_){timedOut=true;}
      await page.waitForTimeout(500);
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
    try{await page.screenshot({path:'artifacts/mantra46-16788-ab/'+slug+'.png',fullPage:false});}catch(_){}

    const row={
      variant:v.name,query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,
      coreMs:a?.perf?.totalMs??null,slowestPhase:a?.perf?.slowestPhase??null,phases:a?.perf?.phaseTotalsMs??null,
      generated:a?.pub?.generated??null,visible:a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null,unsafe:a?.flow?.unsafeSegments??null,
      rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,lineage:a?.root?.cellLineage??null,
      selectedRefinement:a?.fine?.selected??null,refinementCount:a?.fine?.selected?.length??null,refinementAdded:a?.fine?.added??null,
      refinementElapsedMs:a?.fine?.elapsedMs??null,unresolvedAfter:a?.fine?.unresolvedAfter?.length??null,
      candidateCells:a?.spread?.candidateCells??null,selectedCells:a?.spread?.finalCells??null,targetCells:a?.spread?.targetCells??null,
      outsideAfterClip:a?.boundary?.outsideAfterClip??null,lastError:a?.lastError||null
    };
    results.push(row);
    console.log('EARTHLINE_M46_16788_AB '+JSON.stringify(row));
    await context.close();
  }
}
await browser.close();
writeFileSync('artifacts/mantra46-16788-ab/results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.unsafe)!==0||Number(r.generated)!==Number(r.visible)||Number(r.outsideAfterClip?.swales||0)!==0))process.exitCode=1;
