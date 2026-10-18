import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless,downloadsPath:process.env.RUNNER_TEMP||undefined});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const cases=[
 {name:'Vermont',query:'Vermont',viewport:{width:1440,height:860}},
 {name:'Brazil',query:'Brazil country',viewport:{width:1440,height:860}},
 {name:'Switzerland',query:'Switzerland country',viewport:{width:1440,height:860}},
 {name:'Thailand',query:'Thailand country',viewport:{width:390,height:844}},
 {name:'New Zealand',query:'New Zealand country',viewport:{width:1440,height:860}}
];
const rows=[];
for(const c of cases){
 const ctx=await browser.newContext({viewport:c.viewport,acceptDownloads:true});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const started=Date.now();
 await page.goto(BASE+'?fastGlobal17465='+BROWSER+'-'+encodeURIComponent(c.name)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.locator('#searchInput').fill(c.query);
 const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
 await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
 const reportBtn=page.locator('#earthlineVermontReport16149');await reportBtn.waitFor({state:'visible',timeout:25000});
 if(c.viewport.width<500)await page.evaluate(()=>window.earthlineOpenVermontReport16151?.());else await reportBtn.click();
 await page.waitForFunction(()=>{const p=document.getElementById('earthlineVermontReportPanel16149');return !!p?.classList?.contains('open')&&!!p.querySelector('.el49-shell')},null,{timeout:15000,polling:100});
 const before=await page.evaluate(()=>{const p=document.getElementById('earthlineVermontReportPanel16149'),s=p?.querySelector('.el49-shell'),cs=s?getComputedStyle(s):null;return{sh:s?.scrollHeight||0,ch:s?.clientHeight||0,oy:cs?.overflowY||'',actions:[...p?.querySelectorAll('.el49-toolbar-actions [data-action]')||[]].map(x=>x.dataset.action)}});
 await page.evaluate(()=>{const s=document.querySelector('#earthlineVermontReportPanel16149 .el49-shell');if(s)s.scrollTop=Math.max(100,Math.min(700,s.scrollHeight-s.clientHeight))});
 await page.waitForTimeout(80);const scrollTop=await page.evaluate(()=>document.querySelector('#earthlineVermontReportPanel16149 .el49-shell')?.scrollTop||0);
 await page.evaluate(()=>{window.__p17465=false;window.print=()=>{window.__p17465=true}});await page.locator('#earthlineVermontReportPanel16149 [data-action="print"]').click();const printOk=await page.evaluate(()=>window.__p17465);
 let downloadOk=false;try{const p=page.waitForEvent('download',{timeout:7000});await page.locator('#earthlineVermontReportPanel16149 [data-action="download"]').click();const d=await p;downloadOk=/\.html$/i.test(d.suggestedFilename()||'')}catch(_){}
 let popupOk=false;try{const p=page.waitForEvent('popup',{timeout:7000});await page.locator('#earthlineVermontReportPanel16149 [data-action="newtab"]').click();const x=await p;await x.waitForLoadState('domcontentloaded',{timeout:7000}).catch(()=>{});popupOk=(await x.locator('.el49-report,.el49-shell').count())>0;await x.close()}catch(_){}
 const scrollOk=before.sh>before.ch&&scrollTop>0&&/auto|scroll/.test(before.oy),actionsOk=['print','newtab','download','close'].every(a=>before.actions.includes(a));
 const pass=scrollOk&&actionsOk&&printOk&&downloadOk&&popupOk&&!errors.length;
 rows.push({browser:BROWSER,name:c.name,pass,elapsedMs:Date.now()-started,scrollOk,actionsOk,printOk,downloadOk,popupOk,errors});
 console.log('EARTHLINE_FAST_GLOBAL_17465 '+JSON.stringify(rows.at(-1)));await ctx.close();
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
mkdirSync('artifacts/fast-global-17465',{recursive:true});writeFileSync('artifacts/fast-global-17465/'+BROWSER+'.json',JSON.stringify(summary,null,2));
console.log('EARTHLINE_FAST_GLOBAL_17465_SUMMARY '+JSON.stringify(summary));if(summary.fail)process.exitCode=1;
