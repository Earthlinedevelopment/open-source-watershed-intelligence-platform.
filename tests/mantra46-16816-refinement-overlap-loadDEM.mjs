import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Texas','Maryland'];
const OUT='artifacts/mantra46-16816-refinement-overlap-loadDEM';
mkdirSync(OUT,{recursive:true});

const html=await (await fetch(BASE+'?m46_16816_source='+Date.now())).text();
const loadIdx=Math.max(html.indexOf('async function loadDEM'),html.indexOf('async function loadDem'),html.indexOf('const loadDEM='),html.indexOf('function loadDEM'));
let loadSnippet=null;
if(loadIdx>=0)loadSnippet=html.slice(Math.max(0,loadIdx-1800),Math.min(html.length,loadIdx+12000));
writeFileSync(OUT+'/loadDEM-snippet.txt',loadSnippet||'LOADDEM_NOT_FOUND');

const browser=await chromium.launch({headless:true});
const rows=[];
for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;
  try{
    await page.goto(BASE+'?m46_16816='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{await page.waitForFunction(q=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;return /screening published\./i.test(s)&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());},query,{timeout:60000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(500);
  }catch(e){loadError=String(e);}
  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const fine=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null;
    const gap=window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const fineRows=(fine?.selected||[]).map(r=>({bx:Number(r.bx),by:Number(r.by),id:r.id||null,added:r.added??null,failed:r.failed??null}));
    const fineParents=[...new Set(fineRows.map(r=>Math.floor(r.bx/2)+','+Math.floor(r.by/2)))];
    const gapRows=(gap?.selected||[]).map(r=>({bx:Number(r.bx),by:Number(r.by),id:r.id||null,added:r.added??null,failed:r.failed??null}));
    const gapKeys=gapRows.map(r=>r.bx+','+r.by);
    const overlap=gapKeys.filter(k=>fineParents.includes(k));
    return {
      coreMs:perf?.totalMs??null,
      fineElapsed:fine?.elapsedMs??null,
      gapElapsed:gap?.elapsedMs??null,
      fineRows,fineParents,gapRows,gapKeys,overlap,
      overlapCount:overlap.length,
      gapCount:gapKeys.length,
      fineParentCount:fineParents.length,
      overlapRatio:gapKeys.length?overlap.length/gapKeys.length:null,
      fineAdded:fine?.added??null,
      gapAdded:gap?.added??null,
      gapConfirmedNull:(gap?.confirmedNull16735||[]).length
    };
  });
  const row={query,loadError,timedOut,pageErrors,audit};rows.push(row);console.log('EARTHLINE_M46_16816 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify({loadDEMFound:loadIdx>=0,rows},null,2));
console.log('EARTHLINE_M46_16816_SUMMARY '+JSON.stringify({loadDEMFound:loadIdx>=0,rows}));
