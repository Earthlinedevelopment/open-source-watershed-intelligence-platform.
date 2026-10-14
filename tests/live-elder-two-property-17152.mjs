import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/live-elder-two-property-17152';
mkdirSync(OUT,{recursive:true});
const TARGETS=[
  {name:'east-positive',lat:37.41924,lng:-119.30853},
  {name:'west-moved',lat:37.41948,lng:-119.31250}
];

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1908,height:882},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?livetwoprop17152='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
await page.waitForFunction(async()=>{
  try{
    const stamp=Date.now();
    const [html,launch]=await Promise.all([
      fetch('/?live17153='+stamp,{cache:'no-store'}).then(r=>r.text()),
      fetch('/earthline-launch-16872.js?live17153='+stamp,{cache:'no-store'}).then(r=>r.text())
    ]);
    return html.includes('EARTHLINE_CANONICAL_PROPERTY_ELDER_REFRESH_17153') &&
      launch.includes('EARTHLINE_CROSSHAIR_MOVE_HINT_17093') &&
      !launch.includes('EARTHLINE_ELDER_REPEAT_PROPERTY_REFRESH_17152');
  }catch(_){return false}
},{timeout:120000,polling:1000});

const input=page.locator('#searchInput');
await input.fill('California');
await page.waitForTimeout(900);
const options=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await options.count())) throw new Error('No California suggestion');
await options.first().click();
await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});

const hint=page.locator('#earthlineCrosshairMoveHint17093');
if(!(await hint.isVisible())) throw new Error('Approved bare-land crosshair instruction did not render');
if(!/Place hand cursor over bare land to move map\./i.test(String(await hint.innerText()))) throw new Error('Crosshair instruction copy regressed');
const gotIt=hint.getByRole('button',{name:/dismiss crosshair movement hint|got it/i});
if(await gotIt.count()) await gotIt.click();
await page.waitForTimeout(150);

const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count())) throw new Error('No rendered Regional corridor');
await hit.click({force:true});
await page.waitForTimeout(300);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count())) throw new Error('Zoom button missing');
await zoom.click();
await page.waitForTimeout(1200);

async function retarget(t){
  await page.evaluate(({lng,lat})=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m) throw new Error('map missing');
    m.jumpTo({center:[lng,lat],zoom:16.5});
  },t);
  await page.waitForTimeout(900);
  const canvas=page.locator('.mapboxgl-canvas').first();
  const b=await canvas.boundingBox();
  if(!b) throw new Error('Map canvas missing');
  const sx=b.x+b.width*.73,sy=b.y+b.height*.61;
  await page.mouse.move(sx,sy); await page.mouse.down();
  await page.mouse.move(sx-6,sy+2,{steps:4}); await page.mouse.up();
  await page.waitForTimeout(1000);
  const btn=page.locator('#earthlineDeclareProperty16169');
  if(!(await btn.isVisible())) throw new Error('Property button missing');
  const text=String(await btn.innerText()).replace(/\s+/g,' ').trim();
  if(!/^CROSSHAIR\b/i.test(text)) throw new Error('Property did not retarget to CROSSHAIR: '+text);
  return btn;
}

async function runProperty(t,previousAt){
  const btn=await retarget(t);
  const preSerial=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await btn.click();
  await page.waitForFunction(({preSerial})=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
    return a?.settled===true && Number(a?.serial||0)>preSerial;
  },{preSerial},{timeout:45000,polling:150});

  await page.waitForFunction(({previousAt})=>{
    const x=window.EARTHLINE_ELDER_TREE_LAST_17097;
    const at=String(x?.at||'');
    return x?.summary?.coverageDatasetIds?.includes('dynamic-property-17130') &&
      Number(x?.dynamicCandidatePoolCount||0)>0 &&
      Number(x?.featureCount||0)>0 &&
      Number(x?.summary?.modeled||0)>0 &&
      (!previousAt || at!==previousAt);
  },{previousAt},{timeout:120000,polling:500});

  await page.waitForTimeout(1000);
  await page.screenshot({path:`${OUT}/${t.name}.png`,animations:'disabled'});

  return await page.evaluate((t)=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const last=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const cb=m?.getCanvas?.()?.getBoundingClientRect?.();
    let elder=[];
    try{
      const layers=(m?.getStyle?.()?.layers||[]).filter(l=>/elder/i.test(l.id)).map(l=>l.id);
      if(layers.length&&cb) elder=m.queryRenderedFeatures([[20,20],[Math.max(21,cb.width-20),Math.max(21,cb.height-20)]],{layers});
    }catch(_){}
    return {
      target:t,
      at:last?.at||null,
      summary:last?.summary||null,
      dynamicCandidatePoolCount:Number(last?.dynamicCandidatePoolCount||0),
      featureCount:Number(last?.featureCount||0),
      renderedElderCount:elder.length,
      renderedCoords:elder.slice(0,40).map(f=>f.geometry?.coordinates||null),
      propertyCenter:a?.center||null,
      propertySerial:a?.serial||0,
      propertySettled:a?.settled===true,
      propertyCorridors:a?.corridors||0
    };
  },t);
}

const results=[];
let prevAt='';
for(const t of TARGETS){
  const r=await runProperty(t,prevAt);
  results.push(r);
  prevAt=r.at||'';
}

const failures=[];
for(const r of results){
  const s=r.summary||{};
  if(!s.coverageDatasetIds?.includes('dynamic-property-17130')) failures.push(r.target.name+': not dynamic Property Elder data');
  if(r.dynamicCandidatePoolCount<=0) failures.push(r.target.name+': zero candidate pool');
  if(r.featureCount<=0) failures.push(r.target.name+': zero display features');
  if(Number(s.modeled||0)<=0) failures.push(r.target.name+': zero modeled candidates');
  if(Number(s.legacyCandidate||0)!==0) failures.push(r.target.name+': stale/legacy Elder contamination');
  if(r.renderedElderCount<=0) failures.push(r.target.name+': zero Elder pins actually rendered');
  if(!r.propertySettled) failures.push(r.target.name+': Property not settled');
  const c=r.propertyCenter;
  if(!c||Math.abs(Number(c.lng)-r.target.lng)>.01||Math.abs(Number(c.lat)-r.target.lat)>.01) failures.push(r.target.name+': Property center mismatch '+JSON.stringify(c));
}
if(results.length===2 && results[0].at===results[1].at) failures.push('Second Property reused first Elder result timestamp');
if(errors.length) failures.push('Page errors '+JSON.stringify(errors));

const report={results,errors,failures};
writeFileSync(OUT+'/result.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_LIVE_ELDER_TWO_PROPERTY_17152 '+JSON.stringify(report));
await browser.close();
if(failures.length) throw new Error('Two-Property Elder sequence failed: '+JSON.stringify(failures));
