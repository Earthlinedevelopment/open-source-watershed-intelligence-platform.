import { chromium } from 'playwright';
import fs from 'node:fs';

const base=process.env.EARTHLINE_URL;
const prefix=process.env.EARTHLINE_PREFIX||'run';
const TARGET={lat:41.95715,lng:-93.38977};
if(!base) throw new Error('EARTHLINE_URL required');

const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto(base+'?iowa-property-compare='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);
await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional' &&
    document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:120000,polling:250});

await page.evaluate(({lat,lng})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(typeof M!=='undefined'&&M){
    M.centerLat=lat;M.centerLng=lng;
    M.loc=Object.assign({},M.loc||{},{name:'Iowa diagnostic',lat,lng,countryCode:'us',query:'Iowa'});
  }
  try{mp?.jumpTo?.({center:[lng,lat],zoom:13});}catch(_){}
},TARGET);
await page.waitForTimeout(1000);

const started=Date.now();
const btn=page.locator('#earthlineDeclareProperty16169');
if(await btn.count()) await btn.click({force:true});
else await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());

let settled=false;
try{
  await page.waitForFunction(()=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return a?.settled===true;
  },null,{timeout:120000,polling:200});
  settled=true;
}catch(_){}
await page.waitForTimeout(1200);

const out=await page.evaluate(({target})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const m=(typeof M!=='undefined'?M:null);
  const sw=Array.isArray(m?.swales)?m.swales:[];
  const cellM=Number(m?.cellM||1);
  const GW=Number(globalThis.GW||m?.GW||0),GH=Number(globalThis.GH||m?.GH||0);
  const lenM=s=>{
    const pts=Array.isArray(s?.pts)?s.pts:[];let d=0;
    for(let i=1;i<pts.length;i++)d+=Math.hypot(Number(pts[i][0])-Number(pts[i-1][0]),Number(pts[i][1])-Number(pts[i-1][1]))*cellM;
    return d;
  };
  const lengths=sw.map(lenM).filter(Number.isFinite).sort((a,b)=>a-b);
  const q=p=>lengths.length?lengths[Math.min(lengths.length-1,Math.max(0,Math.floor((lengths.length-1)*p)))]:null;
  const sig=s=>{
    const pts=Array.isArray(s?.pts)?s.pts:[];
    if(!pts.length)return '';
    const a=pts.map(p=>[Math.round(Number(p[0])*1000)/1000,Math.round(Number(p[1])*1000)/1000]);
    const f=JSON.stringify(a),r=JSON.stringify(a.slice().reverse());
    return f<r?f:r;
  };
  const seen=new Set();let exactDup=0;
  for(const s of sw){const k=sig(s);if(!k)continue;if(seen.has(k))exactDup++;else seen.add(k);}
  const bins=Array.from({length:16},()=>0);
  for(const s of sw){
    const pts=Array.isArray(s?.pts)?s.pts:[];if(!pts.length||!GW||!GH)continue;
    const mid=pts[Math.floor((pts.length-1)/2)];
    const bx=Math.max(0,Math.min(3,Math.floor(Number(mid[0])*4/GW)));
    const by=Math.max(0,Math.min(3,Math.floor(Number(mid[1])*4/GH)));
    bins[by*4+bx]++;
  }
  const style=mp?.getStyle?.()||{};
  const layers=(style.layers||[]).filter(l=>/swale|tree|plant|canopy|natural/i.test(String(l.id||''))).map(l=>({
    id:l.id,type:l.type,source:l.source,
    visibility:(()=>{try{return mp.getLayoutProperty(l.id,'visibility')||'visible'}catch(_){return null}})()
  }));
  const rendered={};
  try{
    const c=mp?.getCanvas?.(),box=c&&[[0,0],[c.clientWidth||c.width,c.clientHeight||c.height]];
    if(box)for(const l of layers.filter(x=>x.visibility!=='none'))try{rendered[l.id]=(mp.queryRenderedFeatures(box,{layers:[l.id]})||[]).length}catch(_){}
  }catch(_){}
  const domCounts={
    treeCrowns:document.querySelectorAll('.earthline-swale-tree-crown-16174').length,
    understory:document.querySelectorAll('.earthline-swale-understory-16174').length,
    swaleBands:document.querySelectorAll('.earthline-swale-band-16168').length
  };
  return {
    target,
    build:window.EARTHLINE_BUILD||null,
    displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
    propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    swaleCount:sw.length,
    cellM,
    grid:[GW,GH],
    lengths:{min:lengths[0]??null,p10:q(.1),median:q(.5),p90:q(.9),max:lengths.at(-1)??null},
    exactDuplicates:exactDup,
    spatialBins4x4:bins,
    occupiedBins4x4:bins.filter(x=>x>0).length,
    swaleDiagnostics:m?.swaleDiagnostics||null,
    coverage:m?.coverageDiagnostic15803||null,
    flowFirst:m?.flowFirstAudit15836||m?.tributaryInterceptionAudit15825||null,
    naturalPlanting:window.EARTHLINE_NATURAL_SWALE_PLANTING_AUDIT_15806||window.EARTHLINE_NATURAL_SWALE_AUDIT_15806||null,
    layers,rendered,domCounts,
    pageTier:document.documentElement.dataset.earthlineAnalysisTier||null,
    runState:document.documentElement.dataset.earthlinePropertyRunState||null
  };
}, {target:TARGET});
out.settled=settled;out.elapsedMs=Date.now()-started;out.errors=errors;
fs.writeFileSync(prefix+'.json',JSON.stringify(out,null,2));
await page.screenshot({path:prefix+'.png',fullPage:false});
console.log('EARTHLINE_IOWA_PROPERTY_COMPARE '+prefix+' '+JSON.stringify(out));
await browser.close();