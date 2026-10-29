import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';
const STATES=['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const browser=await chromium.launch({headless:true});
const rows=[];
for(const state of STATES){
  const context=await browser.newContext({viewport:{width:1600,height:900}});
  await installCandidateOrigin(context);
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  let row={state,pass:false};
  try{
    const t0=Date.now();
    await page.goto('https://earthlinedevelopment.org/?m81-allstate-visible='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.locator('#searchInput').fill(state);
    await page.waitForTimeout(650);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:state}).first();
    if(await opt.count())await opt.click().catch(()=>{});
    await page.locator('#runBtn').click();
    await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:60000,polling:100});
    await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020;return !!e||!!d},{timeout:20000,polling:100});
    await page.waitForTimeout(250);
    const out=await page.evaluate(()=>({
      err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
      flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
      boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null
    }));
    const generated=Number(out?.pub?.generated||0),visible=Number(out?.display?.swaleLines||0);
    row={state,wallMs:Date.now()-t0,coreMs:Number(out?.perf?.totalMs||0),generated,visible,labels:Number(out?.display?.swaleGradeLabels||0),corridorGeometryVisible:out?.display?.corridorGeometryVisible===true,unsafe:Number(out?.flow?.unsafeSegments||0),outside:Number(out?.boundary?.outsideAfterClip?.swales||0),errors,pass:!out?.err&&!errors.length&&Number(out?.perf?.totalMs)>0&&Number(out?.perf?.totalMs)<=15000&&generated>0&&visible===generated&&out?.display?.corridorGeometryVisible===true&&Number(out?.display?.swaleGradeLabels||0)>0&&Number(out?.flow?.unsafeSegments||0)===0&&Number(out?.boundary?.outsideAfterClip?.swales||0)===0};
  }catch(e){row={state,pass:false,error:String(e),errors}}
  rows.push(row);console.log('EARTHLINE_ALLSTATE_VISIBLE '+JSON.stringify(row));
  await context.close();
}
await browser.close();
const failed=rows.filter(r=>!r.pass);
console.log('EARTHLINE_ALLSTATE_VISIBLE_SUMMARY '+JSON.stringify({total:rows.length,pass:rows.length-failed.length,fail:failed.length,failed:failed.map(x=>x.state)}));
if(failed.length)process.exitCode=1;