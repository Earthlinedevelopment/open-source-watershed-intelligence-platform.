import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const TARGET={lat:37.41928,lng:-119.30587};
const OUT='artifacts/candidate-live-origin-search-handoff-17136';
mkdirSync(OUT,{recursive:true});

const candidateIndex=readFileSync('index.html','utf8');
const candidateLaunch=readFileSync('earthline-launch-16872.js','utf8');

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:832},deviceScaleFactor:1});
const page=await context.newPage();
const failures=[];
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.route(BASE,route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:candidateIndex}));
await page.route('https://earthlinedevelopment.org/earthline-launch-16872.js*',route=>route.fulfill({status:200,contentType:'application/javascript; charset=utf-8',body:candidateLaunch}));

async function shot(name){await page.screenshot({path:`${OUT}/${name}.png`,animations:'disabled'});}
async function state(label){
  const out=await page.evaluate(({label,TARGET})=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    let q=[];
    try{
      const ids=(m?.getStyle?.()?.layers||[]).filter(l=>/swale/i.test(l.id)).map(l=>l.id);
      const c=m?.getCanvas?.(),r=c?.getBoundingClientRect?.();
      if(r&&ids.length)q=m.queryRenderedFeatures([[20,20],[Math.max(21,r.width-20),Math.max(21,r.height-20)]],{layers:ids});
    }catch(_){}
    const byLayer={};for(const f of q){const id=f.layer?.id||'unknown';byLayer[id]=(byLayer[id]||0)+1}
    const b=document.getElementById('earthlineDeclareProperty16169'),span=b?.querySelector('[data-crosshair16247]');
    const center=m?.getCenter?.();
    return {
      label,targetRequested:TARGET,
      center:center?{lng:center.lng,lat:center.lat}:null,
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      runState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      button:b?{text:String(b.textContent||'').replace(/\s+/g,' ').trim(),crosshair:span?.getAttribute('data-crosshair16247')||null,disabled:!!b.disabled}:null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
      elderGauge:String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||'').replace(/\s+/g,' ').trim(),
      swaleCount:q.length,swalesByLayer:byLayer,
      regionalHits:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').length,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').replace(/\s+/g,' ').trim()
    };
  },{label,TARGET});
  console.log('EARTHLINE_CANDIDATE_STATE '+JSON.stringify(out));
  return out;
}

await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
await page.waitForTimeout(900);
await shot('00-initial');

// Search control: suggestions must not physically cover Run Analysis.
const input=page.locator('#searchInput');
await input.click();
await input.fill('California');
await page.waitForTimeout(900);
const menu=page.locator('#earthlineSearchSuggestions15970');
const runBtn=page.locator('#runBtn');
const menuBox=await menu.boundingBox();
const runBox=await runBtn.boundingBox();
const overlap=!!(menuBox&&runBox&&!(menuBox.x+menuBox.width<=runBox.x||runBox.x+runBox.width<=menuBox.x||menuBox.y+menuBox.height<=runBox.y||runBox.y+runBox.height<=menuBox.y));
console.log('EARTHLINE_SEARCH_GEOMETRY '+JSON.stringify({menuBox,runBox,overlap}));
if(overlap)failures.push('Search suggestions still cover Run Analysis');

// Use the visible state suggestion and launch Regional normally.
const options=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await options.count()))throw new Error('No visible California search suggestions');
const stateOption=options.filter({hasText:/State \/ Region/i}).first();
await (await stateOption.count()?stateOption:options.first()).click();
await runBtn.click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});
await page.waitForTimeout(900);
await shot('01-regional');
await state('regional');

const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count()))throw new Error('No rendered Regional corridor hit target');
await hit.click({force:true});
await page.waitForTimeout(350);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('Zoom to location missing');
await zoom.click();
await page.waitForTimeout(1100);
await shot('02-after-zoom');
const afterZoom=await state('after-zoom');
if(!/^CROSSHAIR\b/i.test(afterZoom.button?.text||'')||afterZoom.button?.crosshair!=='1')failures.push('Regional Zoom did not hand control to CROSSHAIR: '+JSON.stringify(afterZoom.button));

// Human-action gate: physically drag the rendered Mapbox surface.
const dragSurface=page.locator('.mapboxgl-canvas-container').first();
const dragBox=await dragSurface.boundingBox();
let dragAudit=null;
if(!dragBox){
  failures.push('Rendered Mapbox drag surface missing');
}else{
  const start=await page.evaluate(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return {center:c?{lng:c.lng,lat:c.lat}:null,dragPan:!!m?.dragPan?.isEnabled?.(),target:window.EARTHLINE_PROPERTY_TARGET_16201||null}});
  const safePoint=await page.evaluate(({box})=>{
    const xs=[.82,.68,.54,.40,.26],ys=[.78,.66,.54,.42,.30,.18];
    for(const yf of ys)for(const xf of xs){
      const x=box.x+box.width*xf,y=box.y+box.height*yf,e=document.elementFromPoint(x,y);
      const isMap=!!(e&&(e.matches?.('.mapboxgl-canvas,.mapboxgl-canvas-container')||e.closest?.('.mapboxgl-canvas-container')));
      const isOverlay=!!e?.closest?.('#earthlineRegionalVectorOverlay16020');
      const isControl=!!e?.closest?.('button,a,[role="button"],.mapboxgl-control-container,#earthlinePanel16188,#earthlineRail16188');
      if(isMap&&!isOverlay&&!isControl)return {x,y,hit:{tag:e.tagName,id:e.id||'',class:typeof e.className==='string'?e.className:''}};
    }
    return null;
  },{box:dragBox});
  if(!safePoint){
    failures.push('No unobstructed bare-map drag point was available');
  }
  const sx=safePoint?.x??(dragBox.x+dragBox.width*.72),sy=safePoint?.y??(dragBox.y+dragBox.height*.62);
  const hitAtStart=safePoint?.hit||await page.evaluate(({sx,sy})=>{const e=document.elementFromPoint(sx,sy);return e?{tag:e.tagName,id:e.id||'',class:typeof e.className==='string'?e.className:''}:null},{sx,sy});
  if(safePoint){await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx-120,sy+35,{steps:16});await page.mouse.up();}
  await page.waitForTimeout(1100);
  const end=await page.evaluate(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.(),b=document.getElementById('earthlineDeclareProperty16169'),span=b?.querySelector('[data-crosshair16247]');return {center:c?{lng:c.lng,lat:c.lat}:null,dragPan:!!m?.dragPan?.isEnabled?.(),target:window.EARTHLINE_PROPERTY_TARGET_16201||null,button:{text:String(b?.textContent||'').replace(/\s+/g,' ').trim(),crosshair:span?.getAttribute('data-crosshair16247')||null}}});
  dragAudit={dragBox,hitAtStart,start,end};
  console.log('EARTHLINE_HUMAN_DRAG '+JSON.stringify(dragAudit));
  await shot('02b-after-human-drag');
  const moved=!!(start.center&&end.center&&(Math.abs(start.center.lng-end.center.lng)>1e-6||Math.abs(start.center.lat-end.center.lat)>1e-6));
  if(!start.dragPan||!end.dragPan)failures.push('Mapbox dragPan not enabled during real mouse drag: '+JSON.stringify(dragAudit));
  if(!moved)failures.push('Rendered map did not move under real mouse drag: '+JSON.stringify(dragAudit));
  if(!/^CROSSHAIR\b/i.test(end.button?.text||'')||end.button?.crosshair!=='1')failures.push('Property search lost CROSSHAIR state after real mouse drag: '+JSON.stringify(end.button));
  if(moved&&end.target&&(Math.abs(Number(end.target.lng)-Number(end.center.lng))>.001||Math.abs(Number(end.target.lat)-Number(end.center.lat))>.001))failures.push('Property target did not follow real mouse drag: '+JSON.stringify(dragAudit));
}

// Move to the exact user-reported failing property. Candidate is still executing
// under the production HTTPS origin and production network environment.
await page.evaluate(({TARGET})=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  m?.stop?.();m?.jumpTo?.({center:[TARGET.lng,TARGET.lat],zoom:16.49,bearing:0,pitch:0});
},{TARGET});
await page.waitForTimeout(1000);
await shot('03-exact-target');
const cross=await state('exact-target');
if(!/^CROSSHAIR\b/i.test(cross.button?.text||'')||cross.button?.crosshair!=='1')failures.push('Exact map move did not maintain CROSSHAIR search state: '+JSON.stringify(cross.button));
if(Math.abs(Number(cross.target?.lat)-TARGET.lat)>.001||Math.abs(Number(cross.target?.lng)-TARGET.lng)>.001)failures.push('Property target did not follow exact map center: '+JSON.stringify(cross.target));

await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:30000,polling:150});
await page.waitForTimeout(20000);
await shot('04-property-final');
const final=await state('property-final');

if(Math.abs(Number(final.audit?.center?.lat)-TARGET.lat)>.001||Math.abs(Number(final.audit?.center?.lng)-TARGET.lng)>.001)failures.push('20-acre analysis ran from wrong center: '+JSON.stringify(final.audit?.center||null));
if(final.audit?.result!==true)failures.push('20-acre analysis did not settle true');
if(final.swaleCount<=0)failures.push('No Property swales actually rendered at exact user target');
const elderFresh=final.elder?.summary?.coverageDatasetIds?.includes('dynamic-property-17130')&&Number(final.elder?.featureCount||0)>0&&Number(final.elder?.dynamicCandidatePoolCount||0)>0;
if(!elderFresh)failures.push('No fresh dynamic Elder candidates at exact user target: '+JSON.stringify(final.elder||null));
if(pageErrors.length)failures.push('Page errors: '+JSON.stringify(pageErrors));

const result={TARGET,failures,pageErrors,menuBox,runBox,overlap,afterZoom,dragAudit,cross,final,elderFresh};
writeFileSync(`${OUT}/result.json`,JSON.stringify(result,null,2));
console.log('EARTHLINE_CANDIDATE_17136 '+JSON.stringify(result));
await browser.close();
if(failures.length)throw new Error('Candidate live-origin failures: '+JSON.stringify(failures));

// rerun-17136-menu-priority

// rerun-17136-postlayout
