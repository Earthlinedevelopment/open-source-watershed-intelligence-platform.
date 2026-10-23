import { chromium } from 'playwright';
import fs from 'node:fs';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?iowa-regional-audit='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});
const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);
const started=Date.now();
await page.locator('#runBtn').click({force:true});
let settled=false,timeout=null;
try{
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
    return tier==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
  },null,{timeout:120000,polling:200});
  settled=true;
}catch(e){timeout=String(e);}
await page.waitForTimeout(1200);
const data=await page.evaluate(()=>{
  const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  const spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;
  const cap=window.EARTHLINE_SUPPORTED_CAPACITY_16843||null;
  const pub=window.EARTHLINE_REGIONAL_PUBLICATION_SELECTION_17700||null;
  const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
  const sel=window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null;
  const group=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
  const paths=group?[...group.querySelectorAll('path')]:[];
  const classes={};
  for(const p of paths){for(const c of p.classList||[])classes[c]=(classes[c]||0)+1;}
  return {
    displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
    visualSwales:Array.isArray(visual?.swales?.features)?visual.swales.features.length:null,
    publication:pub,
    capacity:cap,
    spread,
    selection:sel,
    generation:gen,
    renderedPathCount:paths.length,
    renderedClasses:classes,
    overlayHTMLLength:group?.innerHTML?.length||0,
    status:document.getElementById('earthlineVermontStatus16147')?.textContent||'',
    busy:document.getElementById('runBtn')?.getAttribute('aria-busy')
  };
});
const out={settled,elapsedMs:Date.now()-started,timeout,errors,data};
fs.writeFileSync('iowa-regional-current.json',JSON.stringify(out,null,2));
await page.screenshot({path:'iowa-regional-current.png',fullPage:false});
console.log('EARTHLINE_IOWA_REGIONAL_CURRENT '+JSON.stringify(out));
await browser.close();
// trigger live regional audit
