import {webkit} from 'playwright';

const browser=await webkit.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});

await page.route('https://earthlinedevelopment.org/',async route=>{
  const res=await route.fetch();
  let body=await res.text();

  const pairs=[
    [
      "async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){",
      "async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){const __m83Start=performance.now();window.__M83_SWALE_PROFILE={start:__m83Start};"
    ],
    [
      "const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);",
      "window.__M83_SWALE_PROFILE.initialCandidates=candidates.length;window.__M83_SWALE_PROFILE.beforePreferred=performance.now()-__m83Start;const __m83Pref=performance.now();const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);window.__M83_SWALE_PROFILE.preferredScreenMs=performance.now()-__m83Pref;"
    ],
    [
      "const candidatesBeforeJurisdiction16539=candidates.length;",
      "window.__M83_SWALE_PROFILE.afterRelaxed=performance.now()-__m83Start;window.__M83_SWALE_PROFILE.totalCandidates=candidates.length;const candidatesBeforeJurisdiction16539=candidates.length;"
    ],
    [
      "if(!focusMode&&jurisdictionGeometry16539){\n      const eligible16539=[];let finalScreenYield16661=0;",
      "if(!focusMode&&jurisdictionGeometry16539){\n      const __m83FinalScreen=performance.now();const eligible16539=[];let finalScreenYield16661=0;"
    ],
    [
      "candidates.length=0;candidates.push(...eligible16539);\n    }\n    const jurisdictionEligibleCandidates16539=candidates.length;",
      "candidates.length=0;candidates.push(...eligible16539);window.__M83_SWALE_PROFILE.finalScreenMs=performance.now()-__m83FinalScreen;\n    }\n    window.__M83_SWALE_PROFILE.afterJurisdiction=performance.now()-__m83Start;const jurisdictionEligibleCandidates16539=candidates.length;"
    ],
    [
      "window.EARTHLINE_SWALE_GENERATION_AUDIT_16167={",
      "window.__M83_SWALE_PROFILE.beforeAudit=performance.now()-__m83Start;window.EARTHLINE_SWALE_GENERATION_AUDIT_16167={"
    ]
  ];

  for(const [oldv,newv] of pairs){
    if(!body.includes(oldv))throw new Error('profile marker missing: '+oldv.slice(0,80));
    body=body.replace(oldv,newv);
  }
  await route.fulfill({response:res,body});
});

await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1200);
await page.locator('#searchInput').fill('Vermont');
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(()=>String(document.documentElement.dataset.earthlineRunState||'')==='published',{timeout:180000});
const out=await page.evaluate(()=>({profile:window.__M83_SWALE_PROFILE||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null}));
console.log('M83_WEBKIT_SWALE_PROFILE '+JSON.stringify(out));
await browser.close();
