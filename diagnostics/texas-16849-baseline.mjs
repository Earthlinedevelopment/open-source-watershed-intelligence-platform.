import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const repeats=Number(process.env.REPEATS||5);
const browser=await chromium.launch({headless:true});
const rows=[];
for(let run=1;run<=repeats;run++){
  const page=await browser.newPage({viewport:{width:1800,height:900}});
  const pageErrors=[]; const consoleErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  const wallStart=Date.now(); let harnessError=null;
  try{
    await page.goto(URL+`?m47-16849-tx-base=${run}-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value='Texas';
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      b.click();
    });
    await page.waitForFunction(()=>{
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
      const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{};
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      return String(pkg?.identity?.name||'').toLowerCase()==='texas' && (err || (Number(pub?.generated||0)>0 && Number.isFinite(Number(perf?.totalMs))));
    },{timeout:110000,polling:100});
    await page.waitForTimeout(500);
  }catch(e){harnessError=String(e?.stack||e)}
  const snap=await page.evaluate(()=>{
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{};
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{};
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{};
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||{};
    const supertile=window.EARTHLINE_STATEWIDE_SUPERTILE_16839||{};
    const fine=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||{};
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
    const selectedKeys=Object.keys(window).filter(k=>/16702|16730|16780|16781|16839/.test(k)&&/^EARTHLINE_/.test(k)).sort();
    const audits={};
    for(const k of selectedKeys){try{const v=window[k];if(v&&typeof v==='object')audits[k]=JSON.parse(JSON.stringify(v));}catch{}}
    return {
      state:String(pkg?.identity?.name||''),
      totalMs:Number(perf?.totalMs??NaN),
      generated:Number(pub?.generated||0),visible:Number(disp?.swaleLines||0),
      unsafe:Number(flow?.unsafeSegments??NaN),
      outside:Number(pub?.outsideJurisdiction??pub?.outside??pub?.outsideCount??0),
      boundaryOutside:boundary?.outsideAfterClip||null,
      supertile:{gaps:supertile?.gaps??null,groups:supertile?.groups??null,added:supertile?.added??null,failed:supertile?.failed??null,elapsedMs:supertile?.elapsedMs??null,groupRows:supertile?.groupRows??null},
      fine:{selected:Array.isArray(fine?.selected)?fine.selected.length:null,added:fine?.added??null,elapsedMs:fine?.elapsedMs??null,failedTiles:fine?.failedTiles??null,unresolvedAfter:Array.isArray(fine?.unresolvedAfter)?fine.unresolvedAfter.length:null},
      audits
    };
  }).catch(e=>({snapshotError:String(e)}));
  rows.push({run,wallMs:Date.now()-wallStart,harnessError,pageErrors,consoleErrors,snap});
  console.log(JSON.stringify(rows.at(-1)));
  await page.close();
}
await browser.close();
const summary={at:new Date().toISOString(),url:URL,repeats,rows};
fs.writeFileSync('diagnostics/16849-texas-baseline.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify({runs:rows.map(r=>({run:r.run,totalMs:r.snap?.totalMs,wallMs:r.wallMs,supertileMs:r.snap?.supertile?.elapsedMs,fineMs:r.snap?.fine?.elapsedMs,generated:r.snap?.generated,visible:r.snap?.visible,unsafe:r.snap?.unsafe,error:r.harnessError||r.pageErrors[0]||null}))}));
if(rows.some(r=>r.harnessError||r.pageErrors.length||!(r.snap?.generated>0)))process.exitCode=1;
