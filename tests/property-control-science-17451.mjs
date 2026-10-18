import { chromium } from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const VARIANT=process.env.VARIANT||'baseline';
const OUTDIR=process.env.OUTDIR||'/tmp/property-control17451';fs.mkdirSync(OUTDIR,{recursive:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?propertyControl17451='+VARIANT+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});

const label=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();
await label.waitFor({state:'visible',timeout:20000});await label.click({force:true});
await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000,polling:100});
await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&Number.isFinite(Number(t.lng))&&Number.isFinite(Number(t.lat))&&!!b&&!b.disabled},null,{timeout:20000,polling:100});

const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
const clickAt=Date.now();await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(pre=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>pre,before,{timeout:5000,polling:50});
await page.waitForFunction(pre=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>pre&&a?.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running'},before,{timeout:120000,polling:100});
await page.waitForTimeout(800);

const snap=await page.evaluate(()=>{
  const cov=M?.coverageDiagnostic15803||null, safe=M?.authoritativeSafeSwales15815?.features||[], raw=Array.isArray(M?.swales)?M.swales:[];
  const zones=(cov?.zones||[]).map(z=>({id:z.id,inParcelCells:z.inParcelCells,safeCells:z.safeCells,contourCells:z.contourCells,candidates:z.candidates,accepted:z.accepted,rejectFinalSpacing:z.rejections?.finalSpacing||0}));
  return {
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    rawCount:raw.length,safeCount:safe.length,
    publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    spacing:M?.spacingStats||null,meta:M?.swaleMeta||null,
    distribution:window.EARTHLINE_PROPERTY_PRESCRIPTION_DISTRIBUTION_17451||null,
    coverage:{zones,candidateZones:zones.filter(z=>z.candidates>0).length,acceptedZones:zones.filter(z=>z.accepted>0).length,safeZones:zones.filter(z=>z.safeCells>0).length,
      candidateButBlank:zones.filter(z=>z.candidates>0&&z.accepted===0).map(z=>z.id),
      maxAccepted:zones.length?Math.max(...zones.map(z=>Number(z.accepted||0))):0},
    run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    safety:M?.safetyAudit15806||null
  };
});
const pass=snap.run?.result===true&&snap.run?.settled===true&&snap.safeCount>0&&snap.safety?.verified===true;
const out={variant:VARIANT,pass,elapsedMs:Date.now()-clickAt,...snap,errors};
console.log('EARTHLINE_PROPERTY_CONTROL_17451 '+JSON.stringify(out));
await page.screenshot({path:`${OUTDIR}/${VARIANT}.png`,fullPage:true});
fs.writeFileSync(`${OUTDIR}/${VARIANT}.json`,JSON.stringify(out,null,2));
await browser.close();if(!pass)process.exitCode=1;
