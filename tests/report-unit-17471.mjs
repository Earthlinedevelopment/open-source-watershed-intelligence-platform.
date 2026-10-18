import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless,downloadsPath:process.env.RUNNER_TEMP||undefined});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const cases=[
 {name:'Brazil',bounds:[-73.9,-33.8,-34.8,5.3]},
 {name:'Switzerland',bounds:[5.9,45.8,10.5,47.8]},
 {name:'Thailand',bounds:[97.3,5.6,105.7,20.5]}
];
const rows=[];
for(const c of cases){
 const context=await browser.newContext({viewport:c.name==='Thailand'?{width:390,height:844}:{width:1440,height:860},acceptDownloads:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(BASE+'?reportUnit17471='+BROWSER+'-'+c.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>typeof window.earthlineOpenVermontReport16151==='function',null,{timeout:30000});
 await page.evaluate(c=>{
   const token='unit-'+c.name.toLowerCase().replace(/\s+/g,'-')+'-17471';
   window.EARTHLINE_ACTIVE_RUN_TOKEN_16151=token;
   window.EARTHLINE_DISPLAYED_RUN_16151={
     runToken:token,query:c.name,normalizedQuery:c.name,tier:'regional',extentClass:'Regional screening',
     bounds:c.bounds,boundsHash:'17471-'+c.name,completedAt:new Date().toISOString()
   };
   window.EARTHLINE_REGIONAL_VISUAL_DATA_16020={
     query:c.name,bounds:c.bounds,
     swales:{type:'FeatureCollection',features:[]},
     contours:{type:'FeatureCollection',features:[]},
     flows:{type:'FeatureCollection',features:[]},
     aquifers:{type:'FeatureCollection',features:[]}
   };
 },c);
 const opened=await page.evaluate(()=>window.earthlineOpenVermontReport16151());
 await page.waitForFunction(()=>document.getElementById('earthlineVermontReportPanel16149')?.classList?.contains('open'),null,{timeout:8000,polling:50});
 await page.waitForTimeout(120);
 const loc=String(await page.locator('#earthlineVermontReportPanel16149 .el49-location').first().textContent()||'').trim();
 const shell=page.locator('#earthlineVermontReportPanel16149 .el49-shell');
 const dims=await shell.evaluate(el=>({sh:el.scrollHeight,ch:el.clientHeight,oy:getComputedStyle(el).overflowY,actions:[...document.querySelectorAll('#earthlineVermontReportPanel16149 .el49-toolbar-actions [data-action]')].map(x=>x.dataset.action)}));
 await shell.evaluate(el=>{el.scrollTop=Math.max(100,Math.min(700,el.scrollHeight-el.clientHeight))});await page.waitForTimeout(60);
 const scrollTop=await shell.evaluate(el=>el.scrollTop);
 await page.evaluate(()=>{window.__print17471=false;window.print=()=>{window.__print17471=true}});
 await page.locator('#earthlineVermontReportPanel16149 [data-action="print"]').click();const printOk=await page.evaluate(()=>window.__print17471===true);
 let downloadOk=false;try{const dlp=page.waitForEvent('download',{timeout:6000});await page.locator('#earthlineVermontReportPanel16149 [data-action="download"]').click();const d=await dlp;downloadOk=/\.html$/i.test(d.suggestedFilename()||'')}catch(_){}
 let popupOk=false;try{const pp=page.waitForEvent('popup',{timeout:6000});await page.locator('#earthlineVermontReportPanel16149 [data-action="newtab"]').click();const pop=await pp;await pop.waitForLoadState('domcontentloaded',{timeout:6000}).catch(()=>{});popupOk=(await pop.locator('.el49-report,.el49-shell').count())>0;await pop.close()}catch(_){}
 const scrollOk=dims.sh>dims.ch&&scrollTop>0&&/auto|scroll/.test(dims.oy),actionsOk=['print','newtab','download','close'].every(a=>dims.actions.includes(a)),locationOk=loc===c.name;
 const pass=opened===true&&locationOk&&scrollOk&&actionsOk&&printOk&&downloadOk&&popupOk&&!errors.length;
 rows.push({browser:BROWSER,name:c.name,pass,opened,loc,locationOk,scrollOk,actionsOk,printOk,downloadOk,popupOk,errors});
 console.log('EARTHLINE_REPORT_UNIT_17471 '+JSON.stringify(rows.at(-1)));await context.close();
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
mkdirSync('artifacts/report-unit-17471',{recursive:true});writeFileSync('artifacts/report-unit-17471/'+BROWSER+'.json',JSON.stringify(summary,null,2));
console.log('EARTHLINE_REPORT_UNIT_17471_SUMMARY '+JSON.stringify(summary));if(summary.fail)process.exitCode=1;
