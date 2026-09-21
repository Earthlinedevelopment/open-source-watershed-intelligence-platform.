import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Louisiana','Maryland','Mississippi','New Hampshire','New Jersey','New Mexico','North Carolina','South Carolina','Tennessee'];
mkdirSync('artifacts/mantra46-16790-audit-coverage',{recursive:true});

function patchBody(body){
  const rep=(name,oldv,newv)=>{const n=body.split(oldv).length-1;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(oldv,newv);};
  rep('coverage-decl',
    'const bestByCell16783=new Map(),candidateCountByCell16783=new Map();',
    'const bestByCell16783=new Map(),candidateCountByCell16783=new Map(),candidateCoverageCellKeys16790=new Set();');
  rep('coverage-loop',
    '      for(const c16783 of candidates){\n        const p16783=point16783(c16783);if(!p16783)continue;',
    '      for(const c16783 of candidates){\n        const seg16790=Array.isArray(c16783&&c16783.segment)?c16783.segment:null;\n        if(seg16790&&seg16790.length){for(const pt16790 of seg16790){const g16790=llGrid(hy,pt16790);if(!g16790||!Number.isFinite(Number(g16790.x))||!Number.isFinite(Number(g16790.y)))continue;const cx16790=Math.max(0,Math.min(11,Math.floor(Number(g16790.x)*12/Math.max(1,hy.w))));const cy16790=Math.max(0,Math.min(11,Math.floor(Number(g16790.y)*12/Math.max(1,hy.h))));candidateCoverageCellKeys16790.add(cx16790+\',\'+cy16790);}}\n        const p16783=point16783(c16783);if(!p16783)continue;');
  rep('coverage-object',
    'initialCells:initialCells16783,finalCells:cellCount16783.size,targetCells:targetCells16783,candidateCellKeys:Array.from(bestByCell16783.keys()).sort(),finalCellKeys:Array.from(cellCount16783.keys()).sort(),swaps:swaps16783,',
    'initialCells:initialCells16783,finalCells:cellCount16783.size,targetCells:targetCells16783,candidateCellKeys:Array.from(bestByCell16783.keys()).sort(),candidateCoverageCellKeys:Array.from(candidateCoverageCellKeys16790).sort(),finalCellKeys:Array.from(cellCount16783.keys()).sort(),swaps:swaps16783,');
  rep('root-sets',
    'const candidateKeys=new Set(spread&&Array.isArray(spread.candidateCellKeys)?spread.candidateCellKeys:[]);\n    const selectedKeys=new Set(spread&&Array.isArray(spread.finalCellKeys)?spread.finalCellKeys:[]);',
    'const candidateKeys=new Set(spread&&Array.isArray(spread.candidateCellKeys)?spread.candidateCellKeys:[]);\n    const candidateCoverageKeys=new Set(spread&&Array.isArray(spread.candidateCoverageCellKeys)?spread.candidateCoverageCellKeys:Array.from(candidateKeys));\n    const selectedKeys=new Set(spread&&Array.isArray(spread.finalCellKeys)?spread.finalCellKeys:[]);');
  rep('root-diff','const opportunityNoCandidate=diff(opportunityKeys,candidateKeys);','const opportunityNoCandidate=diff(opportunityKeys,candidateCoverageKeys);');
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
    await page.goto(BASE+'?earthline_m46_16790_audit='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
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
  try{await page.screenshot({path:'artifacts/mantra46-16790-audit-coverage/'+query.toLowerCase().replace(/\s+/g,'-')+'.png',fullPage:false});}catch(_){}
  const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs:a?.perf?.totalMs??null,
    generated:a?.pub?.generated??null,visible:a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null,unsafe:a?.flow?.unsafeSegments??null,
    rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,lineage:a?.root?.cellLineage??null,
    candidateCells:a?.spread?.candidateCells??null,candidateCoverageCells:a?.spread?.candidateCoverageCellKeys?.length??null,finalCells:a?.spread?.finalCells??null,targetCells:a?.spread?.targetCells??null,swaps:a?.spread?.swaps??null,
    outsideAfterClip:a?.boundary?.outsideAfterClip??null,lastError:a?.lastError||null};
  results.push(row);console.log('EARTHLINE_M46_16790_AUDIT_COVERAGE '+JSON.stringify(row));await context.close();
}
await browser.close();
writeFileSync('artifacts/mantra46-16790-audit-coverage/results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.coreMs)>15000||Number(r.unsafe)!==0||Number(r.generated)!==Number(r.visible)||Number(r.outsideAfterClip?.swales||0)!==0))process.exitCode=1;
