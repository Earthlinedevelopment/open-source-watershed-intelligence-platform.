import { chromium } from 'playwright';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
const BASE='https://earthlinedevelopment.org/',ROOT=process.cwd(),OUT='artifacts/v1-two-property-17177';
mkdirSync(OUT,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.geojson':'application/json','.py':'text/plain'};
const targets=[{name:'east',lat:37.41924,lng:-119.30853},{name:'west',lat:37.41948,lng:-119.31250}];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1908,height:882}});
await page.route('https://earthlinedevelopment.org/**',async route=>{
 const u=new URL(route.request().url());let rel=decodeURIComponent(u.pathname.replace(/^\/+/,''))||'index.html';if(rel.endsWith('/'))rel+='index.html';
 const local=resolve(ROOT,rel);if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile())return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':MIME[extname(local)]||'application/octet-stream','cache-control':'no-store'}});
 return route.continue();
});
await page.goto(BASE+'?two17177='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
const input=page.locator('#searchInput');await input.fill('California');await page.waitForTimeout(900);
await page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first().click();await page.waitForTimeout(250);await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000});
const hint=page.locator('#earthlineCrosshairMoveHint17093');if(await hint.isVisible()){const b=hint.getByRole('button',{name:/got it|dismiss/i});if(await b.count())await b.click()}
const results=[];
for(const t of targets){
 await page.evaluate(({lng,lat})=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[lng,lat],zoom:16.5})},t);
 await page.waitForTimeout(700);
 const canvas=page.locator('.mapboxgl-canvas'),box=await canvas.boundingBox();if(!box)throw new Error('map missing');
 const x=box.x+box.width*.7,y=box.y+box.height*.6;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-5,y+2,{steps:4});await page.mouse.up();await page.waitForTimeout(800);
 const btn=page.locator('#earthlineDeclareProperty16169');const txt=String(await btn.innerText()).replace(/\s+/g,' ').trim();if(!/^CROSSHAIR\b/i.test(txt))throw new Error(t.name+' missing CROSSHAIR '+txt);
 const beforeAt=await page.evaluate(()=>String(window.EARTHLINE_ELDER_TREE_LAST_17097?.at||''));
 const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
 const start=Date.now();await btn.click();
 const pending=await page.evaluate(()=>window.EARTHLINE_ELDER_TREE_LAST_17097||null);
 if(pending?.summary?.coverageDatasetIds?.includes('california-regional-overview-17130'))throw new Error(t.name+' stale Regional Elder survived Property click');
 await page.waitForFunction(({pre})=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return a?.settled===true&&Number(a.serial||0)>pre},{pre},{timeout:45000});
 const settleMs=Date.now()-start;
 await page.waitForFunction(({beforeAt})=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097;return e?.state==='committed'&&e?.summary?.coverageDatasetIds?.includes('dynamic-property-17130')&&Number(e.featureCount||0)>0&&String(e.at||'')!==beforeAt},{beforeAt},{timeout:60000,polling:150});
 await page.waitForTimeout(100);
 const d=await page.evaluate(()=>{
   const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),e=window.EARTHLINE_ELDER_TREE_LAST_17097||null,src=m?.getSource?.('earthline-elder-trees-17097');
   const data=src?._data||src?._options?.data||null,coords=(data?.features||[]).map(f=>f.geometry?.coordinates).filter(Boolean);
   let rendered=0;try{const r=m.getCanvas().getBoundingClientRect();rendered=m.queryRenderedFeatures([[0,0],[r.width,r.height]],{layers:['earthline-elder-tree-points-17097']}).length}catch(_){}
   const c=m?.getCenter?.();
   return {elder:e,coords,rendered,center:c,audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null};
 });
 let w=Math.min(...d.coords.map(c=>c[0])),e=Math.max(...d.coords.map(c=>c[0])),s=Math.min(...d.coords.map(c=>c[1])),n=Math.max(...d.coords.map(c=>c[1]));
 const mx=(w+e)/2,my=(s+n)/2,q=[0,0,0,0];for(const c of d.coords){q[(c[1]>=my?2:0)+(c[0]>=mx?1:0)]++}
 const elapsed=Date.now()-start;
 results.push({name:t.name,target:t,button:txt,pending,settleMs,elderMs:elapsed,quadrants:q,data:d});
 await page.screenshot({path:OUT+'/'+t.name+'.png',animations:'disabled'});
}
const failures=[];
for(const r of results){
 if(r.data.rendered<=0)failures.push(r.name+' zero rendered Elders');
 if(Number(r.data.elder?.summary?.modeled||0)<=0)failures.push(r.name+' no modeled Elders');
 if(Number(r.data.elder?.dynamicCandidatePoolCount||0)<=0)failures.push(r.name+' no candidate pool');
 if(r.data.elder?.summary?.legacyCandidate)failures.push(r.name+' legacy Elder contamination');
 if(r.quadrants.filter(x=>x>0).length<3)failures.push(r.name+' spatially clustered '+JSON.stringify(r.quadrants));
 if(r.settleMs>15000)failures.push(r.name+' Property >15s '+r.settleMs);
 if(r.elderMs>16000)failures.push(r.name+' Elder >16s '+r.elderMs);
}
if(results[0].data.elder.at===results[1].data.elder.at)failures.push('second Property reused first Elder timestamp');
const c0=results[0].data.center,c1=results[1].data.center;if(Math.hypot(c0.lng-c1.lng,c0.lat-c1.lat)<0.001)failures.push('second Property center did not move');
const report={results,failures};writeFileSync(OUT+'/result.json',JSON.stringify(report,null,2));console.log('EARTHLINE_V1_TWO_PROPERTY_17177 '+JSON.stringify(report));
await browser.close();if(failures.length)throw new Error(JSON.stringify(failures));
