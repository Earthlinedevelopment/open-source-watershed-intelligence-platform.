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

const result={TARGET,failures,pageErrors,menuBox,runBox,overlap,afterZoom,cross,final,elderFresh};
writeFileSync(`${OUT}/result.json`,JSON.stringify(result,null,2));
console.log('EARTHLINE_CANDIDATE_17136 '+JSON.stringify(result));
await browser.close();
if(failures.length)throw new Error('Candidate live-origin failures: '+JSON.stringify(failures));

// rerun-17136-menu-priority
