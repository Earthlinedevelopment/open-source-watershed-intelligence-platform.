import {chromium} from 'playwright';

const STATES=[
'Vermont','New York','Massachusetts','Maryland','Colorado','Texas','Florida','Louisiana',
'California','Oklahoma','Iowa','Arkansas','Nebraska','Arizona','Nevada','Alabama',
'Pennsylvania','Ohio','Michigan','Wisconsin','Minnesota','Missouri','Kansas','New Mexico',
'Utah','Oregon','Washington'
];


const SAFE_COMBO={SIG_OLD:"async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){",SIG_NEW:"async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null,candidateOnly16850=false){",ANCHOR:"    const jurisdictionEligibleCandidates16539=candidates.length;\n",EARLY:"    if(candidateOnly16850){\n      const features16850=candidates.map((c16850,i16850)=>({type:'Feature',properties:{feature_type:'swale-opportunity',grade:'C',rank:i16850+1,score:Math.max(0,Math.min(100,Math.round((Number(c16850.score)||0)*100))),slope_pct:Number(Number(c16850.slope).toFixed(1)),confidence:c16850.confidence||'preferred',candidate_only_refinement:true},geometry:{type:'LineString',coordinates:c16850.segment}}));\n      return {type:'FeatureCollection',features:features16850};\n    }\n",VALID_OLD:"const landParts16584=Array.isArray(product16584&&product16584.landParts)?product16584.landParts:[];\n    const waterParts16584=Array.isArray(product16584&&product16584.waterParts)?product16584.waterParts:[];",VALID_NEW:"const landParts16584=(Array.isArray(product16584&&product16584.landParts)?product16584.landParts:[]).filter(p16584=>p16584&&p16584.bbox&&earthlineBBoxIntersects16584(p16584.bbox,b16584));\n    const waterParts16584=(Array.isArray(product16584&&product16584.waterParts)?product16584.waterParts:[]).filter(p16584=>p16584&&p16584.bbox&&earthlineBBoxIntersects16584(p16584.bbox,b16584));",CALLS:[["makeSwales(h16780,c16780,false,swaleJurisdictionGeometry16539,null)","makeSwales(h16780,c16780,false,swaleJurisdictionGeometry16539,null,true)"],["makeSwales(h16731,c16731,false,swaleJurisdictionGeometry16539,null)","makeSwales(h16731,c16731,false,swaleJurisdictionGeometry16539,null,true)"],["makeSwales(h16741,c16741,false,swaleJurisdictionGeometry16539,null)","makeSwales(h16741,c16741,false,swaleJurisdictionGeometry16539,null,true)"]]};

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();let body=await res.text();const x=SAFE_COMBO;for(const owner of [x.SIG_OLD,x.ANCHOR,x.VALID_OLD])if(!body.includes(owner))throw new Error('27-state safe combo owner missing');body=body.replace(x.SIG_OLD,x.SIG_NEW).replace(x.ANCHOR,x.ANCHOR+x.EARLY).replace(x.VALID_OLD,x.VALID_NEW);for(const [a,b] of x.CALLS){if(!body.includes(a))throw new Error('27-state safe combo call owner missing '+a);body=body.replace(a,b);}await route.fulfill({response:res,body});});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(2500);

async function runQuery(q){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
  },before,{timeout:120000});
  await page.waitForTimeout(900);
  return await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    let maxSlope=-Infinity;
    for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
    const audit=window.EARTHLINE_STANDARD_AUDIT_16784||null;
    return {
      q:d?.query||null,token:d?.runToken||null,
      swales:Number(d?.derived?.swaleOpportunityLines||0),
      water:Number(d?.derived?.waterPaths||0),
      contours:Number(d?.derived?.contours||0),
      maxSlope:Number.isFinite(maxSlope)?maxSlope:null,
      rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
      auditPass:audit?.pass??null,
      firstFailedStage:audit?.firstFailedStage||null
    };
  });
}

const out=[];
for(const s of STATES){
  try{out.push(await runQuery(s));}
  catch(e){out.push({q:s,error:String(e?.message||e)});}
}
const failures=out.filter(r=>r.error||!(r.swales>0)||!(r.rendered>0)||(r.maxSlope!==null&&r.maxSlope>4));
const jsonpErrors=pageErrors.filter(e=>e.includes('__earthlineVtInfra'));
console.log('M84_CORE_SAFE_27_STATE '+JSON.stringify({out,failures,jsonpErrors,pageErrors:pageErrors.slice(0,20)}));
if(failures.length)process.exitCode=2;
if(jsonpErrors.length)process.exitCode=3;
await browser.close();
