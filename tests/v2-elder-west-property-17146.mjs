import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/v2-elder-west-property-17146';
mkdirSync(OUT,{recursive:true});
const ROOT=process.cwd();
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.py':'text/plain; charset=utf-8'};
const TARGET={lat:37.41948,lng:-119.31250};

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1908,height:882},deviceScaleFactor:1});
const page=await context.newPage();
await page.route('https://earthlinedevelopment.org/**', async route=>{
  const u=new URL(route.request().url());
  let rel=decodeURIComponent(u.pathname.replace(/^\/+/,'')) || 'index.html';
  if(rel.endsWith('/'))rel+='index.html';
  const local=resolve(ROOT,rel);
  if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile()){
    return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':MIME[extname(local).toLowerCase()]||'application/octet-stream','cache-control':'no-store','x-earthline-v2-preview':'17146'}});
  }
  return route.continue();
});
const failures=[];
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?v2elderwestproperty17146='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
await page.waitForFunction(()=>window.EARTHLINE_V2?.build==='17138',{timeout:15000,polling:100});

const input=page.locator('#searchInput');
await input.fill('California');
await page.waitForTimeout(900);
const options=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await options.count()))throw new Error('No California suggestion');
await options.first().click();
await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});

const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count()))throw new Error('No regional swale target');
await hit.click({force:true});
await page.waitForTimeout(300);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('Zoom button missing');
await zoom.click();
await page.waitForTimeout(1200);

await page.evaluate(({lng,lat})=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!m)throw new Error('map missing');
  m.jumpTo({center:[lng,lat],zoom:16.5});
},TARGET);
await page.waitForTimeout(1400);

const propertyBtn=page.locator('#earthlineDeclareProperty16169');
if(!(await propertyBtn.isVisible()))throw new Error('Property button missing');
const targetState=await page.evaluate(()=>({
  text:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').replace(/\s+/g,' ').trim(),
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  mapCenter:(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat}:null})()
}));
if(!/^CROSSHAIR\b/i.test(targetState.text))failures.push('Property target did not become CROSSHAIR: '+JSON.stringify(targetState));

await propertyBtn.click();
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:45000,polling:150});
await page.waitForFunction(()=>{
  const x=window.EARTHLINE_ELDER_TREE_LAST_17097;
  return x?.summary?.coverageDatasetIds?.includes('dynamic-property-17130') && Number(x?.dynamicCandidatePoolCount||0)>0 && Number(x?.featureCount||0)>0;
},{timeout:120000,polling:500}).catch(()=>{});
await page.waitForTimeout(1500);
await page.screenshot({path:OUT+'/west-property-final.png',animations:'disabled'});

const result=await page.evaluate(({lng,lat})=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const last=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
  const cb=m?.getCanvas?.()?.getBoundingClientRect?.();
  let elder=[];
  try{
    const layers=(m?.getStyle?.()?.layers||[]).filter(l=>/elder/i.test(l.id)).map(l=>l.id);
    if(layers.length&&cb)elder=m.queryRenderedFeatures([[20,20],[Math.max(21,cb.width-20),Math.max(21,cb.height-20)]],{layers});
  }catch(_){}
  const body=String(document.body?.innerText||'');
  return {
    target:{lng,lat},
    last,
    renderedElderCount:elder.length,
    renderedElderCoords:elder.slice(0,40).map(f=>f.geometry?.coordinates||null),
    panelHasModeledCandidates:/MODELED CANDIDATES/i.test(body),
    bodyElderSnippet:(body.match(/ELDER TREES[\s\S]{0,500}/i)||[])[0]||null,
    propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null
  };
},TARGET);

const ids=Array.isArray(result.last?.summary?.coverageDatasetIds)?result.last.summary.coverageDatasetIds:[];
if(!ids.includes('dynamic-property-17130'))failures.push('Dynamic Property Elder dataset missing: '+JSON.stringify(ids));
if(Number(result.last?.dynamicCandidatePoolCount||0)<=0)failures.push('Dynamic Property candidate pool is zero');
if(Number(result.last?.featureCount||0)<=0)failures.push('Dynamic Property display feature count is zero');
if(Number(result.renderedElderCount||0)<=0)failures.push('No Elder pins rendered for west Property');
if(errors.length)failures.push('Page errors '+JSON.stringify(errors));
const summary={targetState,result,errors,failures};
writeFileSync(OUT+'/result.json',JSON.stringify(summary,null,2));
console.log('EARTHLINE_V2_ELDER_WEST_PROPERTY_17146 '+JSON.stringify(summary));
await browser.close();
if(failures.length)throw new Error('West Property Elder regression: '+JSON.stringify(failures));
