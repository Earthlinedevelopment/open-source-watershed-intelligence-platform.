import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Iowa','Arkansas'];
mkdirSync('artifacts/mantra46-16786-contour-gap-ab',{recursive:true});

function replaceOnce(body,name,needle,repl){
  const n=body.split(needle).length-1;
  if(n!==1)throw new Error(name+' expected once, found '+n);
  return body.replace(needle,repl);
}
function patchBody(body){
  body=replaceOnce(body,'contour-gap-classification',
`      const selected16780=[],parentUse16780=new Map();
      for(const row16780 of gapsBefore16780){
        row16780.cluster16781=gapsBefore16780.filter(o16781=>Math.hypot(o16781.bx-row16780.bx,o16781.by-row16780.by)<=1.5).length;
      }`,
`      const selected16780=[],parentUse16780=new Map(),coarseContourCells16786=new Set();
      for(const f16786 of (swaleCandidateContours16609&&swaleCandidateContours16609.features||[])){
        const coords16786=f16786&&f16786.geometry&&f16786.geometry.type==='LineString'?f16786.geometry.coordinates:null;
        if(!Array.isArray(coords16786))continue;
        for(const p16786 of coords16786){
          const g16786=llGrid(hy,p16786);if(!g16786||!Number.isFinite(Number(g16786.x))||!Number.isFinite(Number(g16786.y)))continue;
          const bx16786=Math.max(0,Math.min(11,Math.floor(Number(g16786.x)*12/Math.max(1,hy.w))));
          const by16786=Math.max(0,Math.min(11,Math.floor(Number(g16786.y)*12/Math.max(1,hy.h))));
          coarseContourCells16786.add(bx16786+','+by16786);
        }
      }
      for(const row16780 of gapsBefore16780){
        row16780.cluster16781=gapsBefore16780.filter(o16781=>Math.hypot(o16781.bx-row16780.bx,o16781.by-row16780.by)<=1.5).length;
        row16780.coarseContourHit16786=coarseContourCells16786.has(row16780.bx+','+row16780.by)?1:0;
      }`);

  body=replaceOnce(body,'contour-gap-metric',
`          const metric16781=(Number(row16780.cluster16781)||0)*100+spread16781*24+ratio16781*20+pref16781*5+row16780.opportunity/16;`,
`          const metric16781=(row16780.coarseContourHit16786?0:10000)+(Number(row16780.cluster16781)||0)*100+spread16781*24+ratio16781*20+pref16781*5+row16780.opportunity/16;`);

  body=replaceOnce(body,'selected-audit',
`selected:selected16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred,cluster:Number(r16780.cluster16781||0)}))`,
`selected:selected16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred,cluster:Number(r16780.cluster16781||0),coarseContourHit16786:Number(r16780.coarseContourHit16786||0)}))`);
  return body;
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage(); const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false; const started=Date.now();
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
      const response=await route.fetch(); let body=await response.text(); body=patchBody(body);
      await route.fulfill({response,body}); return;
    }
    await route.continue();
  });
  try{
    await page.goto(BASE+'?earthline_m46_contour_gap='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
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
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null
  }));
  const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs:a?.perf?.totalMs??null,
    generated:a?.publication?.generated??null,visible:a?.display?.swaleLines??a?.publication?.overlaySwaleLines??null,unsafe:a?.flow?.unsafeSegments??null,
    rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,lineage:a?.root?.cellLineage??null,
    selectedRefinement:a?.fine?.selected??null,unresolvedAfter:a?.fine?.unresolvedAfter??null,refinementAdded:a?.fine?.added??null
  };
  results.push(row); console.log('EARTHLINE_M46_CONTOUR_GAP_AB '+JSON.stringify(row)); await context.close();
}
await browser.close();
writeFileSync('artifacts/mantra46-16786-contour-gap-ab/results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.pageErrors.length||Number(r.unsafe)!==0||Number(r.generated)!==Number(r.visible)||Number(r.coreMs)>15000))process.exitCode=1;
