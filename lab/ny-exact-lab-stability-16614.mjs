import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL='https://earthlinedevelopment.org/lab.html?ny16614='+Date.now();
const RUNS=5;
const browser=await chromium.launch({headless:true});
const results=[];

for(let run=1;run<=RUNS;run++){
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(URL+'&run='+run,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.getElementById('state')?.textContent==='VERIFIED EXACT',null,{timeout:45000});
  const handle=await page.waitForSelector('#earthline-lab-frame',{timeout:15000});
  const frame=await handle.contentFrame();
  if(!frame)throw new Error('exact lab iframe unavailable');
  await frame.waitForSelector('#searchInput',{timeout:30000});
  await frame.evaluate(()=>{
    const input=document.getElementById('searchInput');
    input.focus();input.value='New York';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await frame.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:15000});
  const selected=await frame.evaluate(()=>{
    const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const chosen=opts.find(b=>norm(b.dataset.query||'')==='new york'&&/state|region/i.test(String(b.textContent||'')))||opts.find(b=>norm(b.dataset.query||'')==='new york');
    if(!chosen)return null;
    const out={text:String(chosen.textContent||'').trim(),query:String(chosen.dataset.query||'')};chosen.click();return out;
  });
  if(!selected)throw new Error('New York state suggestion unavailable');
  await frame.waitForFunction(()=>{
    const name=String((typeof M!=='undefined'&&M?.loc?.name)||'').toLowerCase();
    return name.includes('new york');
  },null,{timeout:15000,polling:100});
  await frame.waitForFunction(()=>{
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
    return !!window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||/ANALYSIS FAILED/i.test(s);
  },null,{timeout:60000,polling:200});
  await frame.waitForTimeout(1500);
  const audit=await frame.evaluate(()=>{
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const style=map?.getStyle?.()||{};
    const vectorSources=Object.entries(style.sources||{}).filter(([,d])=>String(d?.type||'').toLowerCase()==='vector').map(([id])=>id);
    const sourceState={};
    for(const id of vectorSources){try{sourceState[id]=typeof map?.isSourceLoaded==='function'?!!map.isSourceLoaded(id):null}catch(_){sourceState[id]=false}}
    const post={};
    for(const id of vectorSources){
      post[id]={water:null,waterway:null};
      for(const layer of ['water','waterway']){try{post[id][layer]=(map.querySourceFeatures(id,{sourceLayer:layer})||[]).length}catch(_){post[id][layer]=-1}}
    }
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    return {
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),
      loc:typeof M!=='undefined'&&M?.loc?{name:M.loc.name,lat:M.loc.lat,lng:M.loc.lng}:null,
      iframe:{w:innerWidth,h:innerHeight,devicePixelRatio},
      vectorSources,sourceState,postQueryCounts:post,
      mappedWaterAudit16609:window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null,
      landAudit:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,
      displayAudit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,
      swales:Number(v?.swales?.features?.length||0),
      water16601:window.EARTHLINE_LAB_WATER_16601||null
    };
  });
  results.push({run,selected,audit,errors});
  if(run===1)await page.screenshot({path:'lab-results/ny-exact-lab-16614.png',fullPage:true});
  await page.close();
}

await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/ny-exact-lab-16614.json',JSON.stringify({generatedAt:new Date().toISOString(),url:URL,runs:results},null,2));
console.log('EARTHLINE_NY_EXACT_LAB_16614 '+JSON.stringify(results.map(r=>({run:r.run,status:r.audit.status,iframe:r.audit.iframe,sourceState:r.audit.sourceState,postQueryCounts:r.audit.postQueryCounts,mapped:r.audit.mappedWaterAudit16609,swales:r.audit.swales}))));
await browser.close();
const ok=results.every(r=>r.audit?.mappedWaterAudit16609?.verified===true&&r.audit?.swales>0&&!/ANALYSIS FAILED/i.test(r.audit?.status||''));
if(!ok)process.exitCode=1;
