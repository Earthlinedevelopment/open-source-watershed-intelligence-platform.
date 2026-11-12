import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831},reducedMotion:'reduce'});
await context.route('https://earthlinedevelopment.org/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  try {
    const init={method:req.method(),redirect:'manual'};
    const post=req.postDataBuffer?.();
    if(post && req.method()!=='GET' && req.method()!=='HEAD')init.body=post;
    const res=await fetch('http://127.0.0.1:8787'+url.pathname+url.search,init);
    const headers={};
    for(const [k,v] of res.headers.entries()){
      if(!['content-encoding','content-length','transfer-encoding','connection'].includes(k.toLowerCase()))headers[k]=v;
    }
    headers['cache-control']='no-store';
    await route.fulfill({status:res.status,headers,body:Buffer.from(await res.arrayBuffer())});
  } catch(e){await route.abort('failed')}
});
await context.route('https://ccucaqwbdsskcwxxbqiz.supabase.co/functions/v1/earthline-telemetry**',r=>r.fulfill({status:204,body:''}));
const page=await context.newPage();
const rows=[],failures=[];
page.on('pageerror',e=>{if(rows.length<40)rows.push({event:'console-error',message:e.message.slice(0,250)})});
const targets=[{label:'Arizona eastern parcel',lng:-111.93067,lat:34.21568},{label:'Arizona western parcel',lng:-111.94531,lat:34.21536}];
try{
  await page.goto(BASE+'?mantra_xxx_recovery='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{
    if(!document.documentElement.classList.contains('earthline-panel-open-16188'))
      document.getElementById('earthlineRailSearch16188')?.click();
  });
  await page.locator('#searchInput').fill('Arizona');
  await page.waitForTimeout(1000);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
  if(await opt.count())await opt.click().catch(()=>{});
  await page.evaluate(()=>document.getElementById('runBtn')?.click());
  await page.waitForFunction(()=>document.documentElement.dataset.earthlineRunState==='published',{timeout:90000,polling:250});
  const regional=await page.evaluate(async()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m)throw Error('Mapbox map missing');
    m.jumpTo({zoom:7.5});
    await new Promise(r=>setTimeout(r,500));
    const g=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
    const path=g?.querySelector(':scope > path[stroke="#42ff83"]');
    const raw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020;
    return {tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      scale:document.documentElement.dataset.earthlineCorridorScaleMxxx,
      visible:path?getComputedStyle(path).visibility:null,
      labels:document.querySelectorAll('.earthline-swale-label-16149').length,
      generated:raw?.swales?.features?.length||0,
      water:raw?.flows?.features?.length||0};
  });
  console.log('MXXX_REGIONAL_OVERVIEW '+JSON.stringify(regional));
  if(regional.scale!=='overview'||(regional.visible&&regional.visible!=='hidden')||regional.labels<1||regional.generated<1)failures.push('regional overview worm gate or A/B labels');
  await page.evaluate(()=>{const m=window.earthlineMap||earthlineMap;m.jumpTo({zoom:10})});
  await page.waitForTimeout(700);
  const detail=await page.evaluate(()=>{
    const path=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] > path[stroke="#42ff83"]');
    return {scale:document.documentElement.dataset.earthlineCorridorScaleMxxx,width:path?parseFloat(getComputedStyle(path).strokeWidth):null,visible:path?getComputedStyle(path).visibility:null}
  });
  console.log('MXXX_REGIONAL_DETAIL '+JSON.stringify(detail));
  if(detail.scale!=='detail'||(detail.width!=null&&detail.width>5))failures.push('regional detailed corridor width');
  for(const t of targets){
    await page.evaluate(t=>{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
      try{m.fire?.('dragend')}catch(_){}
    },t);
    await page.waitForFunction(t=>{
      const x=window.EARTHLINE_PROPERTY_TARGET_16201;
      return x&&Math.abs(Number(x.lng)-t.lng)<.0001&&Math.abs(Number(x.lat)-t.lat)<.0001;
    },t,{timeout:20000,polling:120});
    await page.locator('#earthlineDeclareProperty16169').waitFor({state:'visible',timeout:20000});
    await page.locator('#earthlineDeclareProperty16169').click({timeout:10000});
    await page.waitForFunction(()=>String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase()==='property',{timeout:30000,polling:200});
    await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:120000,polling:300});
    await page.waitForTimeout(1800);
    await page.evaluate(()=>{
      const el=document.getElementById('earthlineRegionalVectorOverlay16020');
      window.__mxxxMutations=0;
      window.__mxxxObserver?.disconnect();
      if(el){window.__mxxxObserver=new MutationObserver(records=>{window.__mxxxMutations+=records.filter(r=>r.type==='childList'&&r.target===el).length});window.__mxxxObserver.observe(el,{childList:true})}
    });
    await page.waitForTimeout(3800);
    const p=await page.evaluate(label=>{
      window.__mxxxObserver?.disconnect();
      const m=window.earthlineMap||earthlineMap;
      const layers=(m.getStyle?.()?.layers||[]).map(x=>x.id);
      const safe=layers.filter(id=>/property-safe-(casing|earth|life|water)-16221/.test(id));
      const box=[[0,0],[m.getCanvas().clientWidth,m.getCanvas().clientHeight]];
      const safeCount=(()=>{try{return safe.length?m.queryRenderedFeatures(box,{layers:safe}).length:0}catch{return 0}})();
      const g=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
      return {label,tier:document.documentElement.dataset.earthlineAnalysisTier||'',
        settled:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled,
        success:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.result,
        count:safeCount,svgCores:g?.querySelectorAll('.earthline-swale-core-16168').length||0,
        mutations:window.__mxxxMutations,
        reportEnabled:!document.getElementById('earthlineVermontReport16149')?.disabled};
    },t.label);
    console.log('MXXX_PROPERTY '+JSON.stringify(p));
    rows.push(p);
    await page.screenshot({path:'mxxx-'+t.label.replaceAll(' ','-').toLowerCase()+'.png'});
    if(p.tier!=='property'||p.settled!==true||p.success!==true||p.count<1)failures.push(t.label+': property did not publish visible safe swales');
    if(p.mutations>2)failures.push(t.label+': blinking proxy '+p.mutations+' overlay replacements while idle');
  }
  const report=await page.evaluate(()=>{
    document.getElementById('earthlineVermontReport16149')?.click();
    const modal=document.getElementById('earthlineVermontReportPanel16149');
    const cover=modal?.querySelector('.el49-cover');
    const sources=modal?.querySelector('.el16864-final-sources');
    window.__mxxxPrintCount=0;window.print=()=>{window.__mxxxPrintCount++};
    modal?.querySelector('[data-action="print"]')?.click();
    return {open:modal?.classList.contains('open'),cover:!!cover,sources:!!sources,
      printAction:window.__mxxxPrintCount,first:!!modal?.querySelector('[data-action="top"]'),
      last:!!modal?.querySelector('[data-action="bottom"]'),
      sourceCount:sources?.querySelectorAll('li').length||0};
  });
  console.log('MXXX_REPORT '+JSON.stringify(report));
  if(!report.open||!report.cover||!report.sources||report.printAction!==1||!report.first||!report.last)failures.push('report navigation, sources or Print/PDF');
} catch(err){failures.push('fatal: '+String(err?.stack||err).slice(0,1400))}
finally{fs.writeFileSync('mxxx-browser-results.json',JSON.stringify({rows,failures},null,2));await browser.close()}
console.log('MXXX_ACCEPTANCE '+JSON.stringify({rows,failures}));
if(failures.length)process.exit(1);
