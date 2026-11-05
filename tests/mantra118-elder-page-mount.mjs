import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const base='https://earthlinedevelopment.org/';
await page.route(base+'**',route=>{
  const p=new URL(route.request().url()).pathname;
  if(p==='/'||p==='/index.html')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:readFileSync('index.html')});
  if(p==='/earthline-elder-restored-17097.js')return route.fulfill({status:200,contentType:'application/javascript',body:readFileSync('earthline-elder-restored-17097.js')});
  return route.continue();
});
try{
  await page.goto(base+'?m118_elder_mount='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.EARTHLINE_ELDER_TREES_V1_17097,null,{timeout:45000});
  const info=await page.evaluate(()=>({
     mounted:!!window.EARTHLINE_ELDER_TREES_V1_17097,
     source:window.EARTHLINE_ELDER_TREES_V1_17097?.source,
     loadErrors:window.EARTHLINE_ELDER_TREES_V1_17097?.state?.load_errors??null,
     reportMethod:typeof window.EARTHLINE_ELDER_TREES_V1_17097?.summary,
     propertyMethod:typeof window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty,
     rechargeWeight:window.EARTHLINE_ELDER_TREES_V1_17097?.rechargeWeight
  }));
  assert.ok(info.mounted,'Elder controller did not mount');
  assert.equal(info.source,'earthline-elder-trees-17097');
  assert.equal(info.propertyMethod,'function');
  assert.equal(info.rechargeWeight,0);
  console.log('M118_ELDER_ACTUAL_PAGE_MOUNT_PASS',JSON.stringify(info),JSON.stringify(errors.slice(0,8)));
}catch(e){
  console.error('M118_ELDER_ACTUAL_PAGE_MOUNT_FAIL',String(e?.stack||e),JSON.stringify(errors.slice(0,8)));
  process.exitCode=1;
}finally{await browser.close();}
