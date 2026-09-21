import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Louisiana','Maryland','Mississippi','New Hampshire','New Jersey','New Mexico','North Carolina','South Carolina','Tennessee'];
mkdirSync('artifacts/mantra46-16791-audit-semantics',{recursive:true});

function patchBody(body){
  const rep=(name,oldv,newv)=>{const n=body.split(oldv).length-1;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(oldv,newv);};
  rep('coverage-decl','const bestByCell16783=new Map(),candidateCountByCell16783=new Map();','const bestByCell16783=new Map(),candidateCountByCell16783=new Map(),candidateCoverageCellKeys16791=new Set();');
  rep('coverage-loop','      for(const c16783 of candidates){\n        const p16783=point16783(c16783);if(!p16783)continue;','      for(const c16783 of candidates){\n        const seg16791=Array.isArray(c16783&&c16783.segment)?c16783.segment:null;\n        if(seg16791&&seg16791.length){for(const pt16791 of seg16791){const g16791=llGrid(hy,pt16791);if(!g16791||!Number.isFinite(Number(g16791.x))||!Number.isFinite(Number(g16791.y)))continue;const cx16791=Math.max(0,Math.min(11,Math.floor(Number(g16791.x)*12/Math.max(1,hy.w))));const cy16791=Math.max(0,Math.min(11,Math.floor(Number(g16791.y)*12/Math.max(1,hy.h))));candidateCoverageCellKeys16791.add(cx16791+\',\'+cy16791);}}\n        const p16783=point16783(c16783);if(!p16783)continue;');
  rep('attainable-init','      let swaps16783=0;','      let swaps16783=0,attainableTargetCells16791=targetCells16783,selectionStopReason16791=\'target-reached\';');
  rep('no-donor','        if(donor16783<0)break;','        if(donor16783<0){\n          const blockerRows16791=[];\n          for(const dc16791 of chosen){const dp16791=point16783(dc16791);if(!dp16791)continue;const dd16791=cellCount16783.get(dp16791.cell)||0,pn16791=parentCount16783.get(dp16791.parent)||0;if(dd16791>1)blockerRows16791.push({parentCount:pn16791,sameParent:dp16791.parent===add16783.point.parent});}\n          const parentFloorBlocked16791=blockerRows16791.length>0&&blockerRows16791.every(r16791=>r16791.parentCount<=3&&!r16791.sameParent);\n          if(parentFloorBlocked16791){attainableTargetCells16791=cellCount16783.size;selectionStopReason16791=\'parent-floor-protected\';}else selectionStopReason16791=\'no-eligible-donor\';\n          break;\n        }');
  rep('spread-object','initialCells:initialCells16783,finalCells:cellCount16783.size,targetCells:targetCells16783,candidateCellKeys:Array.from(bestByCell16783.keys()).sort(),finalCellKeys:Array.from(cellCount16783.keys()).sort(),swaps:swaps16783,','initialCells:initialCells16783,finalCells:cellCount16783.size,targetCells:targetCells16783,attainableTargetCells:attainableTargetCells16791,selectionStopReason:selectionStopReason16791,candidateCellKeys:Array.from(bestByCell16783.keys()).sort(),candidateCoverageCellKeys:Array.from(candidateCoverageCellKeys16791).sort(),finalCellKeys:Array.from(cellCount16783.keys()).sort(),swaps:swaps16783,');
  rep('root-sets','const candidateKeys=new Set(spread&&Array.isArray(spread.candidateCellKeys)?spread.candidateCellKeys:[]);\n    const selectedKeys=new Set(spread&&Array.isArray(spread.finalCellKeys)?spread.finalCellKeys:[]);','const candidateKeys=new Set(spread&&Array.isArray(spread.candidateCellKeys)?spread.candidateCellKeys:[]);\n    const candidateCoverageKeys=new Set(spread&&Array.isArray(spread.candidateCoverageCellKeys)?spread.candidateCoverageCellKeys:Array.from(candidateKeys));\n    const selectedKeys=new Set(spread&&Array.isArray(spread.finalCellKeys)?spread.finalCellKeys:[]);');
  rep('root-candidate-diff','const opportunityNoCandidate=diff(opportunityKeys,candidateKeys);','const opportunityNoCandidate=diff(opportunityKeys,candidateCoverageKeys);');
  rep('root-target','const target=Number(spread.targetCells||Math.min(Number(spread.chosenCount||0),Number(spread.candidateCells||0)));','const target=Number(spread.attainableTargetCells??spread.targetCells??Math.min(Number(spread.chosenCount||0),Number(spread.candidateCells||0)));');
  return body;
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
      const response=await route.fetch();let body=await response.text();body=patchBody(body);
      await route.fulfill({response,body});return;
    }
    await route.continue();
  });
  try{
    await page.goto(BASE+'?earthline_m46_16791_audit='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{
      await page.waitForFunction(q=>{
        const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(e)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:45000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(300);
  }catch(e){loadError=String(e);}
  const a=loadError?{}:await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
  }));
  try{await page.screenshot({path:'artifacts/mantra46-16791-audit-semantics/'+query.toLowerCase().replace(/\s+/g,'-')+'.png',fullPage:false});}catch(_){}
  const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs:a?.perf?.totalMs??null,
    generated:a?.pub?.generated??null,visible:a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null,unsafe:a?.flow?.unsafeSegments??null,
    rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,lineage:a?.root?.cellLineage??null,
    candidateCells:a?.spread?.candidateCells??null,candidateCoverageCells:a?.spread?.candidateCoverageCellKeys?.length??null,finalCells:a?.spread?.finalCells??null,targetCells:a?.spread?.targetCells??null,attainableTargetCells:a?.spread?.attainableTargetCells??null,selectionStopReason:a?.spread?.selectionStopReason??null,swaps:a?.spread?.swaps??null,
    outsideAfterClip:a?.boundary?.outsideAfterClip??null,lastError:a?.lastError||null};
  results.push(row);console.log('EARTHLINE_M46_16791_AUDIT_SEMANTICS '+JSON.stringify(row));await context.close();
}
await browser.close();
writeFileSync('artifacts/mantra46-16791-audit-semantics/results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.coreMs)>15000||Number(r.unsafe)!==0||Number(r.generated)!==Number(r.visible)||Number(r.outsideAfterClip?.swales||0)!==0))process.exitCode=1;
