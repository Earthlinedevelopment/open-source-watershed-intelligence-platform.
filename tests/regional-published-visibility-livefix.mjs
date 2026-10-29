// rerun latest Regional visibility candidate 2026-10-29
import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const STATES=['Vermont','Arizona','Colorado','California','Arkansas','Texas','Nevada','New York','Iowa','Florida'];
const ROUNDS=7;
const browser=await chromium.launch({headless:true});
const rows=[];
for(let round=1;round<=ROUNDS;round++){
  for(const state of STATES){
    const context=await browser.newContext({viewport:{width:1600,height:900}});
    await installCandidateOrigin(context);
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    const t0=Date.now();
    let fatal=null,out=null;
    try{
      await page.goto('https://earthlinedevelopment.org/?regionalVisibleM81='+round+'-'+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForSelector('#searchInput',{timeout:30000});
      await page.locator('#searchInput').fill(state);
      await page.waitForTimeout(650);
      const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:state}).first();
      if(await opt.count())await opt.click().catch(()=>{});
      await page.locator('#runBtn').click();
      await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:90000,polling:100});
      await page.waitForFunction(()=>{
        const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
        const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020;
        return !!e||!!d;
      },{timeout:20000,polling:100});
      await page.waitForTimeout(250);
      out=await page.evaluate(()=>({
        err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
        perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
        pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
        display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
        flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
        boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
        status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
      }));
    }catch(e){fatal=String(e)}
    const generated=Number(out?.pub?.generated||0),visible=Number(out?.display?.swaleLines||0);
    const pass=!fatal&&!out?.err&&!errors.length&&Number(out?.perf?.totalMs)>0&&Number(out?.perf?.totalMs)<=15000&&generated>0&&visible===generated&&out?.display?.corridorGeometryVisible===true&&Number(out?.display?.swaleGradeLabels||0)>0&&Number(out?.flow?.unsafeSegments||0)===0&&Number(out?.boundary?.outsideAfterClip?.swales||0)===0;
    const row={round,state,pass,fatal,errors,wallMs:Date.now()-t0,coreMs:out?.perf?.totalMs??null,generated,visible,corridorGeometryVisible:out?.display?.corridorGeometryVisible??null,labels:out?.display?.swaleGradeLabels??null,unsafe:out?.flow?.unsafeSegments??null,outside:out?.boundary?.outsideAfterClip?.swales??null,status:out?.status||''};
    rows.push(row);console.log('EARTHLINE_M81_REGIONAL_VISIBLE '+JSON.stringify(row));
    await context.close();
    if(!pass){await browser.close();throw new Error('Regional visibility repair failed '+JSON.stringify(row));}
  }
}
await browser.close();
console.log('EARTHLINE_M81_REGIONAL_VISIBLE_SUMMARY '+JSON.stringify({rounds:ROUNDS,states:STATES.length,total:rows.length,pass:rows.filter(r=>r.pass).length}));
