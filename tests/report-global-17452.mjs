import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const QUERY=String(process.env.QUERY||'Vermont');
const launcher={chromium,firefox,webkit}[BROWSER];
if(!launcher)throw new Error('Unsupported browser '+BROWSER);
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
  const start=Date.now();
  await page.goto(BASE+'?globalReport17452='+encodeURIComponent(BROWSER+'-'+QUERY+'-'+c.name+'-'+Date.now()),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill(QUERY);
  await page.waitForTimeout(900);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  const suggestionTexts=await opts.allTextContents().catch(()=>[]);
  if(await opts.count())await opts.first().click();
  const selectedInput=await page.locator('#searchInput').inputValue();
  const rb=page.locator('#runBtn');
  if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
  await page.waitForTimeout(500);

  const identity=await page.evaluate(()=>({
    input:document.getElementById('searchInput')?.value||'',
    live:window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,
    statePkg:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
    countryPkg:window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845||null,
    tier:String(document.documentElement.dataset.earthlineAnalysisTier||'')
  }));

  const reportBtn=page.locator('#earthlineVermontReport16149');
  await reportBtn.waitFor({state:'visible',timeout:30000});
  if(c.name==='mobile')await page.evaluate(()=>window.earthlineOpenVermontReport16151?.());
  else await reportBtn.click();
  await page.waitForFunction(()=>{const p=document.getElementById('earthlineVermontReportPanel16149');return !!p?.classList?.contains('open')&&!!p.querySelector('.el49-shell')},null,{timeout:20000,polling:100});
  await page.waitForTimeout(250);

  const before=await page.evaluate(()=>{
    const p=document.getElementById('earthlineVermontReportPanel16149');
    const s=p?.querySelector('.el49-shell');
    const actions=[...p?.querySelectorAll?.('.el49-toolbar-actions [data-action]')||[]].map(x=>x.dataset.action);
    const cs=s?getComputedStyle(s):null;
    return {scrollHeight:s?.scrollHeight||0,clientHeight:s?.clientHeight||0,overflowY:cs?.overflowY||null,touchAction:cs?.touchAction||null,actions,pages:p?.querySelectorAll?.('.el49-page')?.length||0};
  });

  await page.evaluate(()=>{const s=document.querySelector('#earthlineVermontReportPanel16149 .el49-shell');if(s)s.scrollTop=Math.min(900,Math.max(100,s.scrollHeight-s.clientHeight))});
  await page.waitForTimeout(120);
  const afterScroll=await page.evaluate(()=>document.querySelector('#earthlineVermontReportPanel16149 .el49-shell')?.scrollTop||0);

  await page.evaluate(()=>{window.__EARTHLINE_PRINT_CALLED_17452=false;window.print=()=>{window.__EARTHLINE_PRINT_CALLED_17452=true}});
  await page.locator('#earthlineVermontReportPanel16149 [data-action="print"]').click();
  const printCalled=await page.evaluate(()=>window.__EARTHLINE_PRINT_CALLED_17452===true);

  let downloadOk=false,downloadName=null;
  try{
    const dlPromise=page.waitForEvent('download',{timeout:12000});
    await page.locator('#earthlineVermontReportPanel16149 [data-action="download"]').click();
    const dl=await dlPromise;downloadName=dl.suggestedFilename();downloadOk=/\.html$/i.test(downloadName||'');
  }catch(_){}

  let popupOk=false;
  try{
    const popupPromise=page.waitForEvent('popup',{timeout:12000});
    await page.locator('#earthlineVermontReportPanel16149 [data-action="newtab"]').click();
    const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded',{timeout:12000}).catch(()=>{});
    popupOk=(await popup.locator('.el49-report,.el49-shell').count())>0;await popup.close();
  }catch(_){}

  const scrollOk=before.scrollHeight>before.clientHeight&&afterScroll>0&&/auto|scroll/.test(String(before.overflowY));
  const actionsOk=['print','newtab','download','close'].every(a=>before.actions.includes(a));
  const pass=scrollOk&&actionsOk&&printCalled&&downloadOk&&popupOk&&!errors.length;
  rows.push({browser:BROWSER,query:QUERY,case:c.name,pass,elapsedMs:Date.now()-start,suggestionTexts,selectedInput,identity,before,afterScroll,scrollOk,actionsOk,printCalled,downloadOk,downloadName,popupOk,errors});
  console.log('EARTHLINE_GLOBAL_REPORT_17452 '+JSON.stringify(rows.at(-1)));
  await context.close();
}
await browser.close();
const summary={browser:BROWSER,query:QUERY,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
mkdirSync('artifacts/global-report-17452',{recursive:true});
const slug=QUERY.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
writeFileSync('artifacts/global-report-17452/'+BROWSER+'-'+slug+'.json',JSON.stringify(summary,null,2));
console.log('EARTHLINE_GLOBAL_REPORT_17452_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
