import { chromium } from 'playwright';
const BASE='http://127.0.0.1:8787/';
const cases=[
 {label:'AZ-FIRST',lng:-111.93067,lat:34.21568},
 {label:'AZ-SECOND',lng:-111.93331,lat:34.21526}
];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831}});
const page=await context.newPage();
const rows=[];
for(const c of cases){
  await page.goto(BASE+'?activation_recovery='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
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
  await page.waitForTimeout(1000);
  const button=page.locator('#earthlineDeclareProperty16169');
  await button.waitFor({state:'visible',timeout:15000});
  const before=await page.evaluate(()=>({
    governedType:typeof window.earthlineDeclarePropertyAtCrosshair16173,
    activationType:typeof window.earthlineActivateProperty17494,
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    accepted:window.EARTHLINE_PROPERTY_ACCEPTED_TARGET_M7839||null,
    regionalActive:window.earthlineRegional15778?.active??null,
    regionalMode:window.earthlineRegional15778?.mode??null,
    runState:document.documentElement.dataset.earthlineRunState||'',
    propertyRunState:document.documentElement.dataset.earthlinePropertyRunState||'',
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),
    buttonDisabled:document.getElementById('earthlineDeclareProperty16169')?.disabled??null
  }));
  await button.click({timeout:10000});
  await page.waitForTimeout(12000);
  const snap=await page.evaluate(label=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const ids=(m?.getStyle?.()?.layers||[]).map(x=>x.id);
    const safe=ids.filter(id=>/property-safe-(casing|earth|life|water)-16221/.test(id));
    const natural=ids.filter(id=>/property-swale-(footprint|natural|neutral)-1617/.test(id));
    const elder=ids.filter(id=>/elder.*17097/i.test(id));
    const box=m?[[0,0],[m.getCanvas().clientWidth,m.getCanvas().clientHeight]]:null;
    const count=(arr)=>{try{return box&&arr.length?(m.queryRenderedFeatures(box,{layers:arr})||[]).length:0}catch(_){return 0}};
    return {
      label,
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),
      runButton:String(document.getElementById('runBtn')?.innerText||'').trim(),
      propertyButton:String(document.getElementById('earthlineDeclareProperty16169')?.innerText||'').trim(),
      safeLayers:safe,
      naturalLayers:natural,
      elderLayers:elder,
      safeRendered:count(safe),
      naturalRendered:count(natural),
      elderRendered:count(elder),
      acceptedOwner:document.getElementById('earthlineDeclareProperty16169')?.dataset.earthlinePropertyClickOwner16546||''
    };
  },c.label);
  rows.push({...snap,before});
}
console.log('EARTHLINE_ACTIVATION_RECOVERY '+JSON.stringify(rows));
const failed=rows.filter(r=>r.tier!=='property'||r.safeRendered<=0||r.elderRendered<=0||r.naturalRendered>0||r.acceptedOwner!=='shared-17494');
await browser.close();
if(failed.length)process.exit(1);
