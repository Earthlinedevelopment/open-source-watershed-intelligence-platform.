import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE_URL='https://earthlinedevelopment.org/';
const source=await fs.readFile('index.html','utf8');
const needle=`    let selectionBoundary16539=null;
    if(jurisdictionCapability16539){
      selectionBoundary16539=await jurisdictionBoundaryPromise16539;
      if(!selectionBoundary16539||!selectionBoundary16539.geometry)throw new Error('selected administrative boundary could not be resolved; no uncontained Regional result was published');
    }`;
const replacement=`    let selectionBoundary16539=null;
    if(vermontRequest&&typeof window.earthlineEnsureVermontBoundary16178==='function'){
      const vermontGeometry16539=await window.earthlineEnsureVermontBoundary16178();
      if(!vermontGeometry16539)throw new Error('official Vermont state boundary could not be resolved for pre-selection screening');
      selectionBoundary16539={geometry:vermontGeometry16539,prepared:vermontGeometry16539,source:'existing official VCGI Vermont boundary'};
    }else if(jurisdictionCapability16539){
      selectionBoundary16539=await jurisdictionBoundaryPromise16539;
      if(!selectionBoundary16539||!selectionBoundary16539.geometry)throw new Error('selected administrative boundary could not be resolved; no uncontained Regional result was published');
    }`;
const matches=source.split(needle).length-1;
if(matches!==1)throw new Error('selection anchor expected 1 found '+matches);
const candidate=source.replace(needle,replacement);

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const origin=new globalThis.URL(BASE_URL).origin;
await page.route('**/*',async route=>{
 const req=route.request();
 if(req.resourceType()==='document'){
  try{const u=new globalThis.URL(req.url());if(u.origin===origin){const resp=await route.fetch();return route.fulfill({response:resp,body:candidate});}}catch(_){}
 }
 return route.continue();
});
await page.goto(BASE_URL+'?vt_preselection_ab='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});

const sequence=['Vermont','Vermont','Vermont','New York','Massachusetts','Texas','Wisconsin'];
const rows=[];
for(const q of sequence){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
 await page.evaluate(name=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=name;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},q);
 let timedOut=false;
 try{await page.waitForFunction(prev=>{const t=String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'');const busy=document.getElementById('runBtn')?.getAttribute('aria-busy')==='true';return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||t!==prev)&&!!t&&!busy);},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(500);
 const snap=await page.evaluate(()=>{
   const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,vt=window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||null;
   return {
     visualSwales:Number(v?.swales?.features?.length||0),
     visible:Number(d?.swaleLines||0),
     genPublished:Number(g?.publishedFeatures||0),
     genChosen:Number(g?.chosenBeforeTierGate||0),
     eligible:Number(g?.jurisdictionEligibleCandidates||0),
     selectionOrder:g?.jurisdictionSelectionOrder||null,
     totalMs:p?.totalMs??null,
     unsafe:flow?.unsafeSegments??null,
     outside:b?.outsideAfterClip??null,
     vtBoundary:vt?{before:vt.before,after:vt.after,source:vt.source,rule:vt.rule}:null,
     lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
   };
 });
 const row={state:q,elapsedMs:Date.now()-started,timedOut,snap};rows.push(row);console.log('EARTHLINE_VT_PRESELECT '+JSON.stringify(row));
}
console.log('EARTHLINE_VT_PRESELECT_SUMMARY '+JSON.stringify({matches,rows}));
await browser.close();

const vt=rows.filter(r=>r.state==='Vermont');
const controls=rows.filter(r=>r.state!=='Vermont');
const badVt=vt.some(r=>r.timedOut||r.snap.lastError||r.snap.visualSwales<70||r.snap.visible<70||!(r.snap.totalMs<=15000)||Number(r.snap.unsafe||0)!==0||Number(r.snap.vtBoundary?.after?.swales||0)<70);
const controlExpect={"New York":80,"Massachusetts":51,"Texas":66,"Wisconsin":80};
const badControl=controls.some(r=>r.timedOut||r.snap.lastError||r.snap.visualSwales!==controlExpect[r.state]||r.snap.visible!==controlExpect[r.state]||!(r.snap.totalMs<=15000)||Number(r.snap.unsafe||0)!==0||Number(r.snap.outside?.swales||0)!==0);
if(badVt||badControl)process.exitCode=1;
