import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const worker=readFileSync('earthline-elder-worker-17129.js','utf8')
  .replace('await py.loadPackage(["numpy","scipy"]);','await py.loadPackage(["numpy"]); /* science-a-b */');
const current=readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');
const baseline=readFileSync('/tmp/elder-baseline-17404.py','utf8');

const cases=[
 ['Vermont',-72.5754,44.2601],['California',-121.49,38.58],['Colorado',-105.27,39.73],
 ['Thailand',98.98,18.79],['Laos',102.63,17.97],['Vietnam',105.78,10.03]
];
function bbox20(lng,lat){const area=20*4046.8564224,w=Math.sqrt(area*1.15),h=area/w,dlat=h/(2*111320),dlng=w/(2*111320*Math.max(.05,Math.cos(lat*Math.PI/180)));return[lng-dlng,lat-dlat,lng+dlng,lat+dlat]}
const payloadCases=cases.map(([n,x,y])=>[n,x,y,bbox20(x,y)]);
const browser=await chromium.launch({headless:true});

function canonicalFeature(f){
  const p=f?.properties||{};
  return {
    c:f?.geometry?.coordinates||null,
    rc:p.record_class??null,co:p.elder_cohort??null,q:p.quadkey??null,
    rank:p.screen_rank??null,refs:p.screen_reference_peak_count??null,
    floor:p.local_canopy_floor_m??null,raw:p.raw_structural_evidence_score??null,
    screen:p.screen_structural_score??null,conf:p.elder_tree_confidence_pct??null,
    h:p.height_m??null,e:p.emergent_height_m??null,area:p.crown_area_proxy_m2??null,
    open:p.open_context_fraction??null
  };
}
function hash(v){return createHash('sha256').update(JSON.stringify(v)).digest('hex')}

async function run(label,detector){
  const context=await browser.newContext();
  await context.route('https://earthlinedevelopment.org/earthline-elder-worker-17129.js*',
    r=>r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}}));
  await context.route('https://earthlinedevelopment.org/tools/elder_trees/chmv2_array_detector_17129.py*',
    r=>r.fulfill({status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}}));
  const page=await context.newPage();
  await page.goto('https://earthlinedevelopment.org/?elderScienceAB='+label+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  const result=await page.evaluate(async cases=>{
    const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});let seq=0;
    const ask=(payload,timeout=45000)=>new Promise(resolve=>{
      const id='ab'+(++seq)+'-'+Date.now();const timer=setTimeout(()=>resolve({ok:false,error:'timeout'}),timeout);
      const h=e=>{if(e.data?.id!==id)return;w.removeEventListener('message',h);clearTimeout(timer);resolve(e.data)};
      w.addEventListener('message',h);w.postMessage({id,...payload});
    });
    await ask({warm:true},45000);
    const out=[];
    for(const [name,lng,lat,bbox] of cases){
      const r=await ask({bbox,options:{displayPerTile:24,maxPerTile:240}},45000);
      out.push({name,ok:r?.ok===true,error:r?.error||null,
        pool:r?.result?.candidatePool||[],display:r?.result?.features||[],
        poolCount:r?.result?.earthline?.candidate_pool_count??null,
        displayCount:r?.result?.features?.length??null});
    }
    w.terminate();return out;
  },payloadCases);
  await context.close();
  return result;
}

const base=await run('baseline',baseline);
const cand=await run('candidate',current);
const rows=[];
for(const b of base){
  const c=cand.find(x=>x.name===b.name);
  const bp=(b.pool||[]).map(canonicalFeature),cp=(c?.pool||[]).map(canonicalFeature);
  const bd=(b.display||[]).map(canonicalFeature),cd=(c?.display||[]).map(canonicalFeature);
  const row={name:b.name,baselineOk:b.ok,candidateOk:c?.ok===true,
    poolCount:[b.poolCount,c?.poolCount],displayCount:[b.displayCount,c?.displayCount],
    poolHash:[hash(bp),hash(cp)],displayHash:[hash(bd),hash(cd)]};
  row.pass=row.baselineOk&&row.candidateOk&&row.poolCount[0]===row.poolCount[1]&&
    row.displayCount[0]===row.displayCount[1]&&row.poolHash[0]===row.poolHash[1]&&row.displayHash[0]===row.displayHash[1];
  rows.push(row);
}
await browser.close();
const summary={pass:rows.every(r=>r.pass),rows};
console.log('EARTHLINE_ELDER_SCIENCE_AB_17408 '+JSON.stringify(summary));
if(!summary.pass)process.exitCode=1;
