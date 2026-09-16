import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
let patchMatches=0;
await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
    const response=await route.fetch();let body=await response.text();
    const needle="if(swaleCount>0&&overlayAudit&&Number(overlayAudit.swaleLines||0)===0){";
    patchMatches=body.split(needle).length-1;
    if(patchMatches===1)body=body.replace(needle,"if(false&&swaleCount>0&&overlayAudit&&Number(overlayAudit.swaleLines||0)===0){");
    await route.fulfill({response,body});return;
  }
  await route.continue();
});
let loadError=null,timedOut=false;
try{await page.goto(BASE+'?earthline_vt_render_probe='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});}catch(e){loadError=String(e);}
const started=Date.now();
if(!loadError){
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  try{await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!e||/screening published\./i.test(s);},{},{timeout:30000,polling:50});}catch(_){timedOut=true;}
  await page.waitForTimeout(1500);
}
const result=loadError?{loadError}:{
  ...(await page.evaluate(()=>{
    const data=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,m=window.earthlineMap||null;
    const lengths=[];
    for(const f of data?.swales?.features||[]){
      const c=f?.geometry?.coordinates||[];let len=0,prev=null;
      for(const ll of c){try{const p=m?.project?.(ll);if(p&&prev)len+=Math.hypot(p.x-prev.x,p.y-prev.y);if(p)prev=p;}catch(_){}}
      lengths.push(len);
    }
    const sorted=lengths.slice().sort((a,b)=>a-b),q=p=>sorted.length?sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*p))]:null;
    let sourceFeatures=null;try{const src=m?.getSource?.('el-live-swales-15970'),d=src&&(src._data||src._options?.data);sourceFeatures=d?.features?.length??null;}catch(_){}
    return {
      generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
      publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,
      labelAudit:window.EARTHLINE_REGIONAL_CORRIDOR_LABEL_AUDIT_16336||null,
      flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
      visualSwales:data?.swales?.features?.length??null,
      sourceFeatures,
      domCorePaths:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 .earthline-swale-core-16168').length,
      domAllSwalePaths:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
      projectedLengths:{count:sorted.length,min:q(0),p10:q(.1),p25:q(.25),median:q(.5),p75:q(.75),p90:q(.9),max:q(1),ge22:lengths.filter(x=>x>=22).length,ge16:lengths.filter(x=>x>=16).length,ge12:lengths.filter(x=>x>=12).length,ge10:lengths.filter(x=>x>=10).length,ge8:lengths.filter(x=>x>=8).length}
    };
  })),
  patchMatches,timedOut,clickToTerminalMs:Date.now()-started,pageErrors
};
await browser.close();
writeFileSync('vermont-render-threshold-probe.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_VT_RENDER_THRESHOLD '+JSON.stringify(result));
if(loadError||patchMatches!==1||timedOut||pageErrors.length)process.exitCode=1;
