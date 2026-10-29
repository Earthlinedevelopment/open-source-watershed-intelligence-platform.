// M82 rerun after single Regional submission owner
import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const browser=await chromium.launch({headless:true});
const rows=[];
for(let round=1;round<=7;round++){
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await installCandidateOrigin(context);
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  let row={round,pass:false};
  try{
    const t0=Date.now();
    const resp=await page.goto('https://earthlinedevelopment.org/?m82='+round+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:20000});
    await page.waitForSelector('#runBtn',{timeout:20000});
    await page.waitForTimeout(500);
    const shell=await page.evaluate(()=>({ready:document.readyState,search:!!document.getElementById('searchInput'),run:!!document.getElementById('runBtn'),map:!!document.querySelector('.mapboxgl-map'),title:document.title}));
    await page.locator('#searchInput').fill('Arizona');
    await page.waitForTimeout(650);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
    if(await opt.count())await opt.click().catch(()=>{});
    await page.locator('#runBtn').click();
    await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:60000,polling:100});
    await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167;const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020;return !!e||(+p?.generated>0&&!!d)}, {timeout:30000,polling:100});
    const reg=await page.evaluate(()=>({err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,generated:Number(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated||0),visible:Number((window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020)?.swaleLines||0)}));
    row={round,status:resp?.status()||null,wallMs:Date.now()-t0,shell,reg,errors,pass:resp?.ok()===true&&shell.search&&shell.run&&shell.map&&!reg.err&&Number(reg.perf?.totalMs)>0&&Number(reg.perf?.totalMs)<=15000&&reg.generated>0&&reg.visible===reg.generated&&!errors.length};
  }catch(e){row={round,pass:false,error:String(e),errors}}
  rows.push(row); console.log('M82_COMBINED_SMOKE '+JSON.stringify(row));
  await context.close();
  if(!row.pass){await browser.close();throw new Error('combined smoke failed '+JSON.stringify(row));}
}
await browser.close();
console.log('M82_COMBINED_SMOKE_SUMMARY '+JSON.stringify({pass:rows.filter(r=>r.pass).length,total:rows.length}));