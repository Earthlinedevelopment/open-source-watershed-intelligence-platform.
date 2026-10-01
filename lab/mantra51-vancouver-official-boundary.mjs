import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto(URL+'?m51-vancouver='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vancouver Island');
await page.locator('#runBtn').click();

await page.waitForFunction(()=>window.EARTHLINE_VANCOUVER_ISLAND_BOUNDARY_16920?.capability==='ca-cgndb-vancouver-island',{timeout:30000,polling:100});

const boundary=await page.evaluate(()=>{
  const b=window.EARTHLINE_VANCOUVER_ISLAND_BOUNDARY_16920;
  const g=b.geometry;
  const count=v=>Array.isArray(v)?(v.length>=2&&Number.isFinite(Number(v[0]))&&Number.isFinite(Number(v[1]))?1:v.reduce((a,x)=>a+count(x),0)):0;
  const center=b.center;
  const cap=earthlineAdministrativeCapability16539({placeType:'region',countryCode:'ca',name:'Vancouver Island'});
  const insideCenter=earthlinePointInJurisdiction16539(center,g);
  const outsideEast=earthlinePointInJurisdiction16539([-123.35,49.65],g);
  const outsideWest=earthlinePointInJurisdiction16539([-128.48,49.0],g);
  return {capability:cap?.id||null,source:b.source,sourceTier:b.sourceTier,bbox:b.bbox,center,points:count(g.coordinates),insideCenter,outsideEast,outsideWest};
});
console.log(JSON.stringify({boundary}));
if(boundary.capability!=='ca-cgndb-vancouver-island')throw new Error('Vancouver Island did not select official boundary capability');
if(boundary.sourceTier!=='authoritative-national')throw new Error('Vancouver boundary source tier is not authoritative-national');
if(boundary.points<100)throw new Error('Vancouver boundary geometry unexpectedly sparse');
if(!boundary.insideCenter)throw new Error('Vancouver authoritative center is outside polygon');
if(boundary.outsideEast||boundary.outsideWest)throw new Error('old broad rectangle spill remains accepted as island');

await page.waitForFunction(()=>{
  const r=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;
  return r&&String(r.query||'').toLowerCase().includes('vancouver island');
},{timeout:120000,polling:250}).catch(()=>{});

const audits=await page.evaluate(()=>{
  const out={};
  for(const k of Object.keys(window)){
    if(!/(BOUNDARY|JURISDICTION).*AUDIT|AUDIT.*(BOUNDARY|JURISDICTION)/i.test(k))continue;
    try{
      const v=window[k];
      if(v&&typeof v==='object')out[k]=JSON.parse(JSON.stringify(v));
    }catch{}
  }
  return out;
});
console.log(JSON.stringify({audits}));
const candidates=Object.values(audits).filter(v=>v&&v.capability==='ca-cgndb-vancouver-island');
if(candidates.length){
  for(const a of candidates){
    const o=a.outsideAfterClip||{};
    if(Number(o.contours||0)||Number(o.flows||0)||Number(o.swales||0))throw new Error('published Vancouver product escaped official island polygon');
  }
}
await browser.close();

// trigger gate
