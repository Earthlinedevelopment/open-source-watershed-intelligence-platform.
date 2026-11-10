import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const original=await readFile('/tmp/m137-original.html');
const proposed=await readFile('/tmp/m137-proposed.html');
await mkdir('artifacts/m137-iowa',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']});
const runs=[];
for(const [version,html] of [['before',original],['after',proposed]]){
 for(const [device,width,height] of [['desktop',1800,1000],['phone',390,844]]){
  const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block'});
  const item={version,device,errors:[],screenshots:[],published:false};
  page.on('pageerror',e=>item.errors.push(String(e)));
  await page.route('**/*',r=>r.request().isNavigationRequest()&&r.request().resourceType()==='document'?r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html}):r.continue());
  const capture=async(label)=>{await page.screenshot({path:'artifacts/m137-iowa/'+version+'-'+device+'-'+label+'.png',timeout:30000,animations:'disabled'});item.screenshots.push(label)};
  const state=()=>page.evaluate(()=>{
   const ids=['earthlineSwaleLegend16050','earthlineAquiferLegend16070','earthlineDiagramLegend16080'];
   return {legend:ids.map(id=>{const el=document.getElementById(id);const rect=el?.getBoundingClientRect();return{id,present:!!el,visible:!!el&&getComputedStyle(el).display!=='none',rect:rect?{x:Math.round(rect.x),y:Math.round(rect.y)}:null}}),
    hint:!!document.getElementById('earthlineTemporaryMapHint126'),
    regionalPublished:!!window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970,
    status:document.getElementById('earthlineVermontStatus16147')?.textContent?.slice(0,200)};
  });
  try{
   await page.goto('https://earthlinedevelopment.org/?m137-iowa='+version+'-'+device,{waitUntil:'domcontentloaded',timeout:55000});
   await page.waitForSelector('#searchInput',{timeout:25000});
   await capture('home');
   await page.locator('#searchInput').fill('Iowa');
   await page.locator('#searchInput').press('Enter');
   await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970,null,{timeout:95000});
   item.published=true;
   await page.waitForTimeout(1200);
   item.regional=await state();
   await capture('iowa-regional');
   const close=page.locator('#earthlineTemporaryMapHint126 button');
   if(await close.isVisible().catch(()=>false))await close.click({timeout:5000});
   await page.waitForTimeout(200);
   item.clear=await state();
   await capture('iowa-regional-hint-closed');
   const visible=item.clear.legend.some(x=>x.visible);
   if(version==='before'&&!visible)throw Error('baseline lacked old boxes');
   if(version==='after'&&visible)throw Error('PR55 still displays old boxes');
  }catch(e){item.failure=String(e);try{await capture('failed')}catch{}}
  runs.push(item);
  await page.close();
 }
}
await browser.close();
const pass=runs.every(x=>x.published&&!x.failure);
await writeFile('artifacts/m137-iowa/results.json',JSON.stringify({pass,runs},null,2));
console.log('M137_REAL_IOWA_BEFORE_AFTER '+JSON.stringify({pass,runs}).slice(0,23000));
if(!pass)process.exitCode=1;
