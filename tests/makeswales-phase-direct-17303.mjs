import { chromium, firefox, webkit } from 'playwright';
const browserName=(process.env.BROWSER||'firefox').toLowerCase();
const launchers={chromium,firefox,webkit};
const headless=String(process.env.HEADLESS||'false').toLowerCase()!=='false';
const browser=await launchers[browserName].launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const base=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const query=process.env.STATE||'Texas';
await page.goto(base+'?makeswales17303='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(q=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  if(!i||!b)throw new Error('search controls unavailable');
  i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
},query);
try{
 await page.waitForFunction(q=>{
   const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
   const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
   return window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase()));
 },query,{timeout:90000,polling:100});
}catch(_){}
const out=await page.evaluate(()=>({
 perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
 phases:window.EARTHLINE_MAKESWALES_PHASE_17302||[],
 error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
 pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null
}));
console.log('EARTHLINE_MAKESWALES_DIRECT_17303 '+JSON.stringify({browser:browserName,query,...out}));
await browser.close();
