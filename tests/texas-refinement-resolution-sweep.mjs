import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const RESOLUTIONS=[96,100,104,108,112];
const browser=await chromium.launch({headless:true});
const rows=[];
for(const res of RESOLUTIONS){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  let patchMatches=0;
  await page.route('**/*',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();let body=await resp.text();
    const needle='loadDEM(tile16702.b,112,112,6000';
    patchMatches=body.split(needle).length-1;
    if(patchMatches!==1)throw new Error('local refinement resolution anchor expected once, found '+patchMatches);
    body=body.replace(needle,'loadDEM(tile16702.b,'+res+','+res+',6000');
    return route.fulfill({response:resp,body});
  });
  await page.goto(URL+'?tx_refine_res='+res+'&t='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  for(let repeat=1;repeat<=2;repeat++){
    const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
    await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
    let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:40000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(500);
    const snap=await page.evaluate(()=>{
      const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[],mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;},count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
      const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
      return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,input:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,selection:window.EARTHLINE_REFINED_SELECTION_16702||null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandle:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerGulf:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
    });
    const row={res,repeat,elapsedMs:Date.now()-started,timedOut,patchMatches,snap};rows.push(row);console.log('EARTHLINE_TX_REFINE_RES '+JSON.stringify(row));
  }
  await page.close();
}
console.log('EARTHLINE_TX_REFINE_RES_SUMMARY '+JSON.stringify(rows));
await browser.close();
