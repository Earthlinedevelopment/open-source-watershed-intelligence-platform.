import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
mkdirSync('artifacts/mantra46-16791-nm-selection',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:950}});
const page=await context.newPage();
let loadError=null,timedOut=false; const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));

function patchBody(body){
  const needle='      window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783={';
  const repl='      window.EARTHLINE_FINAL_SPREAD_DIAG_16791={\\n'+
    '        chosenRows:chosen.map((c,i)=>({i,score:Number(c&&c.score||0),point:point16783(c)})),\\n'+
    '        candidateRows:Array.from(bestByCell16783.entries()).map(([cell,row])=>({cell,point:row.point,score:Number(row&&row.candidate&&row.candidate.score||0)})),\\n'+
    '        cellCounts:Object.fromEntries(cellCount16783),parentCounts:Object.fromEntries(parentCount16783),\\n'+
    '        targetCells:targetCells16783,finalCells:cellCount16783.size,at:new Date().toISOString()\\n'+
    '      };\\n      window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783={';
  const n=body.split(needle).length-1; if(n!==1)throw new Error('spread object expected once, found '+n);
  return body.replace(needle,repl);
}

await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
    const response=await route.fetch(); let body=await response.text(); body=patchBody(body);
    await route.fulfill({response,body}); return;
  }
  await route.continue();
});

try{
  await page.goto(BASE+'?earthline_m46_16791_nm='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New Mexico';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  try{
    await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''); return /screening published\\./i.test(s)&&!!window.EARTHLINE_FINAL_SPREAD_DIAG_16791&&!!window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784;},null,{timeout:45000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(300);
}catch(e){loadError=String(e);}

const data=loadError?{}:await page.evaluate(()=>{
  const d=window.EARTHLINE_FINAL_SPREAD_DIAG_16791||{},root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||{},spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||{};
  const selected=new Set(spread.finalCellKeys||[]);
  const missing=(spread.candidateCellKeys||[]).filter(k=>!selected.has(k));
  const parentOf=cell=>{const [x,y]=String(cell).split(',').map(Number);return Math.floor(x/2)+','+Math.floor(y/2);};
  const duplicates={}; for(const r of d.chosenRows||[])if(r.point)duplicates[r.point.cell]=(duplicates[r.point.cell]||0)+1;
  const missingRows=missing.map(cell=>({cell,parent:parentOf(cell),best:(d.candidateRows||[]).find(r=>r.cell===cell)||null,parentCount:d.parentCounts&&d.parentCounts[parentOf(cell)]||0}));
  const donorRows=(d.chosenRows||[]).filter(r=>r.point&&Number(duplicates[r.point.cell]||0)>1).map(r=>({cell:r.point.cell,parent:r.point.parent,score:r.score,duplicates:duplicates[r.point.cell],parentCount:d.parentCounts&&d.parentCounts[r.point.parent]||0}));
  return {root,spread,diag:d,missingRows,donorRows};
});
console.log('EARTHLINE_M46_16791_NM '+JSON.stringify({loadError,timedOut,pageErrors,missingRows:data.missingRows,donorRows:data.donorRows,spread:data.spread,rootPass:data.root?.pass,firstFailedStage:data.root?.firstFailedStage}));
writeFileSync('artifacts/mantra46-16791-nm-selection/result.json',JSON.stringify({loadError,timedOut,pageErrors,...data},null,2));
await browser.close();