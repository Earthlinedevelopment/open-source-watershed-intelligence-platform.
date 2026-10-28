import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';
const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const cases=[
  {label:'VT-A1',query:'Vermont',lng:-71.76608,lat:44.47977},
  {label:'SD-A1',query:'South Dakota',lng:-103.47572,lat:43.86130}
];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831}});
await installCandidateOrigin(context);
const page=await context.newPage();
const rows=[];
for(const c of cases){
  await page.goto(BASE+'?vt_sd_diag='+encodeURIComponent(c.label)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
    await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
    await page.waitForTimeout(150);
  }
  await page.locator('#searchInput').fill(c.query);
  await page.waitForTimeout(700);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:new RegExp(c.query,'i')}).first();
  if(await opt.count())await opt.click().catch(()=>{});
  await page.evaluate(()=>document.getElementById('runBtn')?.click());
  await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:150});
  await page.evaluate(t=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
    try{m.fire?.('dragend')}catch(_){}
  },c);
  await page.waitForFunction(t=>{
    const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return !!p&&Math.abs(Number(p.lng)-t.lng)<0.00008&&Math.abs(Number(p.lat)-t.lat)<0.00008;
  },c,{timeout:15000,polling:100});
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(prev=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>prev,before,{timeout:90000,polling:120});
  await page.waitForTimeout(5000);
  rows.push(await page.evaluate(label=>{
    const md=(typeof M!=='undefined'&&M)||window.M||{};
    const d=md.swaleDiagnostics||{};
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return {
      label,
      run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      swaleMeta:md.swaleMeta||null,
      diagnostics:{
        stage:d.stage||null,
        levelGenerator:d.levelGenerator||null,
        flowFirst:d.flowFirst15836||null,
        secondaryFill:d.secondaryFill15836||null,
        coverage:d.coverage||null,
        generated:d.generated,
        minimumSegmentM:d.minimumSegmentM,
        candidateCount:d.candidateCount,
        rejectionCounts:d.rejectionCounts||null
      },
      safeCache:md.earthlineTraceSafeCache16320||null,
      swales:Number(md?.authoritativeSafeSwales15815?.features?.length||0),
      water:Number(md?.authoritativeWaterPaths15824?.features?.length||0),
      recharge:Number(md?.rechZones?.length||0),
      aquifer:String(md?.usgsAquiferStatus||''),
      elder:e,
      elderRendered:(()=>{
        const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
        try{return Number(map?.queryRenderedFeatures?.({layers:['earthline-elder-trees-layer-17097']})?.length||0)}catch(_){return 0}
      })(),
      noBuild:md.noBuildProvenance15843||null,
      pageErrors:window.EARTHLINE_RUNTIME_ERRORS_15857||[]
    };
  },c.label));
}
console.log('EARTHLINE_VT_SD_DIAG '+JSON.stringify(rows));
await browser.close();
