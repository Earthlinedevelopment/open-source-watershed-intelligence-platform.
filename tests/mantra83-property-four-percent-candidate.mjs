import {chromium} from 'playwright';
const REPS=[
['const thr=streamThreshold(),chanThr=thr*3.2,maxS=33;','const thr=streamThreshold(),chanThr=thr*3.2,maxS=4;'],
['return earthlinePathPointUsable(gx,gy,33)?q:p;','return earthlinePathPointUsable(gx,gy,4)?q:p;'],
['function earthlineFinalSafeSegments15771(pts,maxS=33){','function earthlineFinalSafeSegments15771(pts,maxS=4){'],
['earthlineSplitUsableSegments(s.pts,33)','earthlineSplitUsableSegments(s.pts,4)'],
['earthlineFinalSafeSegments15771(displaySeg,33)','earthlineFinalSafeSegments15771(displaySeg,4)']
];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1798,height:830}});
await page.route('https://earthlinedevelopment.org/',async route=>{
 const response=await route.fetch();let body=await response.text();
 for(const [a,b] of REPS){if(!body.includes(a)&&!body.includes(b))throw new Error('owner missing '+a);body=body.split(a).join(b);}
 await route.fulfill({response,body});
});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1600);
await page.locator('#searchInput').fill('Arizona');await page.locator('#runBtn').click();
await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||'').toLowerCase()==='regional',{timeout:120000});
async function prop(lat,lng){
 const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
 await page.evaluate(({lat,lng})=>window.earthlineSetPropertyTarget16201?.({lat,lng,source:'m83-four-percent'},{openPanel:true}),{lat,lng});
 await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());
 await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return String(d?.tier||'').toLowerCase()==='property'&&String(d.runToken)!==prev;},before,{timeout:180000});
 await page.waitForTimeout(700);
 return await page.evaluate(()=>{
   const fc=M?.authoritativeSafeSwales15815;
   const features=Array.isArray(fc?.features)?fc.features:[];
   let max=-Infinity,sampled=0;
   if(typeof lngLatToGrid==='function'&&typeof slopePct==='function'){
     for(const f of features)for(const ll of (f.geometry?.coordinates||[])){
       const g=lngLatToGrid(ll[0],ll[1]);if(!g)continue;
       const v=Number(slopePct(g[0]??g.x,g[1]??g.y));if(Number.isFinite(v)){max=Math.max(max,v);sampled++;}
     }
   }
   return {safe:features.length,engine:Array.isArray(M?.swales)?M.swales.length:0,maxSlope:Number.isFinite(max)?max:null,sampled,target:window.EARTHLINE_PROPERTY_TARGET_16201,pub:M?.propertyPublication15816};
 });
}
const rows=[await prop(34.21568,-111.93067),await prop(34.21300,-111.94471)];
const failures=[];
for(const [i,r] of rows.entries()){if(!(r.safe>0))failures.push(i+' zero safe');if(r.maxSlope!==null&&r.maxSlope>4.0001)failures.push(i+' slope '+r.maxSlope);if(r.safe>40)failures.push(i+' excessive density '+r.safe);}
console.log('M83_PROPERTY_4_CANDIDATE '+JSON.stringify({rows,failures}));
if(failures.length)process.exitCode=2;
await browser.close();