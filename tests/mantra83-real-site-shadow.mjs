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

// Drive one real Regional analysis through the actual live control.
const input=page.locator('#searchInput');
await input.fill('Rutland, Vermont');
const btn=page.locator('#earthlineMapRun16020:visible,#earthlineMapRun15970:visible').first();
if(await btn.count()) await btn.click();
else await page.evaluate(()=>{ if(typeof window.earthlineRunAnalysis==='function') return window.earthlineRunAnalysis({preventDefault(){},stopPropagation(){}}); });
await page.waitForFunction(()=>!!(window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147),{timeout:120000});
await page.waitForTimeout(3000);
const result=await page.evaluate(()=>{
  const displayed=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const rows=window.EARTHLINE_MANTRA83_SHADOW.rows();
  return {
    displayed:displayed?{runToken:displayed.runToken,tier:displayed.tier||displayed.mode,query:displayed.query,derived:displayed.derived}:null,
    shadowRows:rows.length,
    shadowLast:rows[rows.length-1]||null,
    rendered:{
      overlayExists:!!document.getElementById('earthlineRegionalVectorOverlay16020'),
      swalePaths:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
      contourPaths:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="numbered-elevation-contours"] path').length,
      labelNodes:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="always-visible-labels"] *').length
    }
  };
});
if(!result.displayed)throw new Error('real run did not publish');
if(result.shadowRows<1)throw new Error('shadow observer missed real publication');
if(result.shadowLast.identityUnchanged!==true)throw new Error('shadow observer altered publication');
if(!result.rendered.overlayExists)throw new Error('Regional SVG owner missing');
if(result.rendered.swalePaths<1)throw new Error('Regional swales published but SVG owner rendered none');
if(result.rendered.contourPaths<1)throw new Error('Regional contours published but SVG owner rendered none');

console.log('M83_REAL_SITE_SHADOW_PASS '+JSON.stringify(result));
if(errors.length)console.log('M83_REAL_SITE_PAGE_ERRORS '+JSON.stringify(errors.slice(0,20)));
await browser.close();
