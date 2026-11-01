// rerun current live WebKit phase profile
import {webkit} from 'playwright';

const marks=[
["async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){",
 "async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){const __p83=performance.now();window.__M83_PHASE={start:__p83};"],
["const regionalAnchorAttempts16786=new Map();",
 "window.__M83_PHASE.beforeCandidateGeneration=performance.now()-__p83;const regionalAnchorAttempts16786=new Map();"],
["if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);",
 "if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);window.__M83_PHASE.afterCandidateGeneration=performance.now()-__p83;window.__M83_PHASE.generatedCandidates=candidates.length;"],
["const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);",
 "const __pref83=performance.now();const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);window.__M83_PHASE.preferredScreenMs=performance.now()-__pref83;window.__M83_PHASE.afterPreferred=performance.now()-__p83;"],
["const candidatesBeforeJurisdiction16539=candidates.length;",
 "window.__M83_PHASE.afterRelaxed=performance.now()-__p83;const candidatesBeforeJurisdiction16539=candidates.length;"],
["const jurisdictionEligibleCandidates16539=candidates.length;",
 "window.__M83_PHASE.afterJurisdiction=performance.now()-__p83;window.__M83_PHASE.jurisdictionCandidates=candidates.length;const jurisdictionEligibleCandidates16539=candidates.length;"],
["candidates.sort((a,b)=>b.score-a.score);",
 "candidates.sort((a,b)=>b.score-a.score);window.__M83_PHASE.afterSort=performance.now()-__p83;"],
["const acceptedChosen=(focusMode?auditedCandidates.filter(c=>c.contourAudit16166.valid):auditedCandidates).filter(c=>Number.isFinite(Number(c.slope))&&Number(c.slope)<=4);",
 "const acceptedChosen=(focusMode?auditedCandidates.filter(c=>c.contourAudit16166.valid):auditedCandidates).filter(c=>Number.isFinite(Number(c.slope))&&Number(c.slope)<=4);window.__M83_PHASE.afterSelection=performance.now()-__p83;window.__M83_PHASE.chosen=acceptedChosen.length;"]
];

const browser=await webkit.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.route('https://earthlinedevelopment.org/',async route=>{
 const res=await route.fetch();let body=await res.text();
 for(const [a,b] of marks){if(!body.includes(a))throw new Error('profile owner missing '+a.slice(0,80));body=body.replace(a,b);}
 await route.fulfill({response:res,body});
});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(900);
await page.locator('#searchInput').fill('Vermont');
const t0=Date.now();
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||'').toLowerCase()==='regional',{timeout:120000});
const out=await page.evaluate(t0=>({totalMs:Date.now()-t0,phase:window.__M83_PHASE||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null}),t0);
console.log('M83_WEBKIT_PHASE_PROFILE '+JSON.stringify(out));
await browser.close();
