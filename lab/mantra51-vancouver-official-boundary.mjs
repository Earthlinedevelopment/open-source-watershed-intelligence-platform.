import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto(URL+'?m51-vancouver='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='Vancouver Island';
  i.dispatchEvent(new Event('input',{bubbles:true}));
  i.dispatchEvent(new Event('change',{bubbles:true}));
  b.click();
});

await page.waitForFunction(()=>window.EARTHLINE_VANCOUVER_ISLAND_BOUNDARY_16920?.capability==='ca-cgndb-vancouver-island',{timeout:30000,polling:100});

const boundary=await page.evaluate(()=>{
  const b=window.EARTHLINE_VANCOUVER_ISLAND_BOUNDARY_16920;
  const g=b.geometry;
  const count=v=>Array.isArray(v)?(v.length>=2&&Number.isFinite(Number(v[0]))&&Number.isFinite(Number(v[1]))?1:v.reduce((a,x)=>a+count(x),0)):0;
  const center=b.center;
  const ringContains=(p,ring)=>{
    const x=+p[0],y=+p[1];let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const xi=+ring[i][0],yi=+ring[i][1],xj=+ring[j][0],yj=+ring[j][1];
      if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside;
    }
    return inside;
  };
  const contains=(p,geom)=>{
    const polys=geom.type==='Polygon'?[geom.coordinates]:geom.coordinates;
    return polys.some(rings=>rings&&rings[0]&&ringContains(p,rings[0])&&!(rings.slice(1).some(r=>ringContains(p,r))));
  };
  const insideCenter=contains(center,g);
  const outsideEast=contains([-123.35,49.65],g);
  const outsideWest=contains([-128.48,49.0],g);
  return {capability:b.capability||null,source:b.source,sourceTier:b.sourceTier,bbox:b.bbox,center,points:count(g.coordinates),insideCenter,outsideEast,outsideWest};
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
