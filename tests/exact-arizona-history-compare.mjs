import { chromium } from 'playwright';
import fs from 'fs';
import { execSync } from 'child_process';

const TARGET={lng:-111.93331,lat:34.21526};
const VERSIONS=[
  ['preM79','4146c7f7798527b7df65df149cb39ed28aa6b4a0'],
  ['fourPct','8edc226dfd1e9525c8b889bd39b06e1c8c4df61f'],
  ['eligibleSlope','48f02d2ea3cb52439e9f185267e5857068342ba4'],
  ['current','HEAD']
];

for(const [name,ref] of VERSIONS){
  const html=execSync(ref==='HEAD'?'cat index.html':`git show ${ref}:index.html`,{maxBuffer:20*1024*1024}).toString();
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1798,height:831}});
  const page=await context.newPage();
  let fulfilled=false;
  await page.route('https://earthlinedevelopment.org/**',async route=>{
    const req=route.request();
    if(!fulfilled && req.resourceType()==='document'){
      fulfilled=true;
      await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
    } else await route.continue();
  });
  try{
    await page.goto('https://earthlinedevelopment.org/?exact_az_compare='+name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.locator('#searchInput').fill('Arizona');
    await page.waitForTimeout(800);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
    if(await opt.count())await opt.click({timeout:10000}).catch(()=>{});
    await page.evaluate(()=>document.getElementById('runBtn')?.click());
    await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:60000,polling:150});
    const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
    await page.evaluate(t=>{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      m.jumpTo({center:[t.lng,t.lat],zoom:16.59}); try{m.fire?.('dragend')}catch(_){}
    },TARGET);
    await page.waitForTimeout(500);
    await page.locator('#earthlineDeclareProperty16169').click({timeout:10000});
    await page.waitForFunction(prev=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return !!a&&Number(a.serial||0)>prev&&a.settled===true},before,{timeout:90000,polling:120});
    await page.waitForTimeout(1200);
    const out=await page.evaluate(()=>{
      const md=(typeof M!=='undefined'&&M)||window.M||{};
      return {
        run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
        publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
        swales:Number(md.authoritativeSafeSwales15815?.features?.length||0),
        raw:Number(md.authoritativePropertySwales15800?.features?.length||0),
        slopeSafePct:Number(md.swaleDiagnostics?.slopeSafePct),
        usablePct:Number(md.swaleDiagnostics?.usablePct),
        traceSafeCells:Number(md.earthlineTraceSafeCache16320?.safeCells),
        traceMaxS:Number(md.earthlineTraceSafeCache16320?.maxS),
        eligiblePaths:Number(md.flowFirstPlacement15836?.eligiblePaths||0),
        pathsServed:Number(md.flowFirstPlacement15836?.pathsServed||0),
        meta:md.swaleMeta||null
      };
    });
    console.log('EARTHLINE_EXACT_AZ_HISTORY '+JSON.stringify({name,ref,out}));
  }catch(err){
    console.log('EARTHLINE_EXACT_AZ_HISTORY '+JSON.stringify({name,ref,error:String(err&&err.message||err)}));
  }
  await browser.close();
}
