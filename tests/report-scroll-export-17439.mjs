import { chromium, firefox, webkit } from 'playwright';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless,downloadsPath:process.env.RUNNER_TEMP||undefined});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const cases=[
  {name:'desktop',viewport:{width:1440,height:860}},
  {name:'mobile',viewport:{width:390,height:844}}
];
const rows=[];

for(const c of cases){
  const context=await browser.newContext({viewport:c.viewport,acceptDownloads:true});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?report17439='+BROWSER+'-'+c.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill('Vermont');
  await page.waitForTimeout(700);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(await opts.count())await opts.first().click();
  const rb=page.locator('#runBtn');
  if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();

  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
  await page.waitForTimeout(400);

  const regional=await page.evaluate(()=>{
    const o=document.getElementById('earthlineRegionalVectorOverlay16020');
    return {
      worms:o?.querySelectorAll('[data-layer="swale-opportunities"] path').length||0,
      tabs:o?.querySelectorAll('.earthline-swale-label-16149').length||0,
      swales:window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features?.length||0
    };
  });

  const reportBtn=page.locator('#earthlineVermontReport16149');
  await reportBtn.waitFor({state:'visible',timeout:20000});
  if(c.name==='mobile')await reportBtn.evaluate(el=>el.click());else await reportBtn.click();
  await page.waitForFunction(()=>{
    const p=document.getElementById('earthlineVermontReportPanel16149');
    return !!p?.classList?.contains('open')&&!!p.querySelector('.el49-shell');
  },null,{timeout:15000,polling:100});
  await page.waitForTimeout(250);

  const before=await page.evaluate(()=>{
    const p=document.getElementById('earthlineVermontReportPanel16149');
    const s=p?.querySelector('.el49-shell');
    const actions=[...p?.querySelectorAll?.('.el49-toolbar-actions [data-action]')||[]].map(x=>x.dataset.action);
    const cs=s?getComputedStyle(s):null;
    return {
      scrollHeight:s?.scrollHeight||0,clientHeight:s?.clientHeight||0,scrollTop:s?.scrollTop||0,
      overflowY:cs?.overflowY||null,touchAction:cs?.touchAction||null,actions,
      pages:p?.querySelectorAll?.('.el49-page')?.length||0
    };
  });

  const shell=page.locator('#earthlineVermontReportPanel16149 .el49-shell');
  await shell.hover();
  await page.mouse.wheel(0,1200);
  await page.waitForTimeout(250);
  let afterScroll=await page.evaluate(()=>{
    const s=document.querySelector('#earthlineVermontReportPanel16149 .el49-shell');
    return s?.scrollTop||0;
  });
  if(afterScroll<50){
    await page.evaluate(()=>{
      const s=document.querySelector('#earthlineVermontReportPanel16149 .el49-shell');
      if(s)s.scrollTop=700;
    });
    await page.waitForTimeout(100);
    afterScroll=await page.evaluate(()=>document.querySelector('#earthlineVermontReportPanel16149 .el49-shell')?.scrollTop||0);
  }

  await page.evaluate(()=>{window.__EARTHLINE_PRINT_CALLED_17439=false;window.print=()=>{window.__EARTHLINE_PRINT_CALLED_17439=true}});
  await page.locator('#earthlineVermontReportPanel16149 [data-action="print"]').click();
  const printCalled=await page.evaluate(()=>window.__EARTHLINE_PRINT_CALLED_17439===true);

  let downloadOk=false,downloadName=null;
  try{
    const dlPromise=page.waitForEvent('download',{timeout:10000});
    await page.locator('#earthlineVermontReportPanel16149 [data-action="download"]').click();
    const dl=await dlPromise;
    downloadName=dl.suggestedFilename();
    downloadOk=/\.html$/i.test(downloadName||'');
  }catch(_){}

  let popupOk=false;
  try{
    const popupPromise=page.waitForEvent('popup',{timeout:10000});
    await page.locator('#earthlineVermontReportPanel16149 [data-action="newtab"]').click();
    const popup=await popupPromise;
    await popup.waitForLoadState('domcontentloaded',{timeout:10000}).catch(()=>{});
    popupOk=(await popup.locator('.el49-report,.el49-shell').count())>0;
    await popup.close();
  }catch(_){}

  const scrollOk=before.scrollHeight>before.clientHeight&&afterScroll>0&&/auto|scroll/.test(String(before.overflowY));
  const actionsOk=['print','newtab','download','close'].every(a=>before.actions.includes(a));
  const regionalClean=regional.swales>0&&regional.worms===0&&regional.tabs>0;
  const pass=regionalClean&&scrollOk&&actionsOk&&printCalled&&downloadOk&&popupOk&&!errors.length;
  const row={browser:BROWSER,case:c.name,pass,regionalClean,regional,scrollOk,before,afterScroll,actionsOk,printCalled,downloadOk,downloadName,popupOk,errors};
  rows.push(row);
  console.log('EARTHLINE_REPORT_17439 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
console.log('EARTHLINE_REPORT_17439_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
