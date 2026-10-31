import {chromium,webkit,devices} from 'playwright';

const name=process.env.CLIENT||'desktop-chromium';
let browserType=chromium,context={viewport:{width:1440,height:900}};
if(name==='desktop-webkit'){browserType=webkit;context={viewport:{width:1440,height:900}};}
if(name==='iphone-webkit'){browserType=webkit;context={...devices['iPhone 13']};}
if(name==='pixel-chromium'){browserType=chromium;context={...devices['Pixel 7']};}

const browser=await browserType.launch({headless:true});
const ctx=await browser.newContext(context);
const page=await ctx.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1400);
const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
await page.locator('#searchInput').fill('Vermont');
const t0=Date.now();
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(prev=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
  return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
},before,{timeout:60000});
await page.waitForTimeout(400);
const result=await page.evaluate(t0=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
 return {
  ms:Date.now()-t0,
  tier:String(d?.tier||d?.mode||''),
  swales:Number(d?.derived?.swaleOpportunityLines||0),
  rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length
 };
},t0);
console.log('M83_CLIENT_SMOKE '+JSON.stringify({name,result,errors}));
if(String(result.tier).toLowerCase()!=='regional'||result.swales<=0||result.rendered<=0)process.exitCode=2;
await browser.close();
