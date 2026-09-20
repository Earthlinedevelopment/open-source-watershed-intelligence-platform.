import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Vermont|New York|Massachusetts|Texas').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto(URL+'?validate16715='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||'')),started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  let timedOut=false;
  try{
    await page.waitForFunction(prev=>{
      const t=String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      return !!e||((!prev||t!==prev)&&!!t&&/screening published\./i.test(s));
    },prior,{timeout:50000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(400);
  const snap=await page.evaluate(()=>{
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    return {generated:pub?.generated??null,visible:disp?.swaleLines??null,totalMs:perf?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  });
  rows.push({state:stateName,elapsedMs:Date.now()-started,timedOut,snap});
}
await browser.close();
const failures=[];
for(const r of rows){
  if(r.timedOut)failures.push(r.state+': timeout');
  if(r.snap.lastError)failures.push(r.state+': '+JSON.stringify(r.snap.lastError));
  if(!(Number(r.snap.totalMs)<=15000))failures.push(r.state+': core '+r.snap.totalMs);
  if(Number(r.snap.unsafe||0)!==0)failures.push(r.state+': unsafe '+r.snap.unsafe);
  if(Number(r.snap.outside?.swales||0)!==0)failures.push(r.state+': outside '+r.snap.outside?.swales);
  if(Number(r.snap.visible)!==Number(r.snap.generated))failures.push(r.state+': visible/generated '+r.snap.visible+'/'+r.snap.generated);
}
const out={at:new Date().toISOString(),url:URL,rows,failures,pass:failures.length===0};
fs.writeFileSync(process.env.OUT||'lab/16715-validation.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
if(failures.length)process.exitCode=1;
