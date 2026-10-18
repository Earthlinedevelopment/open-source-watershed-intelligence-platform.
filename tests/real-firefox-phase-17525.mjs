import { firefox } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8'),launch=fs.readFileSync('earthline-launch-16872.js','utf8'),worker=fs.readFileSync('earthline-elder-worker-17129.js','utf8');
const browser=await firefox.launch({headless:false});
const context=await browser.newContext({viewport:{width:1800,height:950}});
await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
    return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname.endsWith('/earthline-launch-16872.js'))
    return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname.endsWith('/earthline-elder-worker-17129.js'))
    return r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  return r.continue();
});
const page=await context.newPage();
await page.addInitScript(()=>{
  window.__phase17525=[];
  const timer=setInterval(()=>{
    try{
      const w=window.__EARTHLINE_ELDER_EARLY_WORKER_17520;
      if(w&&!w.__phaseAttached17525){
        w.__phaseAttached17525=true;
        window.__phase17525.push({kind:'seen',t:performance.now()});
        w.addEventListener('message',e=>{
          if(String(e.data?.id||'')==='elder-early-warm-17520'){
            window.__phase17525.push({kind:'warm',t:performance.now(),data:e.data});
          }
        });
      }
    }catch(_){}
  },5);
});
await page.goto('https://earthlinedevelopment.org/?phase17525='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.__phase17525.some(x=>x.kind==='warm'),null,{timeout:60000,polling:25});
console.log('EARTHLINE_REAL_FIREFOX_PHASE_17525 '+JSON.stringify(await page.evaluate(()=>window.__phase17525)));
await context.close();await browser.close();
