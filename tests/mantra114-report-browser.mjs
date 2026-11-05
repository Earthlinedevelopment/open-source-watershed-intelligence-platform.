import {chromium} from 'playwright';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const BASE='https://earthlinedevelopment.org/';
const ROOT=process.cwd();
const hash=createHash('sha256').update(readFileSync('index.html')).digest('hex');
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1500,height:930},acceptDownloads:true});
const page=await ctx.newPage();
const errors=[],rows=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin!==new URL(BASE).origin)return route.continue();
  let rel;try{rel=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html'}catch{return route.abort()}
  const local=path.resolve(ROOT,rel);
  if(local!==ROOT&&!local.startsWith(ROOT+path.sep))return route.abort();
  if(!existsSync(local)||!statSync(local).isFile())return route.continue();
  const ext=path.extname(local).toLowerCase();
  const types={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.geojson':'application/geo+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css'};
  return route.fulfill({status:200,contentType:types[ext]||'application/octet-stream',body:readFileSync(local)});
});
try{
  await page.goto(BASE+'?m114_report='+Date.now(),{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForSelector('#searchInput',{timeout:20000});
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  });
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151;
    return d?.tier==='regional'||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
  },null,{timeout:80000,polling:250});
  await page.waitForFunction(()=>{
    const x=window.EARTHLINE_ELDER_TREE_LAST_17097,d=window.EARTHLINE_DISPLAYED_RUN_16151;
    return x?.state==='committed'&&x?.runToken===d?.runToken;
  },null,{timeout:25000,polling:200});
  const reportButton=page.locator('#earthlineVermontReport16149');
  await reportButton.waitFor({timeout:10000});
  await reportButton.click({timeout:12000});
  const panel=page.locator('#earthlineVermontReportPanel16149.open');
  await panel.waitFor({timeout:8000});
  const before=await page.evaluate(()=>{
    const p=document.getElementById('earthlineVermontReportPanel16149');
    const el=p?.querySelector('#earthlineElderTreesReport17097');
    const d=window.EARTHLINE_FROZEN_REPORT_SNAPSHOT_16151;
    return {reportId:d?.reportId,runToken:d?.d?.runToken,currentToken:window.EARTHLINE_DISPLAYED_RUN_16151?.runToken,elderCount:p?.querySelectorAll('#earthlineElderTreesReport17097').length,elderText:el?.textContent,
      mapTitle:p?.querySelector('.el49-cover svg')?.getAttribute('aria-label'),
      nativeReportSource:!!window.EARTHLINE_ELDER_TREES_V1_17097?.reportHtml};
  });
  rows.push({kind:'screen',...before});
  if(!before.reportId||before.runToken!==before.currentToken||before.elderCount!==1||!before.nativeReportSource)throw Error('Report/Elder run ownership or frozen on-screen evidence mismatch: '+JSON.stringify(before));
  const [pop]=await Promise.all([
    page.waitForEvent('popup',{timeout:10000}),
    panel.locator('[data-action="newtab"]').click()
  ]);
  await pop.waitForLoadState('domcontentloaded',{timeout:20000}).catch(()=>{});
  const exported=await pop.evaluate(()=>({
    elderCount:document.querySelectorAll('#earthlineElderTreesReport17097').length,
    elderText:document.querySelector('#earthlineElderTreesReport17097')?.textContent,
    reportId:document.querySelector('#earthline-report-ledger-16388')?.textContent||'',
    title:document.title
  }));
  rows.push({kind:'new-tab',...exported});
  if(exported.elderCount!==1||exported.elderText!==before.elderText||!exported.reportId.includes(before.reportId))throw Error('New-tab report differs from on-screen frozen snapshot: '+JSON.stringify(exported));
  await pop.close();
  await page.screenshot({path:'artifacts/mantra114-report.png'}).catch(()=>{});
}catch(e){errors.push(String(e))}
await ctx.close();await browser.close();
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/mantra114-report-results.json',JSON.stringify({hash,rows,errors},null,2));
console.log('MANTRA114_REPORT_BROWSER_SUMMARY '+JSON.stringify({hash,rows,errors,pass:errors.length===0&&rows.length===2}));
if(errors.length||rows.length!==2)process.exitCode=1;
