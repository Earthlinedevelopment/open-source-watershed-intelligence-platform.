import {chromium} from 'playwright';
import fs from 'node:fs';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(4000);

// Verify canonical publication API exists on the real site.
const base=await page.evaluate(()=>({
  publish:typeof window.earthlinePublishDisplayedRun16151,
  run:typeof window.earthlineRunAnalysis,
  regional:typeof window.earthlineLiveRegionalRun15970,
  displayed:!!(window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)
}));
if(base.publish!=='function')throw new Error('canonical publication owner missing on real site');

// Inject observer only, exactly as candidate uses it.
await page.addScriptTag({content:fs.readFileSync('shadow/mantra83-shadow-live.js','utf8')});
const installed=await page.evaluate(()=>!!window.EARTHLINE_MANTRA83_SHADOW);
if(!installed)throw new Error('shadow observer failed to install');

// Drive one real Regional analysis through the live controller when available.
const result=await page.evaluate(async()=>{
  const q='Rutland, Vermont';
  const input=document.getElementById('searchInput');
  if(input){input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));}
  let out=null;
  if(typeof window.earthlineLiveRegionalRun15970==='function')out=await window.earthlineLiveRegionalRun15970(q);
  else if(typeof window.earthlineRunAnalysis==='function')out=await window.earthlineRunAnalysis();
  await new Promise(r=>setTimeout(r,3000));
  const displayed=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const rows=window.EARTHLINE_MANTRA83_SHADOW.rows();
  return {
    outType:typeof out,
    displayed:displayed?{runToken:displayed.runToken,tier:displayed.tier||displayed.mode,query:displayed.query,derived:displayed.derived}:null,
    shadowRows:rows.length,
    shadowLast:rows[rows.length-1]||null
  };
});
if(!result.displayed)throw new Error('real run did not publish');
if(result.shadowRows<1)throw new Error('shadow observer missed real publication');
if(result.shadowLast.identityUnchanged!==true)throw new Error('shadow observer altered publication');

console.log('M83_REAL_SITE_SHADOW_PASS '+JSON.stringify(result));
if(errors.length)console.log('M83_REAL_SITE_PAGE_ERRORS '+JSON.stringify(errors.slice(0,20)));
await browser.close();
