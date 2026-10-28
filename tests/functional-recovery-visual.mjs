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
  await page.goto(BASE+'?functional_recovery='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
    await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
    await page.waitForTimeout(200);
  }
  await page.locator('#searchInput').fill('Arizona');
  await page.waitForTimeout(900);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
  if(await opt.count())await opt.click().catch(()=>{});
  await page.evaluate(()=>document.getElementById('runBtn')?.click());
  await page.waitForFunction(()=>String(document.documentElement.dataset.earthlineRunState||'')==='published',{timeout:90000,polling:150});
  await page.evaluate(t=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
    try{m.fire?.('dragend')}catch(_){}
  },c);
  await page.waitForFunction(t=>{
    const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return !!p&&Math.abs(Number(p.lng)-t.lng)<=0.00008&&Math.abs(Number(p.lat)-t.lat)<=0.00008;
  },c,{timeout:15000,polling:100});
  const b=page.locator('#earthlineDeclareProperty16169');
  await b.waitFor({state:'visible',timeout:15000});
  await b.click({timeout:10000});
  await page.waitForFunction(()=>String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase()==='property',{timeout:20000,polling:100});
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:90000,polling:150});
  await page.waitForTimeout(2500);
  const row=await page.evaluate(label=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const ids=(m?.getStyle?.()?.layers||[]).map(x=>x.id);
    const safe=ids.filter(id=>/property-safe-(casing|earth|life|water)-16221/.test(id));
    const natural=ids.filter(id=>/property-swale-(footprint|natural|neutral)-1617/.test(id));
    const elder=ids.filter(id=>/elder.*17097/i.test(id));
    const box=m?[[0,0],[m.getCanvas().clientWidth,m.getCanvas().clientHeight]]:null;
    const count=arr=>{try{return box&&arr.length?(m.queryRenderedFeatures(box,{layers:arr})||[]).length:0}catch(_){return 0}};
    return {
      label,
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),
      run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
      safeRendered:count(safe),
      naturalRendered:count(natural),
      elderRendered:count(elder),
      safeLayers:safe,
      elderLayers:elder,
      elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
      runButton:String(document.getElementById('runBtn')?.innerText||'').trim()
    };
  },c.label);
  rows.push(row);
}
console.log('EARTHLINE_FUNCTIONAL_RECOVERY '+JSON.stringify(rows));
const failed=rows.filter(r=>r.tier!=='property'||r.run?.result!==true||r.safeRendered<=0||r.elderRendered<=0||r.naturalRendered>0);
await browser.close();
if(failed.length)process.exit(1);
