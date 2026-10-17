import { chromium } from 'playwright';
import { createHash } from 'node:crypto';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
const sha=v=>createHash('sha256').update(String(v)).digest('hex');

async function openSearch(query){
  await page.waitForSelector('#searchInput',{state:'attached',timeout:30000});
  if(!(await page.locator('#searchInput').isVisible())){
    await page.evaluate(()=>{try{document.documentElement.classList.add('earthline-panel-open-16188');window.earthlineReconcilePanel16188?.();document.getElementById('earthlineRailSearch16188')?.click?.();window.earthlineReconcilePanel16188?.()}catch(_){}});
  }
  await page.waitForSelector('#searchInput',{state:'visible',timeout:15000});
  await page.locator('#searchInput').fill(query);
  await page.waitForTimeout(800);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(await opts.count())await opts.first().click();
  const rb=page.locator('#runBtn');
  if(await rb.isVisible()){
    const busy=await rb.evaluate(b=>b.disabled||b.dataset.busy==='1');
    if(!busy)await rb.click();
  }
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
}

await page.goto(BASE+'?property17421='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForFunction(()=>typeof window.earthlineFocusRunEngine16158==='function',null,{timeout:30000,polling:100});
await openSearch('Mexico');

const seq=[
  {name:'A1',lng:-95.74612,lat:16.68512},
  {name:'B', lng:-95.75225,lat:16.68527},
  {name:'A2',lng:-95.74612,lat:16.68512}
];
const rows=[];

for(const pt of seq){
  await page.evaluate(()=>{try{window.earthlineRestoreRegional16158?.('property-17421')}catch(_){}});
  await page.waitForTimeout(250);
  await page.evaluate(async p=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(mp?.jumpTo)mp.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});
    await window.earthlineFocusRunEngine16158({center:{lng:p.lng,lat:p.lat},sizeM:3000,label:'Mexico '+p.name});
  },pt);
  await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase()==='focus',null,{timeout:120000,polling:100});
  await page.evaluate(p=>new Promise(resolve=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!mp?.jumpTo)return resolve();
    let done=false;const f=()=>{if(done)return;done=true;resolve()};
    mp.once?.('moveend',f);mp.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0});setTimeout(f,1400);
  }),pt);
  await page.evaluate(()=>{try{window.earthlineSyncPropertyTargetFromMap16201?.()}catch(_){}});
  await page.waitForFunction(p=>{
    const b=document.getElementById('earthlineDeclareProperty16169'),t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return b&&getComputedStyle(b).display!=='none'&&!b.disabled&&Math.abs(Number(t?.lng)-p.lng)<.002&&Math.abs(Number(t?.lat)-p.lat)<.002;
  },pt,{timeout:20000,polling:100});

  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const clickAt=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  let started=false;
  try{
    await page.waitForFunction(pre=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      return Number(a?.serial||0)>pre||String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running'||document.documentElement.classList.contains('earthline-property-running-16233');
    },before,{timeout:3000,polling:50});
    started=true;
  }catch(_){}
  let settled=false;
  try{
    await page.waitForFunction(pre=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      return Number(a?.serial||0)>pre&&a?.settled===true;
    },before,{timeout:120000,polling:100});
    settled=true;
  }catch(_){}
  await page.waitForTimeout(500);

  const snap=await page.evaluate(()=>{
    const m=(typeof M!=='undefined'?M:null),mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const safe=m?.authoritativeSafeSwales15815?.features||[];
    const poly=Array.isArray(m?.analysisBoundaryLngLat)?m.analysisBoundaryLngLat:[];
    const texSrc=mp?.getSource?.('earthline-property-swale-texture-16174');
    const tex=Array.isArray(texSrc?._data?.features)?texSrc._data.features:[];
    const centers=tex.filter(f=>f?.properties?.geometry_role==='centerline');
    const inPoly=(q,p)=>{
      if(!Array.isArray(p)||p.length<3)return true;
      const x=Number(q?.[0]),y=Number(q?.[1]);let inside=false;
      for(let i=0,j=p.length-1;i<p.length;j=i++){
        const xi=Number(p[i]?.[0]),yi=Number(p[i]?.[1]),xj=Number(p[j]?.[0]),yj=Number(p[j]?.[1]);
        if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside;
      }
      return inside;
    };
    const lines=g=>!g?[]:g.type==='LineString'?[g.coordinates||[]]:g.type==='MultiLineString'?(g.coordinates||[]):[];
    let outside=0,totalPts=0;
    for(const f of safe)for(const line of lines(f.geometry))for(const q of line){totalPts++;if(poly.length&&!inPoly(q,poly))outside++}
    const canon=features=>(features||[]).map((f,i)=>({
      id:String(f?.id??f?.properties?.id??f?.properties?.rawIndex??i),
      raw:String(f?.properties?.rawIndex??''),
      geom:f?.geometry||null
    })).sort((a,b)=>(a.id+'|'+a.raw).localeCompare(b.id+'|'+b.raw));
    return {
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      safeCount:safe.length,textureCenters:centers.length,
      outside,totalPts,
      safeCanonical:JSON.stringify(canon(safe)),
      textureCanonical:JSON.stringify(canon(centers))
    };
  });
  rows.push({name:pt.name,elapsedMs:Date.now()-clickAt,started,settled,...snap});
  console.log('EARTHLINE_PROPERTY_17421_ROW '+JSON.stringify({name:pt.name,elapsedMs:Date.now()-clickAt,started,settled,safeCount:snap.safeCount,textureCenters:snap.textureCenters,outside:snap.outside,target:snap.target}));
}
await browser.close();

const [a1,b,a2]=rows;
const oneClick=rows.every(r=>r.started);
const settled=rows.every(r=>r.settled&&r.audit?.result===true);
const targetOk=rows.every((r,i)=>Math.abs(Number(r.target?.lng)-seq[i].lng)<.001&&Math.abs(Number(r.target?.lat)-seq[i].lat)<.001);
const contained=rows.every(r=>r.outside===0);
const aRepeatSafe=sha(a1.safeCanonical)===sha(a2.safeCanonical);
const aRepeatTexture=sha(a1.textureCanonical)===sha(a2.textureCanonical);
const pass=oneClick&&settled&&targetOk&&contained&&aRepeatSafe&&aRepeatTexture;
console.log('EARTHLINE_PROPERTY_17421 '+JSON.stringify({
  pass,oneClick,settled,targetOk,contained,aRepeatSafe,aRepeatTexture,
  rows:rows.map(r=>({name:r.name,elapsedMs:r.elapsedMs,started:r.started,settled:r.settled,safeCount:r.safeCount,textureCenters:r.textureCenters,outside:r.outside,target:r.target})),
  errors
}));
if(!pass)process.exitCode=1;
