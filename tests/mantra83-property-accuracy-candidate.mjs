import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';

const FIX=readFileSync('tests/mantra83-fix-property-four-percent.mjs','utf8');
const reps=[
  ['const thr=streamThreshold(),chanThr=thr*3.2,maxS=33;','const thr=streamThreshold(),chanThr=thr*3.2,maxS=4;'],
  ['return earthlinePathPointUsable(gx,gy,33)?q:p;','return earthlinePathPointUsable(gx,gy,4)?q:p;'],
  ['function earthlineFinalSafeSegments15771(pts,maxS=33){','function earthlineFinalSafeSegments15771(pts,maxS=4){'],
  ['earthlineSplitUsableSegments(s.pts,33)','earthlineSplitUsableSegments(s.pts,4)'],
  ['earthlineFinalSafeSegments15771(displaySeg,33)','earthlineFinalSafeSegments15771(displaySeg,4)']
];

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.route('https://earthlinedevelopment.org/',async route=>{
  const response=await route.fetch();
  let body=await response.text();
  for(const [old,neu] of reps){
    if(body.includes(old))body=body.replaceAll(old,neu);
  }
  await route.fulfill({response,body});
});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(2500);

async function run(q){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(d.tier||d.mode||'').toLowerCase()==='property';
  },before,{timeout:180000});
  await page.waitForTimeout(1500);
  return await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const m=(typeof M!=='undefined'&&M)||window.M||null;
    const safeRaw=m?.authoritativeSafeSwales15815||m?.swales||[];
    const safe=Array.isArray(safeRaw)?safeRaw:(safeRaw?.features||[]);
    let max=-Infinity;
    for(const s of safe){
      for(const v of [s?.slopePct,s?.slope_pct,s?.slope,s?.meanSlope,s?.avgSlope,s?.maxSlope,s?.properties?.slope_pct]){
        const n=Number(v);if(Number.isFinite(n))max=Math.max(max,n);
      }
    }
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const pub=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||m?.propertyPublication15816||null;
    return {
      runToken:d?.runToken||null,
      target:target?{lat:Number(target.lat),lng:Number(target.lng)}:null,
      center:{lat:Number(m?.centerLat),lng:Number(m?.centerLng)},
      swales:Array.isArray(m?.swales)?m.swales.length:0,
      safeSwales:safe.length,
      maxSlope:Number.isFinite(max)?max:null,
      analysisReady:!!m?.analysisReady,
      publication:pub,
      visible:{
        mapbox:document.querySelectorAll('canvas.mapboxgl-canvas').length,
        propertyPaths:document.querySelectorAll('#earthlinePropertyWaterOverlay15824 path,#earthlinePropertySwaleOverlay path,.earthline-swale-band-16168').length
      }
    };
  });
}

const results=[await run('61 Sleepy Hollow Rd Essex Vermont'),await run('61 Sleepy Hollow Rd Essex Vermont')];
const failures=[];
for(const [i,r] of results.entries()){
  if(!r.target||Math.abs(r.target.lat-44.513845)>.001||Math.abs(r.target.lng+73.012909)>.001)failures.push('target '+i);
  if(Math.abs(r.center.lat-r.target.lat)>.002||Math.abs(r.center.lng-r.target.lng)>.002)failures.push('center drift '+i);
  if(!r.analysisReady)failures.push('not ready '+i);
  if(!(r.safeSwales>0))failures.push('zero safe swales '+i);
  if(r.maxSlope!==null&&r.maxSlope>4)failures.push('slope '+i+' '+r.maxSlope);
}
if(pageErrors.length)failures.push('page errors '+JSON.stringify(pageErrors.slice(0,5)));

console.log('M83_PROPERTY_ACCURACY_CANDIDATE '+JSON.stringify({results,failures}));
if(failures.length)process.exitCode=2;
await browser.close();
