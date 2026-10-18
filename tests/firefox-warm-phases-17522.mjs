import { firefox } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8'),launch=fs.readFileSync('earthline-launch-16872.js','utf8');
let worker=fs.readFileSync('earthline-elder-worker-17129.js','utf8');
const old1="    const py=await loadPyodide({indexURL:\"https://cdn.jsdelivr.net/pyodide/v0.29.5/full/\"});\n    await py.loadPackage([\"numpy\"]); /* EARTHLINE_ELDER_NUMPY_ONLY_FINAL_17414 */\n    const src=await fetch(\"tools/elder_trees/chmv2_array_detector_17129.py\",{cache:\"no-store\"});\n    if(!src.ok)throw new Error(\"array detector \"+src.status);\n    await py.runPythonAsync(await src.text());\n    return py;",new1="    const __t0=performance.now();\n    const py=await loadPyodide({indexURL:\"https://cdn.jsdelivr.net/pyodide/v0.29.5/full/\"});\n    const __t1=performance.now();\n    await py.loadPackage([\"numpy\"]); /* EARTHLINE_ELDER_NUMPY_ONLY_FINAL_17414 */\n    const __t2=performance.now();\n    const src=await fetch(\"tools/elder_trees/chmv2_array_detector_17129.py\",{cache:\"no-store\"});\n    if(!src.ok)throw new Error(\"array detector \"+src.status);\n    const __txt=await src.text();\n    const __t3=performance.now();\n    await py.runPythonAsync(__txt);\n    const __t4=performance.now();\n    self.__EARTHLINE_WARM_PHASE_17522={loadPyodide:__t1-__t0,numpy:__t2-__t1,fetchDetector:__t3-__t2,runDetector:__t4-__t3,total:__t4-__t0};\n    return py;",old2="self.postMessage({id,ok:true,warm:true,elapsedMs:performance.now()-t0});",new2="self.postMessage({id,ok:true,warm:true,elapsedMs:performance.now()-t0,warmTimings:self.__EARTHLINE_WARM_PHASE_17522||null});";
if(!worker.includes(old1))throw new Error('ensurePy timing anchor missing');
worker=worker.replace(old1,new1);
if(!worker.includes(old2))throw new Error('warm response timing anchor missing');
worker=worker.replace(old2,new2);
const browser=await firefox.launch({headless:false});
const context=await browser.newContext({viewport:{width:1800,height:950}});
await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(r.request().resourceType()==='document'&&/^(?:www\\.)?earthlinedevelopment\\.org$/i.test(u.hostname)&&u.pathname==='/')
    return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\\.)?earthlinedevelopment\\.org$/i.test(u.hostname)&&/\\/earthline-launch-16872\\.js$/.test(u.pathname))
    return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\\.)?earthlinedevelopment\\.org$/i.test(u.hostname)&&/\\/earthline-elder-worker-17129\\.js$/.test(u.pathname))
    return r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  return r.continue();
});
const page=await context.newPage();
await page.addInitScript(()=>{
  window.__p17522=[];
  setInterval(()=>{try{
    const w=window.__EARTHLINE_ELDER_EARLY_WORKER_17520;
    if(w&&!w.__p17522){
      w.__p17522=true;
      window.__p17522.push({kind:'seen',t:performance.now()});
      w.addEventListener('message',e=>{if(String(e.data?.id||'')==='elder-early-warm-17520')window.__p17522.push({kind:'warm',t:performance.now(),data:e.data})});
    }
  }catch(_){}},10);
});
await page.goto('https://earthlinedevelopment.org/?ffphase17522='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.__p17522.some(x=>x.kind==='warm'),null,{timeout:60000,polling:50});
console.log('EARTHLINE_FIREFOX_WARM_PHASES_17522 '+JSON.stringify(await page.evaluate(()=>window.__p17522)));
await context.close();await browser.close();
