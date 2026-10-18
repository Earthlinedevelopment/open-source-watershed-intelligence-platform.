import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const VARIANT=process.env.VARIANT||'baseline';
const sites=[
  {name:'A',lat:44.06957,lng:-72.27369},
  {name:'B',lat:44.08580,lng:-72.28020}
];
const rows=[];

await page.goto(BASE+'?propertyScience17448='+VARIANT+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn');
if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});

for(const site of sites){
  await page.evaluate(()=>{try{window.earthlineRestoreRegional16158?.('science-ab-17448')}catch(_){}});
  await page.waitForTimeout(250);
  await page.evaluate(async s=>{
    const fn=window.earthlineFocusRunEngine16158;
    if(typeof fn!=='function')throw new Error('Focus engine unavailable');
    await fn({center:{lng:s.lng,lat:s.lat},sizeM:3000,label:'Property science '+s.name});
  },site);
  await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase()==='focus',null,{timeout:120000,polling:100});
  await page.evaluate(s=>new Promise(resolve=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!mp?.jumpTo)return resolve();
    let done=false;const finish=()=>{if(done)return;done=true;resolve()};
    mp.once?.('moveend',finish);mp.jumpTo({center:[s.lng,s.lat],zoom:16.4,bearing:0,pitch:0});setTimeout(finish,1200);
  }),site);
  await page.evaluate(s=>{
    if(typeof window.earthlineSetPropertyTarget16201==='function')
      window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'science-ab-17448',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
    else window.EARTHLINE_PROPERTY_TARGET_16201={lng:s.lng,lat:s.lat,source:'science-ab-17448',code:'',score:0,at:new Date().toISOString()};
  },site);
  await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&getComputedStyle(b).display!=='none'&&!b.disabled},null,{timeout:20000,polling:100});

  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(pre=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>pre,before,{timeout:5000,polling:50});
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre&&a?.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';
  },before,{timeout:120000,polling:100});
  await page.waitForTimeout(700);

  const snap=await page.evaluate(()=>{
    const m=(typeof M!=='undefined'?M:null);
    const safe=m?.authoritativeSafeSwales15815?.features||[];
    const raw=Array.isArray(m?.swales)?m.swales:[];
    const boundary=Array.isArray(m?.analysisBoundaryLngLat)?m.analysisBoundaryLngLat:[];
    const xs=boundary.map(p=>Number(p?.[0])).filter(Number.isFinite),ys=boundary.map(p=>Number(p?.[1])).filter(Number.isFinite);
    const bbox=xs.length&&ys.length?{minx:Math.min(...xs),maxx:Math.max(...xs),miny:Math.min(...ys),maxy:Math.max(...ys)}:null;
    const cellCounts={},angles={};
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
      d=((d%180)+180)%180;return Math.round(d/10)*10;
    };
    for(const f of safe){
      const p=midpoint(f);
      if(p&&bbox){
        const fx=Math.max(0,Math.min(4,Math.floor((p[0]-bbox.minx)/Math.max(1e-12,bbox.maxx-bbox.minx)*5)));
        const fy=Math.max(0,Math.min(4,Math.floor((p[1]-bbox.miny)/Math.max(1e-12,bbox.maxy-bbox.miny)*5)));
        const k=fx+','+fy;cellCounts[k]=(cellCounts[k]||0)+1;
      }
      const a=angle(f);if(a!=null)angles[a]=(angles[a]||0)+1;
    }
    const vals=Object.values(cellCounts);
    return {
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      rawCount:raw.length,safeCount:safe.length,
      publication:m?.propertyPublication15816||null,
      selector:window.EARTHLINE_PROPERTY_SPATIAL_SELECTION_17448||null,
      capacity:window.EARTHLINE_SUPPORTED_CAPACITY_16843||null,
      spacingStats:m?.spacingStats||null,
      occupiedCells:Object.keys(cellCounts).length,
      emptyCells:25-Object.keys(cellCounts).length,
      maxCell:vals.length?Math.max(...vals):0,
      meanOccupied:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0,
      cellCounts,angles
    };
  });
  rows.push({site,...snap});
  console.log('EARTHLINE_PROPERTY_SCIENCE_AB_17448 '+JSON.stringify({
    variant:VARIANT,site,rawCount:snap.rawCount,safeCount:snap.safeCount,
    occupiedCells:snap.occupiedCells,emptyCells:snap.emptyCells,maxCell:snap.maxCell,meanOccupied:snap.meanOccupied,
    selector:snap.selector,capacity:snap.capacity,spacingStats:snap.spacingStats,cellCounts:snap.cellCounts,angles:snap.angles,
    auditResult:snap.audit?.result,settled:snap.audit?.settled
  }));
}
console.log('EARTHLINE_PROPERTY_SCIENCE_AB_17448_SUMMARY '+JSON.stringify({variant:VARIANT,rows:rows.map(r=>({site:r.site,rawCount:r.rawCount,safeCount:r.safeCount,occupiedCells:r.occupiedCells,emptyCells:r.emptyCells,maxCell:r.maxCell,meanOccupied:r.meanOccupied,selector:r.selector,capacity:r.capacity}))}));
await browser.close();
