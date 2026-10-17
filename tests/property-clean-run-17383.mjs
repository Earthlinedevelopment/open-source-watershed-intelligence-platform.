import { chromium, firefox, webkit } from 'playwright';
import { createHash } from 'node:crypto';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

function sha(v){return createHash('sha256').update(String(v)).digest('hex')}

await page.goto(BASE+'?propertyClean17383='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('mexico country');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click();
const run=page.locator('#runBtn');
if(await run.isVisible()){
  const busy=await run.evaluate(b=>b.dataset.busy==='1'||b.disabled);
  if(!busy)await run.click();
}
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});

const seq=[
  {name:'A1',lng:-95.74612,lat:16.68512},
  {name:'B', lng:-95.75225,lat:16.68527},
  {name:'A2',lng:-95.74612,lat:16.68512}
];
const rows=[];

for(const pt of seq){
  await page.evaluate(()=>{try{window.earthlineRestoreRegional16158?.('property-clean-gate-17383')}catch(_){}});
  await page.waitForTimeout(250);
  await page.evaluate(async p=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(m?.jumpTo)m.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});
    if(typeof window.earthlineFocusRunEngine16158!=='function')throw new Error('focus engine unavailable');
    await window.earthlineFocusRunEngine16158({center:{lng:p.lng,lat:p.lat},sizeM:3000,label:'Mexico '+p.name});
  },pt);
  await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase()==='focus',null,{timeout:120000,polling:100});
  await page.evaluate(p=>new Promise(resolve=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m?.jumpTo)return resolve();
    let done=false;const f=()=>{if(done)return;done=true;resolve()};
    m.once?.('moveend',f);m.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});setTimeout(f,1500);
  }),pt);
  await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return b&&getComputedStyle(b).display!=='none'&&!b.disabled},null,{timeout:20000,polling:100});

  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const clickAt=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  let started=false;
  try{
    await page.waitForFunction(pre=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      return Number(a?.serial||0)>pre||document.documentElement.classList.contains('earthline-property-running-16233');
    },before,{timeout:3000,polling:50});
    started=true;
  }catch(_){}
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre&&a?.settled===true;
  },before,{timeout:120000,polling:100});
  await page.waitForTimeout(500);

  const snap=await page.evaluate(p=>{
    const m=(typeof M!=='undefined'?M:null),mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const safe=m?.authoritativeSafeSwales15815?.features||[];
    const src=mp?.getSource?.('earthline-property-swale-texture-16174');
    const tex=Array.isArray(src?._data?.features)?src._data.features:[];
    const centers=tex.filter(f=>f?.properties?.geometry_role==='centerline');
    const gen=Number(m?.searchGen||0);
    const polygon=Array.isArray(m?.analysisBoundaryLngLat)?m.analysisBoundaryLngLat:[];
    const inPoly=(pt,poly)=>{
      if(!Array.isArray(poly)||poly.length<3)return false;
      const x=Number(pt?.[0]),y=Number(pt?.[1]);let inside=false;
      for(let i=0,j=poly.length-1;i<poly.length;j=i++){
        const xi=Number(poly[i]?.[0]),yi=Number(poly[i]?.[1]),xj=Number(poly[j]?.[0]),yj=Number(poly[j]?.[1]);
        const hit=((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi);
        if(hit)inside=!inside;
      }
      return inside;
    };
    const coordLists=g=>{
      if(!g)return[];
      if(g.type==='LineString')return[g.coordinates||[]];
      if(g.type==='MultiLineString')return g.coordinates||[];
      return[];
    };
    let outside=0,totalPts=0;
    for(const f of centers)for(const line of coordLists(f.geometry))for(const q of line){totalPts++;if(polygon.length&&!inPoly(q,polygon))outside++}
    const canon=features=>(features||[]).map((f,i)=>({
      id:String(f?.id??f?.properties?.id??f?.properties?.rawIndex??i),
      raw:String(f?.properties?.rawIndex??''),
      geom:f?.geometry||null
    })).sort((a,b)=>(a.id+'|'+a.raw).localeCompare(b.id+'|'+b.raw));
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return {
      target,gen,
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      clear:window.EARTHLINE_PROPERTY_PRESENTATION_CLEAR_17383||null,
      retire:window.EARTHLINE_PROPERTY_RETIREMENT_AUDIT_16521||null,
      safeCount:safe.length,textureCenters:centers.length,textureTotal:tex.length,
      currentGenOnly:centers.every(f=>Number(f?.properties?.property_search_gen)===gen),
      outside,totalPts,
      safeCanonical:JSON.stringify(canon(safe)),
      textureCanonical:JSON.stringify(canon(centers)),
      textureAudit:window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null
    };
  },pt);
  rows.push({name:pt.name,elapsedMs:Date.now()-clickAt,started,...snap});
  console.log('EARTHLINE_PROPERTY_CLEAN_17383_ROW '+JSON.stringify({browser:BROWSER,name:pt.name,elapsedMs:Date.now()-clickAt,started,gen:snap.gen,safeCount:snap.safeCount,textureCenters:snap.textureCenters,currentGenOnly:snap.currentGenOnly,outside:snap.outside,cleared:snap.clear?.sources||[],target:snap.target}));
}

const a1=rows[0],b=rows[1],a2=rows[2];
const oneClick=rows.every(r=>r.started&&r.audit?.settled===true&&r.audit?.result===true);
const targetOk=rows.every((r,i)=>Math.abs(Number(r.target?.lng)-seq[i].lng)<0.001&&Math.abs(Number(r.target?.lat)-seq[i].lat)<0.001);
const currentOnly=rows.every(r=>r.currentGenOnly===true);
const contained=rows.every(r=>r.outside===0);
const clearOk=rows.slice(1).every(r=>(r.clear?.sources||[]).includes('earthline-property-swale-texture-16174'));
const aRepeatSafe=sha(a1.safeCanonical)===sha(a2.safeCanonical);
const aRepeatTexture=sha(a1.textureCanonical)===sha(a2.textureCanonical);
const pass=oneClick&&targetOk&&currentOnly&&contained&&clearOk&&aRepeatSafe&&aRepeatTexture;
const summary={browser:BROWSER,pass,oneClick,targetOk,currentOnly,contained,clearOk,aRepeatSafe,aRepeatTexture,
  hashes:{a1Safe:sha(a1.safeCanonical),a2Safe:sha(a2.safeCanonical),a1Texture:sha(a1.textureCanonical),a2Texture:sha(a2.textureCanonical)},
  rows:rows.map(r=>({name:r.name,elapsedMs:r.elapsedMs,gen:r.gen,safeCount:r.safeCount,textureCenters:r.textureCenters,currentGenOnly:r.currentGenOnly,outside:r.outside,cleared:r.clear?.sources||[],target:r.target})),errors};
console.log('EARTHLINE_PROPERTY_CLEAN_17383 '+JSON.stringify(summary));
await browser.close();
if(!pass)process.exitCode=1;
