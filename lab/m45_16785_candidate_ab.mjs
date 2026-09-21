import {chromium} from 'playwright';
import fs from 'fs';

const variants=[
  {id:'baseline', patch:s=>s},
  {id:'line4', patch:s=>s.replace("let minLinePx16632=10;","let minLinePx16632=focusMode?10:4;")},
  {id:'dense', patch:s=>s.replace(
    "const fractions=coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68];",
    "const fractions=coords.length>110?[.1,.2,.3,.4,.5,.6,.7,.8,.9]:coords.length>55?[.15,.3,.45,.6,.75,.9]:[.25,.5,.75];"
  )},
  {id:'combined', patch:s=>s.replace("let minLinePx16632=10;","let minLinePx16632=focusMode?10:4;").replace(
    "const fractions=coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68];",
    "const fractions=coords.length>110?[.1,.2,.3,.4,.5,.6,.7,.8,.9]:coords.length>55?[.15,.3,.45,.6,.75,.9]:[.25,.5,.75];"
  )}
];
const states=['iowa','arkansas'];
const live=await (await fetch('https://earthlinedevelopment.org/?ab='+Date.now())).text();
const browser=await chromium.launch({headless:true});
const rows=[];
for(const variant of variants){
  const html=variant.patch(live);
  for(const state of states){
    const page=await browser.newPage({viewport:{width:1800,height:832}});
    await page.route('https://earthlinedevelopment.org/**',async route=>{
      const req=route.request();
      if(req.resourceType()==='document'){
        const u=new URL(req.url());
        if(u.pathname==='/'||u.pathname==='/index.html'){
          await route.fulfill({status:200,contentType:'text/html',body:html,headers:{'cache-control':'no-store'}});
          return;
        }
      }
      await route.continue();
    });
    let error=null;
    try{
      await page.goto('https://earthlinedevelopment.org/?ab='+variant.id+'-'+state+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForSelector('#searchInput',{timeout:30000});
      await page.evaluate(q=>{
        const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
        i.value=q+' state';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
      },state);
      await page.waitForFunction(()=>window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784?.cellLineage?.opportunityCells>0,{timeout:90000,polling:100});
      await page.waitForTimeout(250);
    }catch(e){error=String(e&&e.message||e);}
    const snap=await page.evaluate(()=>{
      const a=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||{},p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},
        d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{},
        perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{},
        land=window.EARTHLINE_LAND_VALIDITY_16584||{};
      return {
        lineage:a.cellLineage||null,firstFailedStage:a.firstFailedStage||null,
        generated:+p.generated||0,visible:+d.swaleLines||0,coreMs:+perf.totalMs||NaN,
        unsafe:+flow.unsafeSegments||0,waterReady:Array.isArray(land.waterParts),
        spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null
      };
    }).catch(()=>({}));
    rows.push({variant:variant.id,state,error,...snap});
    await page.close();
  }
}
await browser.close();
const out={at:new Date().toISOString(),rows};
fs.writeFileSync('lab/mantra45-16785-candidate-ab.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(rows.map(r=>({
  variant:r.variant,state:r.state,error:r.error,
  opportunity:r.lineage?.opportunityCells,candidate:r.lineage?.candidateCells,
  missing:r.lineage?.opportunityNoCandidate?.length,
  selected:r.lineage?.selectedCells,published:r.lineage?.publishedCells,
  generated:r.generated,visible:r.visible,coreMs:r.coreMs,unsafe:r.unsafe,
  candidateCells:r.spread?.candidateCells,finalCells:r.spread?.finalCells
}))));
