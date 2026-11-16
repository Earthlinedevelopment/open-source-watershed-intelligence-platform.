import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const browser = await chromium.launch({headless:true});
const ctx = await browser.newContext({viewport:{width:1600,height:950}});
const page=await ctx.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/earthline-elder-restored-17097.js*', async route=>{
  await route.fulfill({status:200, contentType:'application/javascript',body:readFileSync('earthline-elder-restored-17097.js')});
});
try {
  await page.goto('https://earthlinedevelopment.org/?elder_info_candidate=1',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:25000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput');i.value='Arizona';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click()});
  await page.waitForFunction(()=>Number(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated||0)>0,null,{timeout:90000});
  const target={lng:-111.93456,lat:34.21545};
  const prep=await page.evaluate(async target=>{
    const site=window.earthlineSelectedSiteFromCenter?.(M?.loc||null,target.lng,target.lat,20);
    if(!site)return false;
    if(!await window.applyLocation?.(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))return false;
    await new Promise(r=>setTimeout(r,800));
    return !!window.earthlineSetPropertyTarget16201?.({lng:target.lng,lat:target.lat,source:'elder-info-test'},{openPanel:false});
  },target);
  if(!prep)throw Error('Property location preparation failed');
  await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169?.());
  await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed'&&Number(window.EARTHLINE_ELDER_TREE_LAST_17097?.featureCount||0)>0,null,{timeout:100000});
  const info=page.locator('.earthline-elder-info-m11');
  await info.waitFor({state:'visible',timeout:15000});
  const link=info.locator('a[href="#swales-explained"]');
  if(!await link.isVisible())throw Error('Icon-anchored Swales Explained link missing');
  if((await link.innerText()).trim()!=='ⓘ What are Elder Trees?')throw Error('Help wording changed');
  const loc=await info.boundingBox();
  if(!loc||loc.x>1500||loc.y>900)throw Error('Elder help outside visible viewport');
  await page.waitForTimeout(11000);
  if(await info.count())throw Error('10-second Elder help did not disappear');
  await page.evaluate(()=>window.EARTHLINE_ELDER_TREES_V1_17097?.refresh?.());
  if(await info.count())throw Error('Elder help appeared more than once per visit');
  console.log('EARTHLINE_ELDER_INFO_BUBBLE_PASS',JSON.stringify({features:await page.evaluate(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.featureCount),errors}));
  if(errors.length)throw Error('Browser JavaScript errors: '+errors.slice(0,5).join('; '));
}finally {await browser.close();}
