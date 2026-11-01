import {chromium,webkit,devices} from 'playwright';
const OLD="const visited16786=new Set();\n        for(let idx=3;idx<coords.length-3;idx++){";
const NEW="const visited16786=new Set(),step16786=Math.max(1,Math.floor(Math.max(1,coords.length-6)/48));\n        for(let idx=3;idx<coords.length-3;idx+=step16786){";
async function one(browserType,label,context={}){
 const browser=await browserType.launch({headless:true});const ctx=await browser.newContext(context);const page=await ctx.newPage();
 await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();let body=await res.text();if(!body.includes(OLD))throw new Error('anchor loop owner missing');body=body.replace(OLD,NEW);await route.fulfill({response:res,body});});
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForTimeout(900);await page.locator('#searchInput').fill('Vermont');const t0=Date.now();
 await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
 await page.waitForFunction(()=>String(document.documentElement.dataset.earthlineRunState||'')==='published',{timeout:120000});await page.waitForTimeout(200);
 const out=await page.evaluate(t0=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147,fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return{ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Math.max(0,...fs.map(f=>Number(f?.properties?.slope_pct)||0))};},t0);
 await browser.close();if(out.swales<70||out.rendered<280||out.maxSlope>4)throw new Error(label+' output regression '+JSON.stringify(out));return{label,...out};
}
const rows=[];rows.push(await one(chromium,'desktop-chromium',{viewport:{width:1440,height:900}}));rows.push(await one(webkit,'desktop-webkit',{viewport:{width:1440,height:900}}));rows.push(await one(webkit,'iphone-webkit',{...devices['iPhone 13']}));
console.log('M83_ANCHOR_STRIDE_PASS '+JSON.stringify(rows));