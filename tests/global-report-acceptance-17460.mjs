import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
if(!launcher)throw new Error('unsupported browser '+BROWSER);
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless,downloadsPath:process.env.RUNNER_TEMP||undefined});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const places=[
  {name:'Vermont',query:'Vermont'},
  {name:'Alabama',query:'Alabama'},
  {name:'Canada',query:'Canada country'},
  {name:'Brazil',query:'Brazil country'},
  {name:'Switzerland',query:'Switzerland country'},
  {name:'Thailand',query:'Thailand country'},
  {name:'Vietnam',query:'Vietnam country'},
  {name:'Laos',query:'Laos country'},
  {name:'New Zealand',query:'New Zealand country'}
];
const cases=[{name:'desktop',viewport:{width:1440,height:860}},{name:'mobile',viewport:{width:390,height:844}}];
const rows=[];
for(const place of places){
  for(const c of cases){
    const context=await browser.newContext({viewport:c.viewport,acceptDownloads:true});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    const started=Date.now();
    await page.goto(BASE+'?reportGlobal17460='+BROWSER+'-'+encodeURIComponent(place.name)+'-'+c.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.locator('#searchInput').fill(place.query);
    await page.waitForTimeout(500);
    const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
    await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
    await page.waitForTimeout(350);
    const reportBtn=page.locator('#earthlineVermontReport16149');
    await reportBtn.waitFor({state:'visible',timeout:30000});
    if(c.name==='mobile')await page.evaluate(()=>window.earthlineOpenVermontReport16151?.());
    else await reportBtn.click();
    await page.waitForFunction(()=>{const p=document.getElementById('earthlineVermontReportPanel16149');return !!p?.classList?.contains('open')&&!!p.querySelector('.el49-shell')},null,{timeout:20000,polling:100});
    await page.waitForTimeout(200);
    const before=await page.evaluate(()=>{
      const p=document.getElementById('earthlineVermontReportPanel16149'),s=p?.querySelector('.el49-shell'),cs=s?getComputedStyle(s):null;
      return {scrollHeight:s?.scrollHeight||0,clientHeight:s?.clientHeight||0,overflowY:cs?.overflowY||null,
        actions:[...p?.querySelectorAll?.('.el49-toolbar-actions [data-action]')||[]].map(x=>x.dataset.action),
        pages:p?.querySelectorAll?.('.el49-page')?.length||0};
    });
    await page.evaluate(()=>{const s=document.querySelector('#earthlineVermontReportPanel16149 .el49-shell');if(s)s.scrollTop=Math.min(900,Math.max(100,s.scrollHeight-s.clientHeight))});
    await page.waitForTimeout(80);
    const scrollTop=await page.evaluate(()=>document.querySelector('#earthlineVermontReportPanel16149 .el49-shell')?.scrollTop||0);
    await page.evaluate(()=>{window.__EL_PRINT_17460=false;window.print=()=>{window.__EL_PRINT_17460=true}});
    await page.locator('#earthlineVermontReportPanel16149 [data-action="print"]').click();
    const printOk=await page.evaluate(()=>window.__EL_PRINT_17460===true);
    let downloadOk=false,downloadName=null;
    try{
      const dlp=page.waitForEvent('download',{timeout:10000});
      await page.locator('#earthlineVermontReportPanel16149 [data-action="download"]').click();
      const dl=await dlp;downloadName=dl.suggestedFilename();downloadOk=/\.html$/i.test(downloadName||'');
    }catch(_){}
    let popupOk=false;
    try{
      const pp=page.waitForEvent('popup',{timeout:10000});
      await page.locator('#earthlineVermontReportPanel16149 [data-action="newtab"]').click();
      const popup=await pp;await popup.waitForLoadState('domcontentloaded',{timeout:10000}).catch(()=>{});
      popupOk=(await popup.locator('.el49-report,.el49-shell').count())>0;await popup.close();
    }catch(_){}
    const scrollOk=before.scrollHeight>before.clientHeight&&scrollTop>0&&/auto|scroll/.test(String(before.overflowY));
    const actionsOk=['print','newtab','download','close'].every(a=>before.actions.includes(a));
    const pass=scrollOk&&actionsOk&&printOk&&downloadOk&&popupOk&&!errors.length;
    rows.push({browser:BROWSER,place:place.name,query:place.query,case:c.name,pass,elapsedMs:Date.now()-started,before,scrollTop,scrollOk,actionsOk,printOk,downloadOk,downloadName,popupOk,errors});
    console.log('EARTHLINE_GLOBAL_REPORT_17460 '+JSON.stringify(rows.at(-1)));
    await context.close();
  }
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
mkdirSync('artifacts/global-report-17460',{recursive:true});
writeFileSync('artifacts/global-report-17460/'+BROWSER+'.json',JSON.stringify(summary,null,2));
console.log('EARTHLINE_GLOBAL_REPORT_17460_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
