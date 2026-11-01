import {chromium} from 'playwright';
import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('system Chrome missing');
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(700);
const out={};
for(const q of ['California','Texas','Arizona','Vermont']){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
  await page.waitForTimeout(100);
  out[q]=await page.evaluate(()=>{
    const keys=Object.keys(window).filter(k=>/16839|16788|16741|16730|16702|SWALE_GENERATION|SPATIAL_ANCHOR/i.test(k));
    const vals={};
    for(const k of keys){try{const v=window[k];if(v==null||typeof v==='function')continue;vals[k]=v}catch(_){}}
    return vals;
  });
}
console.log('M83_GAP_PHASE_AUDIT '+JSON.stringify(out));
await browser.close();
