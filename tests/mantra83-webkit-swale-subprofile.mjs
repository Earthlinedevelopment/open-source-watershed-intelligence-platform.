import {webkit} from 'playwright';
const marks=[
["async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){","async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){const __m83=performance.now();window.__M83_SW={};"],
["    if(!focusMode){\n      let supplementalAnchorAttempts16786=0","    window.__M83_SW.fixed=performance.now()-__m83;\n    if(!focusMode){\n      let supplementalAnchorAttempts16786=0"],
["    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);","    window.__M83_SW.anchors=performance.now()-__m83;\n    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);"],
["    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);","    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);window.__M83_SW.preferred=performance.now()-__m83;"],
["    const candidatesBeforeJurisdiction16539=candidates.length;","    window.__M83_SW.relaxed=performance.now()-__m83;const candidatesBeforeJurisdiction16539=candidates.length;"],
["    const jurisdictionEligibleCandidates16539=candidates.length;","    window.__M83_SW.finalScreen=performance.now()-__m83;const jurisdictionEligibleCandidates16539=candidates.length;"],
["    candidates.sort((a,b)=>b.score-a.score);","    candidates.sort((a,b)=>b.score-a.score);window.__M83_SW.sorted=performance.now()-__m83;"],
["    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));","    window.__M83_SW.selected=performance.now()-__m83;const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));"],
["window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;\n    return {type:'FeatureCollection',features};","window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;window.__M83_SW.done=performance.now()-__m83;window.__M83_SW.candidates=candidatesBeforeJurisdiction16539;window.__M83_SW.eligible=jurisdictionEligibleCandidates16539;window.__M83_SW.chosen=chosen.length;\n    return {type:'FeatureCollection',features};"]
];
const browser=await webkit.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();let body=await res.text();for(const [a,b] of marks){if(!body.includes(a))throw new Error('marker missing '+a.slice(0,60));body=body.replace(a,b);}await route.fulfill({response:res,body});});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForTimeout(1000);await page.locator('#searchInput').fill('Vermont');const t0=Date.now();
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(()=>String(document.documentElement.dataset.earthlineRunState||'')==='published',{timeout:180000});
const out=await page.evaluate(t0=>({total:Date.now()-t0,sw:window.__M83_SW||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null}));
console.log('M83_WEBKIT_SUBPROFILE '+JSON.stringify(out));await browser.close();