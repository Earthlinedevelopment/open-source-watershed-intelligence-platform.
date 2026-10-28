import { chromium } from 'playwright';
const BASE='https://earthlinedevelopment.org/';
const cases=[
 {label:'AZ-FIRST',lng:-111.93067,lat:34.21568},
 {label:'AZ-SECOND',lng:-111.93331,lat:34.21526}
];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831}});
const page=await context.newPage();
const rows=[];
for(const c of cases){
  await page.goto(BASE+'?live_visual='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
    await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
    await page.waitForTimeout(250);
  }
  await page.locator('#searchInput').fill('Arizona');
  await page.waitForTimeout(800);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
  if(await opt.count()) await opt.click().catch(()=>{});
  await page.evaluate(()=>document.getElementById('runBtn')?.click());
  await page.waitForTimeout(9000);

  await page.evaluate(t=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m) throw new Error('map unavailable');
    m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
    try{m.fire?.('dragend')}catch(_){}
  },c);
  await page.waitForTimeout(1200);

  const button=page.locator('#earthlineDeclareProperty16169');
  let buttonText='', clicked=false;
  if(await button.count()){
    buttonText=(await button.textContent()||'').trim();
    if(await button.isVisible().catch(()=>false)){
      await button.click({timeout:10000}).catch(()=>{});
      clicked=true;
    }
  }
  await page.waitForTimeout(12000);

  const snap=await page.evaluate(label=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const ids=(m?.getStyle?.()?.layers||[]).map(x=>x.id);
    const safe=ids.filter(id=>/property-safe-(casing|earth|life|water)-16221/.test(id));
    const natural=ids.filter(id=>/property-swale-(footprint|natural|neutral)-1617/.test(id));
    const elder=ids.filter(id=>/elder.*17097/i.test(id));
    const canvas=m?.getCanvas?.();
    const box=canvas?[[0,0],[canvas.clientWidth||canvas.width,canvas.clientHeight||canvas.height]]:null;
    const count=(arr)=>{try{return box&&arr.length?(m.queryRenderedFeatures?.(box,{layers:arr})||[]).length:0}catch(_){return 0}};
    const bodyText=document.body.innerText;
    return {
      label,
      runButton:String(document.getElementById('runBtn')?.innerText||'').trim(),
      propertyButton:String(document.getElementById('earthlineDeclareProperty16169')?.innerText||'').trim(),
      safeLayers:safe,
      naturalLayers:natural,
      elderLayers:elder,
      safeRendered:count(safe),
      naturalRendered:count(natural),
      elderRendered:count(elder),
      elderStatus:(bodyText.match(/Elder Trees:[^\n]*/i)||[])[0]||'',
      tier:document.documentElement.dataset.earthlineAnalysisTier||'',
      pageText:bodyText.slice(0,5000)
    };
  },c.label);
  rows.push({...c,buttonText,clicked,...snap});
  await page.screenshot({path:'/tmp/'+c.label+'.png',fullPage:true});
}
console.log('EARTHLINE_LIVE_VISUAL_ONLY '+JSON.stringify(rows));
await browser.close();
