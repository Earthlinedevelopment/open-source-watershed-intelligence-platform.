import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto(URL+'?validate16717='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
  window.EARTHLINE_REGIONAL_SCORE_ORDER_16717=null;
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
});
let timedOut=false;
try{
  await page.waitForFunction(()=>{
    const t=String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''),
          s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),
          e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    return !!e||(!!t&&/screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_SCORE_ORDER_16717);
  },{timeout:50000,polling:100});
}catch(_){timedOut=true;}
await page.waitForTimeout(500);
const snap=await page.evaluate(()=>{
  const order=window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||null;
  const cov=window.EARTHLINE_REFINED_COVERAGE_SELECTION_16713||null;
  const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  const sw=Array.isArray(vis?.swales?.features)?vis.swales.features:[];
  const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
  const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
  const land=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
  const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
  const rows=sw.map(f=>({rank:Number(f?.properties?.rank),grade:String(f?.properties?.grade||''),score:Number(f?.properties?.score)}));
  const monotonicPublished=rows.every((r,i)=>i===0||rows[i-1].score>=r.score);
  const a=rows.filter(r=>r.grade==='A'),b=rows.filter(r=>r.grade==='B'),c=rows.filter(r=>r.grade==='C');
  const gradeOrdered=(!a.length||!b.length||Math.min(...a.map(x=>x.score))>=Math.max(...b.map(x=>x.score))) &&
                     (!b.length||!c.length||Math.min(...b.map(x=>x.score))>=Math.max(...c.map(x=>x.score)));
  const aCount=Math.max(3,Math.ceil(rows.length*.16));
  return {
    order,cov,rows:rows.slice(0,25),aCount,
    topARefined:Number(order?.top20?.slice(0,aCount).filter(x=>x.refined).length||0),
    monotonicPublished,gradeOrdered,
    generated:pub?.generated??null,visible:disp?.swaleLines??null,
    totalMs:perf?.totalMs??null,unsafe:land?.unsafeSegments??null,
    outside:boundary?.outsideAfterClip??null,
    error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
  };
});
await browser.close();

const failures=[];
if(timedOut)failures.push('Texas: timeout');
if(snap.error)failures.push('Texas: '+JSON.stringify(snap.error));
if(!snap.order?.monotonic)failures.push('Texas: selection order not score-monotonic');
if(!snap.monotonicPublished)failures.push('Texas: published ranks not score-monotonic');
if(!snap.gradeOrdered)failures.push('Texas: A/B/C grades violate descending score order');
if(Number(snap.cov?.reserved||0)!==Number(snap.cov?.input||0)||Number(snap.cov?.reserved||0)<18)failures.push('Texas: coastal coverage reservation regressed '+snap.cov?.reserved+'/'+snap.cov?.input);
if(Number(snap.generated)!==Number(snap.visible))failures.push('Texas: visible/generated '+snap.visible+'/'+snap.generated);
if(Number(snap.unsafe||0)!==0)failures.push('Texas: unsafe '+snap.unsafe);
if(Number(snap.outside?.swales||0)!==0)failures.push('Texas: outside '+snap.outside?.swales);
if(!(Number(snap.totalMs)<=15000))failures.push('Texas: core '+snap.totalMs);

const out={at:new Date().toISOString(),url:URL,timedOut,snap,failures,pass:failures.length===0};
fs.writeFileSync(process.env.OUT||'lab/16717-validation.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
if(failures.length)process.exitCode=1;
