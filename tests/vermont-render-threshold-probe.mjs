import { chromium } from 'playwright';
const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
await page.goto(BASE+'?vt_exact_omissions='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=3;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''));
  await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const t=String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||t!==prev)&&!!t&&/screening published\./i.test(s));},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  const snap=await page.evaluate(()=>{
    const m=window.earthlineMap||null,v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,features=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const group=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
    const rendered=new Set(Array.from(group?.querySelectorAll(':scope > path.earthline-swale-core-16168')||[]).map(p=>Number(p.dataset.swaleIndex)));
    const metrics=features.map((f,i)=>{
      const coords=f?.geometry?.coordinates||[];let prev=null,len=0,points=0;
      for(const ll of coords){try{const p=m?.project?.({lng:Number(ll[0]),lat:Number(ll[1])});if(Number.isFinite(p?.x)&&Number.isFinite(p?.y)){if(prev&&Math.hypot(p.x-prev.x,p.y-prev.y)>.35){len+=Math.hypot(p.x-prev.x,p.y-prev.y);points++;}else if(!prev)points=1;prev=p;}}catch(_){}}
      return {i,rendered:rendered.has(i),points,screenLength:Number(len.toFixed(3)),grade:f?.properties?.grade||null,rank:f?.properties?.rank??null,score:f?.properties?.score??null,coordCount:coords.length};
    });
    return {publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,metrics,omitted:metrics.filter(x=>!x.rendered),renderedBelow30:metrics.filter(x=>x.rendered&&x.screenLength<30)};
  });
  const row={repeat,timedOut,snap};rows.push(row);console.log('EARTHLINE_VT_EXACT_OMISSIONS '+JSON.stringify(row));
}
console.log('EARTHLINE_VT_EXACT_OMISSIONS_SUMMARY '+JSON.stringify(rows));
await browser.close();
if(rows.some(r=>r.timedOut||r.snap.lastError))process.exitCode=1;
