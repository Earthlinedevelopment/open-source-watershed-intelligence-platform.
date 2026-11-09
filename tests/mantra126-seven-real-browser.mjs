import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const n=Number(process.env.PASS_NUMBER||0);
if(n<1||n>7)throw Error('Invalid pass number');
const out='artifacts/m126-seven/pass-'+n;
await mkdir(out,{recursive:true});
const result={pass:n,url:'https://earthlinedevelopment.org/',checks:{},failures:[],errors:[],startedAt:new Date().toISOString()};
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1500,height:950},serviceWorkers:'block',ignoreHTTPSErrors:false});
const page=await context.newPage();
page.on('pageerror',e=>result.errors.push(String(e)));
try{
 const response=await page.goto('https://earthlinedevelopment.org/?m126seven='+n+'&ts='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 result.responseStatus=response.status();
 result.deliveredSha256=createHash('sha256').update(await response.body()).digest('hex');
 result.checks.http200=response.status()===200;
 await page.waitForSelector('#searchInput',{timeout:35000});
 result.checks.search=await page.locator('#searchInput').isVisible();
 await page.waitForTimeout(1200);
 result.checks.notOnHome=(await page.locator('#earthlineTemporaryMapHint126').count())===0;
 result.checks.reportEntryFunction=await page.evaluate(()=>typeof window.earthlineOpenVermontReport16151==='function');
 result.checks.reportLocationImplementation=await page.evaluate(()=>String(window.earthlineOpenVermontReport16151||'').includes('reportPlaceLine123'));
 result.checks.reportAquiferImplementation=await page.evaluate(()=>String(window.earthlineOpenVermontReport16151||'').includes('reportAquiferContext123'));
 // Genuine regional analysis from the user's search button; no injected mock data.
 await page.locator('#searchInput').fill('Rutland, Vermont');
 await page.waitForFunction(()=>document.querySelector('#earthlineSearchSuggestions15970')?.classList.contains('open'),null,{timeout:18000});
 await page.locator('#earthlineSearchSuggestions15970 button[data-query]').first().click();
 result.checks.autocompleteSelection=true;
 // Selecting a place can launch analysis itself; otherwise use the visible Run control.
 await page.waitForTimeout(600);
 if(!(await page.evaluate(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970))) {
   await page.locator('#runBtn').evaluate(el=>el.click());
 }
 try{
  await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||
    /screening published|regional analysis complete/i.test(document.querySelector('#earthlineVermontStatus16147')?.textContent||''),
    null,{timeout:100000,polling:250});
  result.regionalPublished=true;
 }catch(e){result.regionalPublished=false;result.failures.push('Real Regional result timeout: '+String(e).slice(0,220))}
 if(result.regionalPublished){
  try{
   await page.waitForFunction(()=>document.getElementById('earthlineTemporaryMapHint126')?.textContent==='Place hand cursor over bare land to move map.',null,{timeout:13000});
   result.hint=await page.locator('#earthlineTemporaryMapHint126').textContent();
   result.checks.exactHint=result.hint.trim()==='Place hand cursor over bare land to move map.';
   result.checks.afterRegional=!!(await page.evaluate(()=>window.EARTHLINE_MAP_HINT_AUDIT_126?.shown));
   await page.screenshot({path:out+'/hint-after-regional.png',timeout:20000});
   await page.mouse.click(1000,650);
   await page.waitForTimeout(250);
   result.checks.dismissed=(await page.locator('#earthlineTemporaryMapHint126').count())===0;
  }catch(e){result.failures.push('Post-Regional hint missing: '+String(e).slice(0,220));result.checks.exactHint=false;result.checks.afterRegional=false}
  try{
   await page.evaluate(()=>window.earthlineOpenVermontReport16151());
   await page.waitForSelector('#earthlineVermontReportPanel16149.open .el49-report',{timeout:25000});
   result.report=await page.evaluate(()=>{
    const panel=document.getElementById('earthlineVermontReportPanel16149');
    const d=window.EARTHLINE_FROZEN_REPORT_SNAPSHOT_16388;
    return {open:panel?.classList.contains('open'),locations:[...(panel?.querySelectorAll('.el49-cover .el49-location')||[])].map(e=>e.textContent.trim()),
      aquiferState:d?.reportAquifer?.state||null,aquiferCount:d?.reportAquifer?.features?.length??null,
      technicalMapAquifer:panel?.innerHTML?.includes('Aquifer context not loaded')||false,
      reportRunToken:d?.d?.runToken||null};
   });
   result.checks.reportOpens=result.report.open===true;
   result.checks.reportNamedPlace=result.report.locations.some(x=>/[A-Za-z]{3,}/.test(x)&&!/^coordinates:/i.test(x));
   result.checks.reportAquiferTransparent=result.report.aquiferState==='loaded'||result.report.aquiferState==='not-loaded';
   result.checks.reportAquiferMapped=result.report.aquiferState==='loaded'&&result.report.aquiferCount>0;
   await page.screenshot({path:out+'/report.png',timeout:20000});
  }catch(e){result.failures.push('Report failed to open: '+String(e).slice(0,250));result.checks.reportOpens=false}
 }
 result.checks.noPageErrors=result.errors.length===0;
}catch(e){result.failures.push(String(e))}
finally{
 result.completedAt=new Date().toISOString();
 result.passed=result.failures.length===0&&Object.keys(result.checks).length>=9&&Object.values(result.checks).every(Boolean);
 await writeFile(out+'/result.json',JSON.stringify(result,null,2));
 console.log('M126_SEVEN_PASS_RESULT '+JSON.stringify(result));
 await browser.close();
}
if(!result.passed)process.exitCode=1;
