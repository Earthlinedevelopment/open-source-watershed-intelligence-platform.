import { chromium } from 'playwright';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
const BASE='https://earthlinedevelopment.org/',ROOT=process.cwd(),OUT='artifacts/v1-final-17179';
mkdirSync(OUT,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.geojson':'application/json','.py':'text/plain'};
const targets=[{name:'east',lat:37.41924,lng:-119.30853},{name:'west',lat:37.41948,lng:-119.31250}];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1908,height:882}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('https://earthlinedevelopment.org/**',async route=>{
 const u=new URL(route.request().url());let rel=decodeURIComponent(u.pathname.replace(/^\/+/,''))||'index.html';if(rel.endsWith('/'))rel+='index.html';
 const local=resolve(ROOT,rel);if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile())return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':MIME[extname(local)]||'application/octet-stream','cache-control':'no-store'}});
 return route.continue();
});
await page.goto(BASE+'?final17179='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
const input=page.locator('#searchInput');await input.fill('California');await page.waitForTimeout(900);
await page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first().click();await page.waitForTimeout(200);await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:100});

const hint=page.locator('#earthlineCrosshairMoveHint17093');
if(!(await hint.isVisible()))throw new Error('Bare-land crosshair movement popup missing after Regional run');
const hintText=String(await hint.innerText()).replace(/\s+/g,' ').trim();
if(!/crosshair/i.test(hintText)||!/(bare|open|land)/i.test(hintText))throw new Error('Crosshair popup copy wrong: '+hintText);
const dismiss=hint.getByRole('button',{name:/got it|dismiss/i});if(await dismiss.count())await dismiss.click();

const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
await hit.click({force:true});await page.waitForTimeout(200);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();if(!(await zoom.count()))throw new Error('Zoom-to-location missing');
await zoom.click();await page.waitForTimeout(1400);
const zoomTxt=String(await page.locator('#earthlineDeclareProperty16169').innerText()).replace(/\s+/g,' ').trim();
if(!/^CROSSHAIR\b/i.test(zoomTxt))throw new Error('Zoom did not produce CROSSHAIR button: '+zoomTxt);

const results=[];
for(const t of targets){
 await page.evaluate(({lng,lat})=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[lng,lat],zoom:16.5})},t);
 await page.waitForTimeout(650);
 const canvas=page.locator('.mapboxgl-canvas'),box=await canvas.boundingBox();if(!box)throw new Error('map missing');
 const x=box.x+box.width*.70,y=box.y+box.height*.60;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-5,y+2,{steps:4});await page.mouse.up();
 await page.waitForTimeout(450);
 const btn=page.locator('#earthlineDeclareProperty16169'),txt=String(await btn.innerText()).replace(/\s+/g,' ').trim();
 if(!/^CROSSHAIR\b/i.test(txt))throw new Error(t.name+' missing CROSSHAIR: '+txt);
 const beforeIdentity=await page.evaluate(()=>String(window.EARTHLINE_ELDER_TREE_LAST_17097?.propertyRunIdentity||''));
 const preSerial=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
 await page.evaluate(()=>{window.__earthlineFinalClick17179=performance.now();document.getElementById('earthlineDeclareProperty16169').click()});
 await page.waitForTimeout(50);
 const immediate=await page.evaluate(()=>({elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,gauge:String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||'').trim()}));
 if(immediate.elder?.summary?.coverageDatasetIds?.includes('california-regional-overview-17130'))throw new Error(t.name+' stale Regional Elder survived Property start');

 await page.waitForFunction(({beforeIdentity})=>{
   const e=window.EARTHLINE_ELDER_TREE_LAST_17097;
   return e?.state==='committed'&&e?.summary?.coverageDatasetIds?.includes('dynamic-property-17130')&&Number(e.featureCount||0)>0&&String(e.propertyRunIdentity||'')!==beforeIdentity;
 },{beforeIdentity},{timeout:30000,polling:100});

 let renderState=null;
 for(let i=0;i<30;i++){
   renderState=await page.evaluate(()=>{
     const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),id='earthline-elder-tree-points-17097',src=m?.getSource?.('earthline-elder-trees-17097'),data=src?._data||src?._options?.data||null;
     let rendered=0;try{const r=m.getCanvas().getBoundingClientRect();rendered=m.queryRenderedFeatures([[0,0],[r.width,r.height]],{layers:[id]}).length}catch(_){}
     return {elapsed:performance.now()-window.__earthlineFinalClick17179,elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,coords:(data?.features||[]).map(f=>f.geometry?.coordinates).filter(Boolean),rendered};
   });
   if(renderState.rendered>0)break;
   await page.waitForTimeout(100);
 }
 if(!renderState||renderState.rendered<=0)throw new Error(t.name+' fresh Elder data did not visibly render');
 if(renderState.elapsed>15000)throw new Error(t.name+' visible Elder pins exceeded 15s: '+Math.round(renderState.elapsed));

 await page.waitForFunction(({preSerial})=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return a?.settled===true&&Number(a.serial||0)>preSerial},{preSerial},{timeout:30000,polling:100});
 const property=await page.evaluate(()=>({elapsed:performance.now()-window.__earthlineFinalClick17179,audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null}));
 if(property.elapsed>15000)throw new Error(t.name+' Property exceeded 15s: '+Math.round(property.elapsed));

 const coords=renderState.coords;
 let w=Math.min(...coords.map(c=>c[0])),e=Math.max(...coords.map(c=>c[0])),s=Math.min(...coords.map(c=>c[1])),n=Math.max(...coords.map(c=>c[1]));
 const mx=(w+e)/2,my=(s+n)/2,q=[0,0,0,0];for(const c of coords)q[(c[1]>=my?2:0)+(c[0]>=mx?1:0)]++;
 if(q.filter(v=>v>0).length<3)throw new Error(t.name+' Elder pins spatially clustered: '+JSON.stringify(q));
 if(Number(renderState.elder?.summary?.modeled||0)<=0||Number(renderState.elder?.dynamicCandidatePoolCount||0)<=0)throw new Error(t.name+' no fresh modeled Elder evidence');
 if(Number(renderState.elder?.summary?.legacyCandidate||0)!==0)throw new Error(t.name+' legacy/regional Elder contamination');

 let swales=0;
 for(let i=0;i<20;i++){
   swales=await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),layers=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'].filter(id=>m?.getLayer?.(id));
    if(!layers.length)return 0;try{const r=m.getCanvas().getBoundingClientRect();return m.queryRenderedFeatures([[0,0],[r.width,r.height]],{layers}).length}catch(_){return 0}
   }); if(swales>0)break; await page.waitForTimeout(100);
 }
 if(swales<=0)throw new Error(t.name+' no visible Property swales');
 results.push({name:t.name,target:t,button:txt,immediate,elderMs:Math.round(renderState.elapsed),renderedElders:renderState.rendered,quadrants:q,modeled:renderState.elder.summary.modeled,pool:renderState.elder.dynamicCandidatePoolCount,propertyMs:Math.round(property.elapsed),corridors:property.audit?.corridors,swales});
 await page.screenshot({path:OUT+'/'+t.name+'.png',animations:'disabled'});
}
if(results[0].target.lng===results[1].target.lng)throw new Error('targets not distinct');
if(errors.length)throw new Error('page errors '+JSON.stringify(errors));
const report={hintText,zoomTxt,results,errors};writeFileSync(OUT+'/result.json',JSON.stringify(report,null,2));console.log('EARTHLINE_V1_FINAL_17179 '+JSON.stringify(report));
await browser.close();
