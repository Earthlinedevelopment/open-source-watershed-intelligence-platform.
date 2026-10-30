// rerun with complete Elder assets
import {chromium} from 'playwright';
import fs from 'node:fs';
import {applyElderRestore} from './mantra83-elder-transform.mjs';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));

await page.route('https://earthlinedevelopment.org/**',async route=>{
  const url=new URL(route.request().url());
  const path=url.pathname.replace(/^\//,'');
  if(path==='earthline-elder-runtime-17097.js'){
    return route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(path,'utf8')});
  }
  if(path==='earthline-elder-worker-17129.js'){
    return route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(path,'utf8')});
  }
  if(path.startsWith('data/elder-trees/')){
    if(!fs.existsSync(path))return route.fulfill({status:404,body:'not found'});
    const type=path.endsWith('.json')?'application/json':'application/geo+json';
    return route.fulfill({status:200,contentType:type,body:fs.readFileSync(path,'utf8')});
  }
  if(url.pathname==='/'||url.pathname==='/index.html'){
    const response=await route.fetch();
    const body=applyElderRestore(await response.text());
    return route.fulfill({response,body});
  }
  return route.continue();
});

await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(2500);
if(!await page.evaluate(()=>!!window.EARTHLINE_ELDER_TREES_V1_17097)){
  await page.addScriptTag({content:fs.readFileSync('earthline-elder-runtime-17097.js','utf8')});
}
await page.waitForFunction(()=>!!window.EARTHLINE_ELDER_TREES_V1_17097,{timeout:30000});
await page.locator('#searchInput').fill('61 Sleepy Hollow Rd Essex Vermont');
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
  return !!d&&String(d.tier||d.mode||'').toLowerCase()==='property';
},{timeout:180000});
await page.waitForTimeout(1200);
try{await page.evaluate(()=>window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.())}catch(_){}
await page.waitForFunction(()=>{
  const api=window.EARTHLINE_ELDER_TREES_V1_17097;
  const last=window.EARTHLINE_ELDER_TREE_LAST_17097;
  return !!api&&(api.features?.().length>0||last?.state==='property-committed'||last?.summary);
},{timeout:120000});

const out=await page.evaluate(()=>{
  const api=window.EARTHLINE_ELDER_TREES_V1_17097;
  const last=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
  const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  const decl=window.EARTHLINE_PROPERTY_DECLARATION_16169||null;
  const source=window.earthlineMap?.getSource?.('earthline-elder-trees-17097')||null;
  const layer=window.earthlineMap?.getLayer?.('earthline-elder-tree-points-17097')||null;
  const features=api?.features?.()||[];
  return {
    featureCount:features.length,
    summary:api?.summary?.()||null,
    last,
    target:target?{lat:Number(target.lat),lng:Number(target.lng)}:null,
    declaration:decl?.center||null,
    source:!!source,layer:!!layer,
    rechargeWeight:api?.rechargeWeight,
    confidenceRule:api?.confidenceRule||null
  };
});
const failures=[];
if(!out.source||!out.layer)failures.push('Elder source/layer missing');
if(out.rechargeWeight!==0)failures.push('Elder recharge weight not zero');
if(!out.last)failures.push('Elder terminal state missing');
if(!out.summary)failures.push('Elder summary missing');
if(errors.length)failures.push('page errors '+JSON.stringify(errors.slice(0,6)));

console.log('M83_ELDER_RESTORE_CANDIDATE '+JSON.stringify({out,failures,errors:errors.slice(0,8)}));
if(failures.length)process.exitCode=2;
await browser.close();
