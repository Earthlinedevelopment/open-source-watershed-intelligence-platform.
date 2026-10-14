import { chromium } from 'playwright';

const BASE='https://earthlinedevelopment.org/';
const TARGET={lat:37.41924,lng:-119.30853};

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1908,height:882}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?elderdiag17155='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});

const input=page.locator('#searchInput');
await input.fill('California');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await opts.count()))throw new Error('No California suggestion');
await opts.first().click();
await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});
const hint=page.locator('#earthlineCrosshairMoveHint17093');
if(await hint.isVisible()){
  const b=hint.getByRole('button',{name:/dismiss crosshair movement hint|got it/i});
  if(await b.count())await b.click();
}
const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count()))throw new Error('No Regional hit');
await hit.click({force:true});
await page.waitForTimeout(250);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('No Zoom button');
await zoom.click();
await page.waitForTimeout(1200);
await page.evaluate(({lng,lat})=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  m.jumpTo({center:[lng,lat],zoom:16.5});
},TARGET);
await page.waitForTimeout(800);
const canvas=page.locator('.mapboxgl-canvas').first();
const mb=await canvas.boundingBox();
if(!mb)throw new Error('Map canvas missing');
const sx=mb.x+mb.width*.7,sy=mb.y+mb.height*.6;
await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx-5,sy+2,{steps:4});await page.mouse.up();
await page.waitForTimeout(900);
const btn=page.locator('#earthlineDeclareProperty16169');
const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await btn.click();
await page.waitForFunction(({pre})=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
  return a?.settled===true&&Number(a?.serial||0)>pre;
},{pre},{timeout:45000,polling:150});

const afterSettle=await page.evaluate(()=>({
  tier:document.documentElement.dataset.earthlineAnalysisTier||'',
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
  api:!!window.EARTHLINE_ELDER_TREES_V1_17097
}));
console.log('EARTHLINE_ELDER_DIAG_AFTER_SETTLE '+JSON.stringify(afterSettle));

await page.waitForTimeout(15000);
const after15=await page.evaluate(()=>({
  tier:document.documentElement.dataset.earthlineAnalysisTier||'',
  elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
  summary:window.EARTHLINE_ELDER_TREES_V1_17097?.summary?.()||null,
  featureCount:window.EARTHLINE_ELDER_TREES_V1_17097?.features?.().length||0
}));
console.log('EARTHLINE_ELDER_DIAG_AFTER15 '+JSON.stringify(after15));

const manual=await page.evaluate(async()=>{
  const api=window.EARTHLINE_ELDER_TREES_V1_17097||null;
  if(!api||typeof api.refresh!=='function')return {ok:false,error:'api missing'};
  try{
    const result=await Promise.race([
      api.refresh().then(x=>({ok:true,result:x})),
      new Promise(resolve=>setTimeout(()=>resolve({ok:false,error:'manual refresh timeout'}),90000))
    ]);
    return {
      ...result,
      elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
      featureCount:api.features?.().length||0
    };
  }catch(e){
    return {ok:false,error:String(e?.stack||e),elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null};
  }
});
console.log('EARTHLINE_ELDER_DIAG_MANUAL '+JSON.stringify(manual));
console.log('EARTHLINE_ELDER_DIAG_ERRORS '+JSON.stringify(errors));
await browser.close();
