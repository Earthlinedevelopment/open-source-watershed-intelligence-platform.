import {webkit} from 'playwright';

const marks=[
["let contours=await makeContours(hy);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · CONTOURS COMPLETE',runToken);await wait(0);",
 "const __m83c0=performance.now();let contours=await makeContours(hy);window.__M83_PRE={contoursMs:performance.now()-__m83c0};noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · CONTOURS COMPLETE',runToken);const __m83w0=performance.now();await wait(0);window.__M83_PRE.wait0Ms=performance.now()-__m83w0;"],
["if(vermontRequest&&!focusMode&&typeof window.earthlineEnsureVermontBoundary16178==='function'){",
 "const __m83b0=performance.now();if(vermontRequest&&!focusMode&&typeof window.earthlineEnsureVermontBoundary16178==='function'){"],
["const swaleJurisdictionGeometry16539=selectionBoundary16539&&(selectionBoundary16539.prepared||selectionBoundary16539.geometry)||null;",
 "window.__M83_PRE.boundaryMs=performance.now()-__m83b0;const swaleJurisdictionGeometry16539=selectionBoundary16539&&(selectionBoundary16539.prepared||selectionBoundary16539.geometry)||null;"],
["const swaleCandidateContours16609=useSupplemental16609?await makeContours(hy,true):contours;",
 "const __m83sc0=performance.now();const swaleCandidateContours16609=useSupplemental16609?await makeContours(hy,true):contours;window.__M83_PRE.suppContoursMs=performance.now()-__m83sc0;window.__M83_PRE.useSupplemental=useSupplemental16609;"],
["let supplementalCandidates16702=[];",
 "window.__M83_PRE.beforeRefinementsMs=performance.now()-__m83c0;let supplementalCandidates16702=[];"],
["let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);",
 "window.__M83_PRE.beforeSwalesMs=performance.now()-__m83c0;window.__M83_PRE.refinementAudits={scale:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,terrainGap:window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730||null,fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16780||null,late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null};let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);window.__M83_PRE.swalesMs=performance.now()-__m83c0-window.__M83_PRE.beforeSwalesMs;"]
];

const browser=await webkit.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.route('https://earthlinedevelopment.org/',async route=>{
  const res=await route.fetch();let body=await res.text();
  for(const [a,b] of marks){if(!body.includes(a))throw new Error('marker missing '+a.slice(0,100));body=body.replace(a,b);}
  await route.fulfill({response:res,body});
});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(800);
await page.locator('#searchInput').fill('Vermont');
const t0=Date.now();
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||'').toLowerCase()==='regional',{timeout:120000});
const out=await page.evaluate(t0=>({totalMs:Date.now()-t0,pre:window.__M83_PRE||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null}),t0);
console.log('M83_PRE_SWALE_PROFILE '+JSON.stringify(out));
await browser.close();
