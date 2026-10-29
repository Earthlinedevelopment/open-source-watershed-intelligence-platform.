import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[];
for(let round=1;round<=7;round++){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  let row={round,pass:false};
  try{
    const t0=Date.now();
    const resp=await page.goto(URL+'?recovery='+round+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:20000});
    await page.waitForSelector('#runBtn',{timeout:20000});
    await page.waitForTimeout(500);
    const shell=await page.evaluate(()=>({
      title:document.title,
      search:!!document.getElementById('searchInput'),
      run:!!document.getElementById('runBtn'),
      map:!!document.querySelector('.mapboxgl-map'),
      bodyText:String(document.body?.innerText||'').slice(0,500),
      ready:document.readyState
    }));
    await page.locator('#searchInput').fill('Arizona');
    await page.waitForTimeout(650);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
    if(await opt.count())await opt.click().catch(()=>{});
    await page.locator('#runBtn').click();
    await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:45000,polling:100});
    const functional=await page.evaluate(()=>({
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      generated:Number(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated||0),
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||'')
    }));
    row={round,status:resp?.status()||null,wallMs:Date.now()-t0,shell,functional,errors,pass:(resp?.ok()===true)&&shell.search&&shell.run&&shell.map&&!functional.error&&Number(functional.perf?.totalMs)>0&&functional.generated>0&&errors.length===0};
  }catch(e){row={round,pass:false,error:String(e),errors}}
  rows.push(row); console.log('EARTHLINE_RECOVERY_SMOKE '+JSON.stringify(row));
  await page.close();
  if(!row.pass){await browser.close();throw new Error('recovery smoke failed '+JSON.stringify(row));}
}
await browser.close();
console.log('EARTHLINE_RECOVERY_SMOKE_SUMMARY '+JSON.stringify({pass:rows.filter(r=>r.pass).length,total:rows.length}));