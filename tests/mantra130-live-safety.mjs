import {chromium} from 'playwright';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const expected=await readFile('index.html');
const digest=b=>createHash('sha256').update(b).digest('hex');
const sha=digest(expected);
const result={expectedSha256:sha,url:'https://earthlinedevelopment.org/',checks:{},errors:[]};
await mkdir('artifacts/m130-live',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1800,height:1000},serviceWorkers:'block'});
page.on('pageerror',e=>result.errors.push(String(e)));
try{
 let matched=false;
 for(let i=0;i<24;i++){
  const response=await page.goto('https://earthlinedevelopment.org/?m130site='+Date.now()+'-'+i,{waitUntil:'domcontentloaded',timeout:60000});
  result.http=response?.status()||null;
  result.receivedSha256=digest(await response.body());
  if(result.receivedSha256===sha){matched=true;break;}
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
 result.checks.exactLiveVersion=matched;
 if(!matched)throw Error('Live CDN did not serve the approved corrected HTML hash');
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.locator('#searchInput').fill('Rutland, Vermont');
 await page.waitForFunction(()=>document.querySelector('#earthlineSearchSuggestions15970')?.classList.contains('open'),null,{timeout:18000});
 await page.locator('#earthlineSearchSuggestions15970 button[data-query]').first().click();
 await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970,null,{timeout:110000});
 await page.waitForTimeout(1000);
 await page.evaluate(()=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;m.stop();m.jumpTo({center:[-72.455,43.8811],zoom:17.7});});
 await page.waitForTimeout(2200);
 await page.locator('#earthlineDeclareProperty16169').click({timeout:15000});
 await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:110000});
 result.audit=await page.evaluate(()=>{
  const m=(typeof M!=='undefined'?M:window.M)||{},a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},d=m.swaleDiagnostics?.stage||{},
    sw=Array.isArray(m.swales)?m.swales:[];
  return {settled:a.settled,result:a.result,error:a.error,rawCount:sw.length,
    rejectedSteep:d.rejectSlopeAbove4M130||0,maxSlope:Math.max(0,...sw.map(s=>Number(s.slope)||0)),
    safePublished:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220?.published||false,
    status:document.getElementById('earthlineVermontStatus16147')?.textContent?.slice(0,250)};
 });
 result.checks.propertySettled=result.audit.settled===true;
 result.checks.steepRejected=result.audit.rejectedSteep>0;
 result.checks.noUnqualifiedSwales=result.audit.rawCount===0||result.audit.maxSlope<=4;
 result.checks.correctNoOpportunityStatus=result.audit.rawCount>0||/no qualifying bioswale corridors/i.test(result.audit.status||'');
 result.checks.noPageErrors=result.errors.length===0;
 await page.screenshot({path:'artifacts/m130-live/vermont-after-slope-repair.png',timeout:20000});
}catch(e){result.failure=String(e)}
await writeFile('artifacts/m130-live/result.json',JSON.stringify(result,null,2));
console.log('M130_LIVE_SAFETY '+JSON.stringify(result));
await browser.close();
if(result.failure||Object.keys(result.checks).length!==6||Object.values(result.checks).some(x=>!x))process.exitCode=1;
