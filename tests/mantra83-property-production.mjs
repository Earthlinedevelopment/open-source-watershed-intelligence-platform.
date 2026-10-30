import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(2500);

async function run(q){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    const st=String(document.documentElement.dataset.earthlineRunState||'');
    return !!d&&String(d.runToken||'')!==String(prev||'')&&(st==='published'||String(d.tier||d.mode||'').toLowerCase()==='property');
  },before,{timeout:180000});
  await page.waitForTimeout(1800);
  return await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const m=(typeof M!=='undefined'&&M)||window.M||null;
    const safe=m?.authoritativeSafeSwales15815||m?.swales||[];
    let maxSlope=-Infinity,minSlope=Infinity;
    for(const s of safe){
      const candidates=[s?.slopePct,s?.slope_pct,s?.slope,s?.meanSlope,s?.avgSlope,s?.maxSlope];
      for(const v of candidates){const n=Number(v);if(Number.isFinite(n)){maxSlope=Math.max(maxSlope,n);minSlope=Math.min(minSlope,n);}}
    }
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const pub=m?.propertyPublication15816||null;
    const visibleSwales=document.querySelectorAll('[data-layer="swale-opportunities"] path,#earthlinePropertySwaleOverlay path,.earthline-swale-band-16168').length;
    const waterPaths=document.querySelectorAll('#earthlinePropertyWaterOverlay15824 path').length;
    return {
      displayed:{runToken:d?.runToken||null,tier:d?.tier||d?.mode||null,query:d?.query||null},
      target:target?{lat:Number(target.lat),lng:Number(target.lng),query:target.query||null}:null,
      model:{lat:Number(m?.centerLat),lng:Number(m?.centerLng),analysisReady:!!m?.analysisReady,swales:Array.isArray(m?.swales)?m.swales.length:0,safeSwales:Array.isArray(safe)?safe.length:0},
      publication:pub?{committed:pub.committed===true,published:pub.published===true,safeCount:Number(pub.safeCount||0),raw:Number(pub.rawGeographicSegments||0),searchGen:Number(pub.searchGen)}:null,
      slope:{max:Number.isFinite(maxSlope)?maxSlope:null,min:Number.isFinite(minSlope)?minSlope:null},
      visibleSwales,waterPaths,
      runState:String(document.documentElement.dataset.earthlineRunState||''),
      propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||'')
    };
  });
}

const results=[];
results.push(await run('61 Sleepy Hollow Rd Essex Vermont'));
results.push(await run('61 Sleepy Hollow Rd Essex Vermont'));
results.push(await run('Vermont'));
results.push(await run('61 Sleepy Hollow Rd Essex Vermont'));

const propertyResults=results.filter(r=>String(r.displayed?.tier||'').toLowerCase()==='property');
const failures=[];
for(const [i,r] of propertyResults.entries()){
  if(!r.target||Math.abs(r.target.lat-44.513845)>.002||Math.abs(r.target.lng-(-73.012909))>.002)failures.push('property '+i+' target mismatch');
  if(!r.model.analysisReady)failures.push('property '+i+' analysis not ready');
  if(!(r.model.safeSwales>0))failures.push('property '+i+' zero safe swales');
  if(r.slope.max!==null&&r.slope.max>4)failures.push('property '+i+' max slope '+r.slope.max);
  if(r.publication&&r.publication.committed!==true&&r.publication.published!==true)failures.push('property '+i+' publication not committed');
}
if(String(results[2].displayed?.tier||'').toLowerCase()!=='regional')failures.push('regional transition failed');
const jsonp=pageErrors.filter(e=>e.includes('__earthlineVtInfra'));
if(jsonp.length)failures.push('late Vermont JSONP errors');

console.log('M83_PROPERTY_PRODUCTION '+JSON.stringify({results,failures,pageErrors:pageErrors.slice(0,20)}));
if(failures.length)process.exitCode=2;
await browser.close();
