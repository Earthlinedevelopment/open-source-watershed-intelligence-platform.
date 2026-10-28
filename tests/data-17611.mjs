import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { resolve,extname } from 'node:path';
const root=process.cwd(),origin='https://earthlinedevelopment.org';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.py':'text/plain; charset=utf-8'};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1500,height:900},serviceWorkers:'block'});
await context.route(origin+'/**',async route=>{const u=new URL(route.request().url()),p=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html',f=resolve(root,p);if(f.startsWith(root)&&existsSync(f))return route.fulfill({status:200,path:f,contentType:mime[extname(f)]||'application/octet-stream',headers:{'cache-control':'no-store'}});return route.continue();});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(origin+'/?data17611='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Arizona');await page.waitForTimeout(650);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();if(await opt.count())await opt.click().catch(()=>{});
const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.evaluate(b=>b.dataset.busy==='1'||b.disabled))await rb.click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:120000,polling:120});
await page.waitForTimeout(500);
const gauge=await page.evaluate(()=>{
 const label=document.querySelector('.earthline-recharge-gauge-label-16488')?.textContent?.trim()||'';
 const value=document.getElementById('earthlineRechargePotentialValue16488')?.textContent?.trim()||'';
 const n=Number(value);
 return {label,value,n,hasPercent:value.includes('%'),aria:document.querySelector('.earthline-recharge-gauge-ring-16488')?.getAttribute('aria-label')||''};
});
const btn=page.locator('#earthlineRailData16488');await btn.click();await page.waitForTimeout(200);
const data=await page.evaluate(()=>{
 const txt=String(document.getElementById('earthlineRechargeDataContent16488')?.innerText||'').replace(/\s+/g,' ').trim();
 return {txt,
  groundwater:/Groundwater evidence[\s\S]*× 0\.30/i.test(txt),
  soil:/Soil infiltration[\s\S]*× 0\.20/i.test(txt),
  slope:/Slope[\s\S]*× 0\.18/i.test(txt),
  flow:/Flow[\s\S]*× 0\.17/i.test(txt),
  canopy:/Canopy evidence[\s\S]*not available[\s\S]*× 0\.00/i.test(txt),
  noInvent:/does not invent canopy evidence/i.test(txt),
  rainfall:/Average yearly rainfall:/i.test(txt),
  formula:/Groundwater evidence × 0\.30[\s\S]*Canopy × 0\.00/i.test(txt),
  coverage:/Regional recharge score uses|fine-scale mapped aquifer|No fine-scale mapped aquifer/i.test(txt)
 };
});
const lang=await page.evaluate(()=>{const s=document.getElementById('earthlineLanguage16488')||document.querySelector('#earthlineRail16188 select');return s?[...s.options].map(o=>String(o.value)+'|'+String(o.textContent)):[]});
const pass=gauge.label==='Recharge Suitability'&&Number.isFinite(gauge.n)&&gauge.n>=0&&gauge.n<=100&&!gauge.hasPercent&&data.groundwater&&data.soil&&data.slope&&data.flow&&data.canopy&&data.noInvent&&data.rainfall&&data.formula&&data.coverage&&lang.some(x=>/^vi\|/i.test(x))&&!errors.length;
console.log('EARTHLINE_DATA_17611 '+JSON.stringify({pass,gauge,data,lang,errors}));
await browser.close();
if(!pass)process.exitCode=1;
