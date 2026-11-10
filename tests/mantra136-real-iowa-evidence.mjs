import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const candidate = await readFile(process.env.CANDIDATE_FILE || 'candidate-index.html');
const base = await readFile(process.env.BASELINE_FILE || 'baseline-index.html');
await mkdir('artifacts/m136-real',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
const outputs=[];
const location=[-93.38977,41.95748];
for(const [version,html] of [['before',base],['after',candidate]]){
 for(const [device,width,height] of [['desktop',1800,1000],['phone',390,844]]){
  const p=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});
  const entry={version,device,errors:[],requestsFailed:[],photos:[],resultPublished:false};
  p.on('pageerror',e=>entry.errors.push(String(e)));
  p.on('requestfailed',r=>{if(entry.requestsFailed.length<15)entry.requestsFailed.push({url:r.url().slice(0,110),failure:r.failure()?.errorText})});
  await p.route('**/*',r=>r.request().isNavigationRequest()&&r.request().resourceType()==='document'?r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}):r.continue());
  const snap=async(label)=>{
    await p.screenshot({path:'artifacts/m136-real/'+version+'-'+device+'-'+label+'.png',timeout:18000});
    entry.photos.push(label);
  };
  try{
   await p.goto('https://earthlinedevelopment.org/?m136-real='+version+'-'+device,{waitUntil:'domcontentloaded',timeout:50000});
   await p.waitForSelector('#searchInput',{timeout:25000});
   await snap('home');
   const input=p.locator('#searchInput');
   await input.fill('Iowa'); await input.press('Enter');
   // Both versions get an identical bounded window. Capture timeout evidence, not synthetic success.
   await p.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970,null,{timeout:65000}).then(()=>entry.resultPublished=true).catch(e=>{entry.regionError=String(e)});
   await p.waitForTimeout(1000);
   entry.region=await p.evaluate(()=>({published:!!window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970,zoom:window.earthlineMap?.getZoom?.(),tier:document.documentElement.dataset.earthlineAnalysisTier,tip:!!document.getElementById('earthlineTemporaryMapHint126'),corridor:document.getElementById('earthlineCorridorTip16248')?.className,status:document.getElementById('earthlineVermontStatus16147')?.textContent?.slice(0,250)}));
   await snap('iowa-regional-panel-open');
   await p.evaluate(()=>document.documentElement.classList.remove('earthline-panel-open-16188'));
   await p.waitForTimeout(700); await snap('iowa-regional-panel-closed');
   await p.evaluate(()=>{const m=window.earthlineMap||window.map;try{m?.jumpTo?.({zoom:10.5})}catch(e){}});
   await p.waitForTimeout(1200);await snap('iowa-zoom-10');
   // Actual property targeting only if map exists; record missing state.
   entry.property=await p.evaluate(([lng,lat])=>{const m=window.earthlineMap||window.map;try{m?.jumpTo?.({center:[lng,lat],zoom:17.7});return {jumped:true}}catch(e){return{error:String(e)}}},location);
   await p.waitForTimeout(1100);
   const prop=p.locator('#earthlineDeclareProperty16169');
   if(await prop.isVisible().catch(()=>false)){
      await prop.click({timeout:8000});
      await p.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:35000}).catch(e=>{entry.property.waitError=String(e)});
   }else entry.property.buttonMissing=true;
   await snap('iowa-property');
   entry.report={modalButtons:await p.locator('button').filter({hasText:/report|bioswale report/i}).count()};
   const reportButton=p.locator('button').filter({hasText:/bioswale report|generate report|view report/i}).first();
   if(await reportButton.isVisible().catch(()=>false)){
      await reportButton.click({timeout:5000}).catch(e=>entry.report.clickError=String(e));
      await p.waitForTimeout(750);
   } else entry.report.buttonMissing=true;
   await snap('report-or-current-view');
  }catch(e){entry.failure=String(e);try{await snap('failure-state')}catch{}}
  outputs.push(entry);await p.close();
 }
}
await browser.close();
await writeFile('artifacts/m136-real/results.json',JSON.stringify(outputs,null,2));
console.log('M136_REAL_IOWA_RESULTS '+JSON.stringify(outputs).slice(0,19000));
if(outputs.some(x=>!x.resultPublished||x.failure||x.property?.buttonMissing||x.report?.buttonMissing))process.exitCode=1;
