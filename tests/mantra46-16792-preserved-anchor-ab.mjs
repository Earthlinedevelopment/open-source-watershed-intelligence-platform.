import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const CASES=['Iowa','Arkansas'];
mkdirSync('artifacts/mantra46-16792-preserved-anchor',{recursive:true});
function once(body,name,needle,repl){const n=body.split(needle).length-1;if(n!==1)throw new Error(name+' expected once, found '+n);return body.replace(needle,repl);}
function patchBody(body){
 body=once(body,'fine candidate metadata',
   "confidence:'preferred',minLinePx16632:.75,refined16702:true,fineOpportunity16780:true,tile16702:tile16780.id,tile16780:tile16780.id};",
   "confidence:'preferred',minLinePx16632:.75,refined16702:true,fineOpportunity16780:true,fineTargetBx16792:tile16780.row.bx,fineTargetBy16792:tile16780.row.by,tile16702:tile16780.id,tile16780:tile16780.id};");
 const old=`      const mid16539=segment16539[Math.floor((segment16539.length-1)/2)],grid16539=llGrid(hy,mid16539);
      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}
      const screenedCandidate16592=Object.assign({},candidate16539,{
        segment:segment16539,
        x:Math.max(1,Math.min(hy.w-2,Math.round(grid16539.x))),
        y:Math.max(1,Math.min(hy.h-2,Math.round(grid16539.y))),
        jurisdiction_screened:true
      });`;
 const repl=`      const mid16539=segment16539[Math.floor((segment16539.length-1)/2)];let grid16539=llGrid(hy,mid16539),targetAnchor16792=null;
      if(candidate16539&&Number.isFinite(Number(candidate16539.fineTargetBx16792))&&Number.isFinite(Number(candidate16539.fineTargetBy16792))){
        const tbx16792=Number(candidate16539.fineTargetBx16792),tby16792=Number(candidate16539.fineTargetBy16792);
        const hit16792=p16792=>{const g16792=llGrid(hy,p16792);if(!g16792||!Number.isFinite(g16792.x)||!Number.isFinite(g16792.y))return false;const bx16792=Math.max(0,Math.min(11,Math.floor(Number(g16792.x)*12/Math.max(1,hy.w)))),by16792=Math.max(0,Math.min(11,Math.floor(Number(g16792.y)*12/Math.max(1,hy.h))));if(bx16792===tbx16792&&by16792===tby16792){targetAnchor16792=g16792;return true;}return false;};
        for(let i16792=0;i16792<segment16539.length&&!targetAnchor16792;i16792++){
          const a16792=segment16539[i16792];hit16792(a16792);if(targetAnchor16792||i16792===0)continue;
          const b16792=segment16539[i16792-1];if(!Array.isArray(a16792)||!Array.isArray(b16792))continue;
          for(const t16792 of [.25,.5,.75])if(hit16792([Number(b16792[0])+(Number(a16792[0])-Number(b16792[0]))*t16792,Number(b16792[1])+(Number(a16792[1])-Number(b16792[1]))*t16792]))break;
        }
        if(targetAnchor16792)grid16539=targetAnchor16792;
      }
      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}
      const screenedCandidate16592=Object.assign({},candidate16539,{
        segment:segment16539,
        x:Math.max(1,Math.min(hy.w-2,Math.round(grid16539.x))),
        y:Math.max(1,Math.min(hy.h-2,Math.round(grid16539.y))),
        fineTargetAnchorPreserved16792:!!targetAnchor16792,
        jurisdiction_screened:true
      });`;
 return once(body,'jurisdiction anchor preservation',old,repl);
}
const browser=await chromium.launch({headless:true});const results=[];
for(const query of CASES){
 const context=await browser.newContext({viewport:{width:1920,height:1080}});const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));let loadError=null,timedOut=false;const started=Date.now();
 await page.route('**/*',async route=>{const req=route.request();if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){const response=await route.fetch();let body=await response.text();body=patchBody(body);await route.fulfill({response,body});return;}await route.continue();});
 try{await page.goto(BASE+'?m46_16792_preserve='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);try{await page.waitForFunction(q=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''))&&String(window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784?.query||'').toLowerCase().includes(q.toLowerCase()),query,{timeout:45000,polling:100});}catch(_){timedOut=true;}await page.waitForTimeout(1000);}catch(e){loadError=String(e);}
 const a=loadError?{}:await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,coverage:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
 try{await page.screenshot({path:'artifacts/mantra46-16792-preserved-anchor/'+query.toLowerCase()+'.png',fullPage:false});}catch(_){}
 const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs:a?.perf?.totalMs??null,generated:a?.pub?.generated??null,visible:a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null,unsafe:a?.flow?.unsafeSegments??null,rootPass:a?.root?.pass??null,candidateCells:a?.spread?.candidateCells??null,finalCells:a?.spread?.finalCells??null,targetCells:a?.spread?.targetCells??null,added:a?.fine?.added??null,unresolvedAfter:a?.fine?.unresolvedAfter?.length??null,coverageReserved:a?.coverage?.reserved??null,outsideAfterClip:a?.boundary?.outsideAfterClip??null,lastError:a?.lastError||null};
 results.push(row);console.log('EARTHLINE_M46_16792_PRESERVE '+JSON.stringify(row));await context.close();
}
await browser.close();writeFileSync('artifacts/mantra46-16792-preserved-anchor/results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.coreMs)>15000||Number(r.unsafe)!==0||Number(r.generated)!==Number(r.visible)||Number(r.outsideAfterClip?.swales||0)!==0))process.exitCode=1;
