import { chromium } from 'playwright';

const BASE='https://earthlinedevelopment.org/';
const TARGET={lat:37.41924,lng:-119.30853};

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1908,height:882}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));

async function snap(label){
  const state=await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const last=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    const src=m?.getSource?.('earthline-elder-trees-17097')||null;
    const layer=m?.getLayer?.('earthline-elder-tree-points-17097')||null;
    let sourceFeatureCount=null,rendered=0;
    try{
      const d=src?._data||src?._options?.data||null;
      sourceFeatureCount=Array.isArray(d?.features)?d.features.length:null;
    }catch(_){}
    try{
      const canvas=m?.getCanvas?.()?.getBoundingClientRect?.();
      if(layer&&canvas){
        rendered=m.queryRenderedFeatures([[20,20],[Math.max(21,canvas.width-20),Math.max(21,canvas.height-20)]],{layers:['earthline-elder-tree-points-17097']}).length;
      }
    }catch(_){}
    return {
      tier:document.documentElement.dataset.earthlineAnalysisTier||'',
      elder:last,
      sourceExists:!!src,
      layerExists:!!layer,
      sourceFeatureCount,
      rendered,
      styleHasSource:!!m?.getStyle?.()?.sources?.['earthline-elder-trees-17097'],
      styleHasLayer:!!(m?.getStyle?.()?.layers||[]).find(l=>l.id==='earthline-elder-tree-points-17097')
    };
  });
  console.log('ELDER_LAYER_STATE '+label+' '+JSON.stringify(state));
  return state;
}

await page.goto(BASE+'?v1elderlayer17159='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
await snap('initial');

const input=page.locator('#searchInput');
await input.fill('California');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await opts.count())) throw new Error('No California suggestion');
await opts.first().click();
await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});
await page.waitForTimeout(1200);
await snap('regional-published');

const hint=page.locator('#earthlineCrosshairMoveHint17093');
if(await hint.isVisible()){
  const b=hint.getByRole('button',{name:/dismiss crosshair movement hint|got it/i});
  if(await b.count())await b.click();
}
const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count())) throw new Error('No Regional corridor');
await hit.click({force:true});
await page.waitForTimeout(250);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count())) throw new Error('No Zoom button');
await zoom.click();
await page.waitForTimeout(1200);

await page.evaluate(({lng,lat})=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  m.jumpTo({center:[lng,lat],zoom:16.5});
},TARGET);
await page.waitForTimeout(900);

const canvas=page.locator('.mapboxgl-canvas').first();
const mb=await canvas.boundingBox();
if(!mb)throw new Error('Map canvas missing');
const sx=mb.x+mb.width*.72,sy=mb.y+mb.height*.62;
await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx-6,sy+2,{steps:4});await page.mouse.up();
await page.waitForTimeout(1000);

const btn=page.locator('#earthlineDeclareProperty16169');
console.log('PROPERTY_BUTTON '+JSON.stringify({text:String(await btn.innerText()).replace(/\s+/g,' ').trim(),html:await btn.evaluate(el=>el.outerHTML)}));
await snap('before-property-click');

const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await btn.click();
await page.waitForFunction(({pre})=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
  return a?.settled===true&&Number(a?.serial||0)>pre;
},{pre},{timeout:45000,polling:150});
await snap('property-settled');
await page.waitForTimeout(5000);
await snap('property-plus-5s');
await page.waitForTimeout(10000);
const final=await snap('property-plus-15s');

console.log('PAGE_ERRORS '+JSON.stringify(errors));
await browser.close();

if(Number(final?.elder?.featureCount||0)>0 && final.layerExists===false){
  throw new Error('CONFIRMED: Elder data exists but Elder render layer is missing');
}
