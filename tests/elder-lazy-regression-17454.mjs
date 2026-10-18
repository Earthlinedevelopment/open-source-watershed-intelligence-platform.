import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
if(!launcher)throw new Error('unsupported '+BROWSER);
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const queries=['Alabama','Vermont','Thailand'];
const rows=[];

for(const query of queries){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?elderLazy17454='+BROWSER+'-'+encodeURIComponent(query)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill(query);
  await page.waitForTimeout(800);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(await opts.count())await opts.first().click();
  const clickAt=Date.now();
  const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
  const publishedAt=Date.now();
  let elderAt=null;
  try{
    await page.waitForFunction(start=>{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      const at=Date.parse(e?.at||'');
      return e?.state==='committed'&&Number.isFinite(at)&&at>=start-1000;
    },clickAt,{timeout:30000,polling:100});
    elderAt=Date.now();
  }catch(_){}
  const snap=await page.evaluate(()=>({
    elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')
  }));
  const elderAfterPublishedMs=elderAt==null?null:elderAt-publishedAt;
  const coverageIds=snap.elder?.summary?.coverageDatasetIds||[];
  const coverageOk=query==='Alabama'
    ? snap.elder?.summary?.coverageKnown===false
    : coverageIds.some(id=>String(id).toLowerCase()===query.toLowerCase());
  const pass=!!elderAt&&elderAfterPublishedMs<=3000&&coverageOk&&!errors.length;
  const row={browser:BROWSER,query,pass,regionalWallMs:publishedAt-clickAt,elderAfterPublishedMs,elderFromClickMs:elderAt==null?null:elderAt-clickAt,coverageOk,coverageIds,elder:snap.elder,perf:snap.perf,errors};
  rows.push(row);
  console.log('EARTHLINE_ELDER_LAZY_17454 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
mkdirSync('artifacts/elder-lazy-17454',{recursive:true});
writeFileSync('artifacts/elder-lazy-17454/'+BROWSER+'.json',JSON.stringify(summary,null,2));
console.log('EARTHLINE_ELDER_LAZY_17454_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
