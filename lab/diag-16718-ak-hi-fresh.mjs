import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Alaska|Hawaii').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const rows=[];

for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  await page.goto(URL+'?diag16718='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  let timedOut=false;
  try{
    await page.waitForFunction(expected=>{
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const id=String(pkg?.identity?.name||pkg?.identity?.id||'').toLowerCase();
      const want=String(expected||'').toLowerCase();
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      const identityOk=id===want || id.includes(want);
      return identityOk && (!!err || (!!pub?.runToken && /screening published\./i.test(status)));
    },stateName,{timeout:60000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(500);
  const snap=await page.evaluate(()=>{
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const land=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
    const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const product=window.EARTHLINE_TERRAIN_PRODUCTS_AUDIT_16157||null;
    const pre=window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const extent=window.EARTHLINE_REGIONAL_ANALYSIS_EXTENT_16712||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const trigger=window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16710||window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705||null;
    return {
      identity:pkg?.identity||null,
      regionalExtent:pkg?.regionalExtent||null,
      extentAudit:extent,
      land:land&&{
        validLandCellCount:land.validLandCellCount,
        invalidWaterCellCount:land.invalidWaterCellCount,
        outsideLandCellCount:land.outsideLandCellCount,
        inlandWaterCellCount:land.inlandWaterCellCount
      },
      gen:gen&&{
        candidates:gen.candidates,
        jurisdictionEligibleCandidates:gen.jurisdictionEligibleCandidates,
        chosenBeforeTierGate:gen.chosenBeforeTierGate,
        acceptedChosen:gen.acceptedChosen,
        generatedFeatures:gen.generatedFeatures,
        nullReason:gen.nullReason
      },
      product:product&&{terrain:product.terrain,derived:product.derived},
      preflight:pre,
      boundary:boundary&&{before:boundary.before,after:boundary.after,removed:boundary.removed,outsideAfterClip:boundary.outsideAfterClip},
      performance:perf,
      publication:pub&&{runToken:pub.runToken,generated:pub.generated},
      display:disp&&{swaleLines:disp.swaleLines},
      visualSwales:Array.isArray(vis?.swales?.features)?vis.swales.features.length:null,
      trigger,
      error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    };
  });
  rows.push({state:stateName,elapsedMs:Date.now()-started,timedOut,snap});
  await page.close();
}
await browser.close();
const out={at:new Date().toISOString(),url:URL,rows};
fs.writeFileSync(process.env.OUT||'lab/16718-ak-hi-fresh.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
