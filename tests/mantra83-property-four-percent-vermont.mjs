import {chromium} from 'playwright';
const REPS=[
['const thr=streamThreshold(),chanThr=thr*3.2,maxS=33;','const thr=streamThreshold(),chanThr=thr*3.2,maxS=4;'],
['return earthlinePathPointUsable(gx,gy,33)?q:p;','return earthlinePathPointUsable(gx,gy,4)?q:p;'],
['function earthlineFinalSafeSegments15771(pts,maxS=33){','function earthlineFinalSafeSegments15771(pts,maxS=4){'],
['earthlineSplitUsableSegments(s.pts,33)','earthlineSplitUsableSegments(s.pts,4)'],
['earthlineFinalSafeSegments15771(displaySeg,33)','earthlineFinalSafeSegments15771(displaySeg,4)']
];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.route('https://earthlinedevelopment.org/',async route=>{
 const response=await route.fetch();let body=await response.text();
 for(const [a,b] of REPS) body=body.split(a).join(b);
 await route.fulfill({response,body});
});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1500);
await page.locator('#searchInput').fill('61 Sleepy Hollow Rd Essex Vermont');
await page.locator('#runBtn').click();
await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||'').toLowerCase()==='property',{timeout:180000});
await page.waitForTimeout(800);
const out=await page.evaluate(()=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
 const fc=M?.authoritativeSafeSwales15815;
 const n=Array.isArray(fc?.features)?fc.features.length:0;
 const spacing=M?.spacingStats||null;
 return {query:d?.query,tier:d?.tier||d?.mode,safe:n,engine:Array.isArray(M?.swales)?M.swales.length:0,spacing,target:window.EARTHLINE_PROPERTY_TARGET_16201,pub:M?.propertyPublication15816};
});
const failures=[];
if(String(out.tier).toLowerCase()!=='property')failures.push('not property');
if(!(out.safe>0))failures.push('zero safe swales');
if(!out.pub?.committed)failures.push('not committed');
console.log('M83_PROPERTY_4_VT_CONTROL '+JSON.stringify({out,failures}));
if(failures.length)process.exitCode=2;
await browser.close();