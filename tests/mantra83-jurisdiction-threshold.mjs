import {chromium} from 'playwright';
import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('system Chrome missing');

const OLD=`    async function jurisdictionEligibleCount16539(list16539){
      if(focusMode||!jurisdictionGeometry16539)return list16539.length;
      let count16539=0,yieldCount16661=0;
      for(const candidate16539 of list16539){if(screenJurisdictionCandidate16539(candidate16539))count16539++;if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();}
      return count16539;
    }`;
const NEW=`    async function jurisdictionEligibleCount16539(list16539){
      if(focusMode||!jurisdictionGeometry16539)return list16539.length;
      let count16539=0,yieldCount16661=0;
      for(const candidate16539 of list16539){
        if(screenJurisdictionCandidate16539(candidate16539)&&++count16539>=36)return 36;
        if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();
      }
      return count16539;
    }`;

function signature(fs){
  return (fs||[]).map(f=>JSON.stringify({
    g:f.geometry,
    p:{slope_pct:f.properties?.slope_pct,score:f.properties?.score,rank:f.properties?.rank}
  })).sort();
}
async function run(modified){
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  if(modified)await page.route('https://earthlinedevelopment.org/',async route=>{
    const res=await route.fetch();let body=await res.text();
    if(!body.includes(OLD))throw new Error('live jurisdiction owner missing');
    body=body.replace(OLD,NEW);
    await route.fulfill({response:res,body});
  });
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(900);
  const out={};
  for(const q of ['Vermont','Arizona']){
    const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
    await page.locator('#searchInput').fill(q);
    const t0=Date.now();
    await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
    await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
    await page.waitForTimeout(200);
    const row=await page.evaluate(t0=>({ms:Date.now()-t0,features:window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]}),t0);
    out[q]={ms:row.ms,sig:signature(row.features),count:row.features.length};
  }
  await browser.close();return out;
}
const base=await run(false),candidate=await run(true);
for(const q of ['Vermont','Arizona']){
  if(JSON.stringify(base[q].sig)!==JSON.stringify(candidate[q].sig))throw new Error(q+' output changed');
}
console.log('M83_JURISDICTION_THRESHOLD_PASS '+JSON.stringify({
  Vermont:{beforeMs:base.Vermont.ms,afterMs:candidate.Vermont.ms,count:candidate.Vermont.count},
  Arizona:{beforeMs:base.Arizona.ms,afterMs:candidate.Arizona.ms,count:candidate.Arizona.count}
}));
