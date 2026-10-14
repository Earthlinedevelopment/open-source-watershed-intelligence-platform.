import { chromium } from 'playwright';

const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1908,height:882}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

function qState(){return page.evaluate(()=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const ids=(m?.getStyle?.()?.layers||[]).map(l=>l.id).filter(id=>/property|swale|safe/i.test(id));
  const interesting=ids.map(id=>{
    let vis=null,source=null,type=null,count=0,paint={};
    try{const l=m.getLayer(id);vis=m.getLayoutProperty(id,'visibility');source=l?.source||null;type=l?.type||null}catch(_){}
    try{
      if(type==='line'){
        const r=m.getCanvas().getBoundingClientRect();
        count=m.queryRenderedFeatures([[10,10],[r.width-10,r.height-10]],{layers:[id]}).length;
        for(const p of ['line-color','line-width','line-opacity']){
          try{paint[p]=m.getPaintProperty(id,p)}catch(_){}
        }
      }
    }catch(_){}
    return {id,vis,source,type,count,paint};
  });
  return {audit:a,layers:interesting};
});}

await page.goto(BASE+'?swalelayer17170='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
const input=page.locator('#searchInput');
await input.fill('California');await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await opts.count()))throw new Error('No California suggestion');
await opts.first().click();await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});
const hint=page.locator('#earthlineCrosshairMoveHint17093');if(await hint.isVisible()){const b=hint.getByRole('button',{name:/got it|dismiss/i});if(await b.count())await b.click()}
const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count()))throw new Error('No corridor');
await hit.click({force:true});await page.waitForTimeout(200);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('Zoom missing');await zoom.click();await page.waitForTimeout(1200);

const btn=page.locator('#earthlineDeclareProperty16169');

for(let run=1;run<=2;run++){
  const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await btn.click();
  await page.waitForFunction(({pre})=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return a?.settled===true&&Number(a?.serial||0)>pre},{pre},{timeout:45000,polling:150});
  const immediate=await qState();
  console.log('SWALE_STATE_RUN_'+run+'_SETTLED '+JSON.stringify(immediate));
  await page.waitForTimeout(1500);
  const plus=await qState();
  console.log('SWALE_STATE_RUN_'+run+'_PLUS1500 '+JSON.stringify(plus));
  if(run===1){
    const canvas=page.locator('.mapboxgl-canvas').first();
    const b=await canvas.boundingBox();
    if(b){
      const sx=b.x+b.width*.65,sy=b.y+b.height*.55;
      await page.mouse.move(sx,sy);await page.mouse.down();await page.mouse.move(sx-6,sy+2,{steps:4});await page.mouse.up();await page.waitForTimeout(800);
    }
  }
}
console.log('PAGE_ERRORS '+JSON.stringify(errors));
await browser.close();
