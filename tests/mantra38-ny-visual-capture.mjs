import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
let winner=null;
for(let attempt=1;attempt<=5&&!winner;attempt++){
  const page=await browser.newPage({viewport:{width:1800,height:1000},deviceScaleFactor:1});
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click()});
  try{await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329?.passed===true||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:50000,polling:150})}catch(_){ }
  await page.waitForTimeout(2200);
  const snap=await page.evaluate(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),s=m?.getSource?.('el-live-flows-15970'),fc=s?._data||s?._options?.data||{features:[]},flows=(fc.features||[]).filter(f=>f?.properties?.feature_type==='flow').length,status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim();return {flows,status,pre:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}});
  if(snap.flows>0&&/published/i.test(snap.status)&&!/failed/i.test(snap.status)){
    await page.screenshot({path:'ny-live.png',fullPage:false});winner={attempt,snap};await page.close();break;
  }
  await page.close();
}
console.log('MANTRA38_NY_VISUAL '+JSON.stringify({winner}));
if(!winner)process.exitCode=1;
await browser.close();
