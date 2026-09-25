import {chromium} from 'playwright';
import fs from 'fs';
fs.mkdirSync('out',{recursive:true});
const browser=await chromium.launch({headless:true});let final=null,lastError=null;
for(let attempt=1;attempt<=8;attempt++){
 const page=await browser.newPage({viewport:{width:1800,height:900}});
 try{
  await page.goto('https://earthlinedevelopment.org/?live16843='+Date.now()+'-'+attempt,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const raw=await page.content();const marker=raw.includes('EARTHLINE 16843 — FINE-SUPPORT REGIONAL CAPACITY');
  if(!marker){await page.close();await new Promise(r=>setTimeout(r,6000));continue;}
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  await page.waitForFunction(()=>{const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020;return window.EARTHLINE_SUPPORTED_CAPACITY_16843?.build==='EARTHLINE 16843'&&window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0&&Number(d?.swaleLines||0)>0;},null,{timeout:110000,polling:100});
  await page.waitForTimeout(500);
  final=await page.evaluate(()=>{const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{},perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{},land=window.EARTHLINE_LAND_VALIDITY_16584||{},cap=window.EARTHLINE_SUPPORTED_CAPACITY_16843||{},loc=window.EARTHLINE_STATEWIDE_SUPERTILE_16839||{};return {marker:true,build:cap.build||null,generated:+p.generated||0,visible:+d.swaleLines||0,unsafe:+flow.unsafeSegments||0,outside:+(p.outsideJurisdiction||p.outside||p.outsideCount||0),waterReady:Array.isArray(land.waterParts),coreMs:+perf.totalMs||NaN,base:+cap.base||0,fineSupportCells:+cap.fineSupportCells||0,extra:+cap.extra||0,capacity:+cap.capacity||0,localAdded:+loc.added||0,localFailed:+loc.failed||0};});
  final.attempt=attempt;await page.screenshot({path:'out/16843-live-arkansas.png',fullPage:false});await page.close();break;
 }catch(e){lastError=String(e?.message||e);await page.close();if(attempt<8)await new Promise(r=>setTimeout(r,6000));}
}
await browser.close();fs.writeFileSync('out/16843-live-verify.json',JSON.stringify({at:new Date().toISOString(),final,lastError},null,2));console.log(JSON.stringify({final,lastError}));
if(!final||final.build!=='EARTHLINE 16843'||final.generated<160||final.generated!==final.visible||final.unsafe!==0||final.outside!==0||!final.waterReady||!Number.isFinite(final.coreMs)||final.coreMs>15000||final.localFailed!==0)process.exit(2);
