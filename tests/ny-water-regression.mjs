import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/lab.html';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
const host=await page.waitForSelector('#earthline-lab-frame',{timeout:20000});
const frame=await host.contentFrame();if(!frame)throw new Error('lab iframe unavailable');
await frame.waitForSelector('#searchInput',{timeout:30000});
await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
const d=await frame.evaluate(()=>{
  const needles=['official vermont boundary','propertyjurisdiction16516','vcgi','16233','16236'];
  const matches=[];
  for(const k of Object.keys(window)){
    let v;try{v=window[k]}catch(_){continue}if(typeof v!=='function')continue;
    let s;try{s=String(v)}catch(_){continue};const low=s.toLowerCase();
    if(needles.some(n=>low.includes(n)))matches.push({name:k,source:s.slice(0,18000)});
  }
  return {matches};
});
console.log('EARTHLINE_JURISDICTION_OWNER '+JSON.stringify(d));
await browser.close();process.exitCode=1;
