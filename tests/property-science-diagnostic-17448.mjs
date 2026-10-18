import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const sites=[
  {name:'A',lat:44.06957,lng:-72.27369},
  {name:'B',lat:44.08580,lng:-72.28020}
];
const rows=[];

await page.goto(BASE+'?propertyScienceDiag17448='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn');
if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});

for(const site of sites){
  await page.evaluate(async s=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(mp?.jumpTo)mp.jumpTo({center:[s.lng,s.lat],zoom:16.4,bearing:0,pitch:0});
    if(typeof window.earthlineSetPropertyTarget16201==='function'){
      window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'science-diag-17448',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
    }else window.EARTHLINE_PROPERTY_TARGET_16201={lng:s.lng,lat:s.lat,source:'science-diag-17448',code:'',score:0,at:new Date().toISOString()};
  },site);
  await page.waitForTimeout(400);
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.evaluate(async()=>{await window.earthlineDeclarePropertyAtCrosshair16173()});
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre&&a?.settled===true;
  },before,{timeout:120000,polling:100});
  await page.waitForTimeout(800);

  const snap=await page.evaluate(()=>{
    const m=(typeof M!=='undefined'?M:null);
    const safe=m?.authoritativeSafeSwales15815?.features||[];
    const raw=Array.isArray(m?.swales)?m.swales:[];
    const boundary=Array.isArray(m?.analysisBoundaryLngLat)?m.analysisBoundaryLngLat:[];
    const xs=boundary.map(p=>Number(p?.[0])).filter(Number.isFinite),ys=boundary.map(p=>Number(p?.[1])).filter(Number.isFinite);
    const bbox=xs.length&&ys.length?{minx:Math.min(...xs),maxx:Math.max(...xs),miny:Math.min(...ys),maxy:Math.max(...ys)}:null;
    const cellCounts={};
    const angleCounts={};
    const midpoint=f=>{
      const g=f?.geometry;
      const c=g?.type==='LineString'?g.coordinates:(g?.type==='MultiLineString'?(g.coordinates?.[0]||[]):[]);
      if(!Array.isArray(c)||c.length<2)return null;
      const p=c[Math.floor((c.length-1)/2)];
      return Array.isArray(p)?[Number(p[0]),Number(p[1])]:null;
    };
    const angle=f=>{
      const g=f?.geometry;
      const c=g?.type==='LineString'?g.coordinates:(g?.type==='MultiLineString'?(g.coordinates?.[0]||[]):[]);
      if(!Array.isArray(c)||c.length<2)return null;
      const a=c[0],b=c[c.length-1];
      let d=Math.atan2(Number(b[1])-Number(a[1]),Number(b[0])-Number(a[0]))*180/Math.PI;
      d=((d%180)+180)%180;
      return Math.round(d/10)*10;
    };
    for(const f of safe){
      const p=midpoint(f);
      if(p&&bbox){
        const fx=Math.max(0,Math.min(4,Math.floor((p[0]-bbox.minx)/Math.max(1e-12,bbox.maxx-bbox.minx)*5)));
        const fy=Math.max(0,Math.min(4,Math.floor((p[1]-bbox.miny)/Math.max(1e-12,bbox.maxy-bbox.miny)*5)));
        const k=fx+','+fy;cellCounts[k]=(cellCounts[k]||0)+1;
      }
      const a=angle(f); if(a!=null)angleCounts[a]=(angleCounts[a]||0)+1;
    }
    const counts=Object.values(cellCounts);
    const emptyCells=25-Object.keys(cellCounts).length;
    return {
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      capacity:window.EARTHLINE_SUPPORTED_CAPACITY_16843||null,
      rawCount:raw.length,
      safeCount:safe.length,
      publication:m?.propertyPublication15816||null,
      cellCounts,occupiedCells:Object.keys(cellCounts).length,emptyCells,
      maxCell:counts.length?Math.max(...counts):0,
      meanOccupied:counts.length?counts.reduce((a,b)=>a+b,0)/counts.length:0,
      angleCounts,
      spacingStats:m?.spacingStats||null,
      boundary
    };
  });
  rows.push({site,...snap});
  console.log('EARTHLINE_PROPERTY_SCIENCE_DIAG_17448 '+JSON.stringify({site,rawCount:snap.rawCount,safeCount:snap.safeCount,capacity:snap.capacity,occupiedCells:snap.occupiedCells,emptyCells:snap.emptyCells,maxCell:snap.maxCell,meanOccupied:snap.meanOccupied,cellCounts:snap.cellCounts,angleCounts:snap.angleCounts,spacingStats:snap.spacingStats}));
}
console.log('EARTHLINE_PROPERTY_SCIENCE_DIAG_17448_SUMMARY '+JSON.stringify(rows.map(r=>({site:r.site,rawCount:r.rawCount,safeCount:r.safeCount,occupiedCells:r.occupiedCells,emptyCells:r.emptyCells,maxCell:r.maxCell,meanOccupied:r.meanOccupied,capacity:r.capacity}))));
await browser.close();
