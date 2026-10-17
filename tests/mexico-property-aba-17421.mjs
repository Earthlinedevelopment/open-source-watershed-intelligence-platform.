import { chromium, firefox, webkit } from 'playwright';
import { createHash } from 'node:crypto';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

const hash=v=>createHash('sha256').update(String(v)).digest('hex');
const canonical=fs=>(fs||[]).map((f,i)=>({
  id:String(f?.id??f?.properties?.id??f?.properties?.rawIndex??i),
  geom:f?.geometry||null
})).sort((a,b)=>a.id.localeCompare(b.id));

await page.goto(BASE+'?mexicoRepeat17421='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Mexico');
await page.waitForTimeout(900);
const countryOpt=page.locator('#earthlineSearchSuggestions15970 [data-query="Mexico country"]:visible');
if(await countryOpt.count()){
  await countryOpt.first().click();
}else{
  await page.locator('#searchInput').fill('Mexico country');
  await page.locator('#searchInput').press('Enter');
}
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
  const tier=String(d?.tier||d?.mode||'').toLowerCase();
  const q=String(d?.query||window.EARTHLINE_CHOSEN_LOCATION_16189?.query||'').toLowerCase();
  return tier==='regional'&&q.includes('mexico')&&String(document.documentElement.dataset.earthlineRunState||'').toLowerCase()==='published';
},null,{timeout:120000,polling:100});

const seq=[
  {name:'A1',lng:-95.74612,lat:16.68512},
  {name:'B',lng:-95.75225,lat:16.68527},
  {name:'A2',lng:-95.74612,lat:16.68512}
];
const rows=[];
for(const pt of seq){
  await page.evaluate(p=>new Promise(resolve=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m?.jumpTo)return resolve();
    let done=false; const finish=()=>{if(done)return;done=true;resolve()};
    m.once?.('moveend',finish); m.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0}); setTimeout(finish,1500);
  }),pt);
  await page.evaluate(()=>{try{window.earthlineSyncPropertyTargetFromMap16201?.()}catch(_){}});

  await page.waitForFunction(p=>{
    const b=document.getElementById('earthlineDeclareProperty16169');
    const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return b&&getComputedStyle(b).display!=='none'&&!b.disabled &&
      Math.abs(Number(t?.lng)-p.lng)<0.003&&Math.abs(Number(t?.lat)-p.lat)<0.003;
  },pt,{timeout:20000,polling:100});

  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.locator('#earthlineDeclareProperty16169').click();
  let started=false;
  try{
    await page.waitForFunction(pre=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      return Number(a?.serial||0)>pre || String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running';
    },before,{timeout:3000,polling:50});
    started=true;
  }catch(_){}
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre && a?.settled===true;
  },before,{timeout:120000,polling:100});

  const snap=await page.evaluate(()=>{
    const m=(typeof M!=='undefined'?M:null);
    const safe=m?.authoritativeSafeSwales15815?.features||[];
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const publication=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||audit?.publicationAudit||null;
    return {safe,target,audit,publication};
  });
  rows.push({
    name:pt.name,started,target:snap.target,
    auditResult:snap.audit?.result??null,
    safeCount:snap.safe.length,
    publicationCount:Number(snap.publication?.publicationCount??snap.publication?.safeCount??snap.safe.length),
    canon:JSON.stringify(canonical(snap.safe))
  });
}

const a1=rows[0],b=rows[1],a2=rows[2];
const aRepeat=hash(a1.canon)===hash(a2.canon);
const oneClick=rows.every(r=>r.started&&r.auditResult===true);
const targetsOk=rows.every((r,i)=>Math.abs(Number(r.target?.lng)-seq[i].lng)<0.003&&Math.abs(Number(r.target?.lat)-seq[i].lat)<0.003);
const countsConsistent=a1.safeCount===a2.safeCount && a1.publicationCount===a2.publicationCount;
const pass=oneClick&&targetsOk&&aRepeat&&countsConsistent;
console.log('EARTHLINE_MEXICO_ABA_17421 '+JSON.stringify({
  browser:BROWSER,pass,oneClick,targetsOk,aRepeat,countsConsistent,
  hashes:{a1:hash(a1.canon),a2:hash(a2.canon)},
  rows:rows.map(({canon,...r})=>r),errors
}));
await browser.close();
if(!pass)process.exitCode=1;
