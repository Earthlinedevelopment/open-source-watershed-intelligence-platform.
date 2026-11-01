import {chromium,webkit} from 'playwright';
import fs from 'node:fs';

const changes=[
["const fractions=focusMode?(coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68]):(coords.length>110?[.1,.2,.3,.4,.5,.6,.7,.8,.9]:coords.length>55?[.15,.3,.45,.6,.75,.9]:[.25,.5,.75]);",
 "const fractions=focusMode?(coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68]):(coords.length>110?[.14,.32,.5,.68,.86]:coords.length>55?[.2,.4,.6,.8]:[.25,.5,.75]);"],
["const visited16786=new Set();\n        for(let idx=3;idx<coords.length-3;idx++){",
 "const visited16786=new Set(),step16786=Math.max(1,Math.floor(Math.max(1,coords.length-6)/18));\n        for(let idx=3;idx<coords.length-3;idx+=step16786){"],
["if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();","if((++yieldCount16661%48)===0)await earthlineCooperativeYield16661();"],
["if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();","if((++finalScreenYield16661%48)===0)await earthlineCooperativeYield16661();"],
["if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);\n    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);",
 "if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);\n    if(!focusMode&&candidates.length>432){const bins83=new Map();for(const c83 of candidates){if(!c83||!Number.isFinite(Number(c83.x))||!Number.isFinite(Number(c83.y)))continue;const bx83=Math.max(0,Math.min(11,Math.floor(Number(c83.x)*12/Math.max(1,hy.w)))),by83=Math.max(0,Math.min(11,Math.floor(Number(c83.y)*12/Math.max(1,hy.h)))),k83=bx83+','+by83;let a83=bins83.get(k83);if(!a83)bins83.set(k83,a83=[]);a83.push(c83)}const reduced83=[];for(const a83 of bins83.values()){a83.sort((u83,v83)=>(Number(v83.score)||0)-(Number(u83.score)||0));reduced83.push(...a83.slice(0,3))}candidates.length=0;candidates.push(...reduced83);window.EARTHLINE_REGIONAL_CANDIDATE_REDUCTION_83={after:candidates.length,bins:bins83.size,perBin:3,at:new Date().toISOString()}}\n    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);"]
];

const chromePaths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const chromePath=chromePaths.find(p=>fs.existsSync(p));

async function run(kind){
  const bt=kind==='webkit'?webkit:chromium;
  const opts=kind==='webkit'?{headless:true}:{headless:true,executablePath:chromePath,args:['--no-sandbox']};
  const browser=await bt.launch(opts);
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.route('https://earthlinedevelopment.org/',async route=>{
    const res=await route.fetch();let body=await res.text();
    for(const [a,b] of changes){if(!body.includes(a))throw new Error('owner missing '+a.slice(0,80));body=body.replace(a,b);}
    await route.fulfill({response:res,body});
  });
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(900);
  const rows=[];
  for(const q of ['Vermont','Arizona']){
    const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
    await page.locator('#searchInput').fill(q);const t0=Date.now();
    await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
    await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(d.tier||d.mode||'').toLowerCase()==='regional';},before,{timeout:70000});
    await page.waitForTimeout(250);
    const r=await page.evaluate(t0=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];let max=-Infinity;for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))max=Math.max(max,n)}return {ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Number.isFinite(max)?max:null,reduction:window.EARTHLINE_REGIONAL_CANDIDATE_REDUCTION_83||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null}},t0);
    console.log('M83_WORKLOAD_ROW '+JSON.stringify({kind,q,...r}));
    rows.push({q,...r});
    if(r.swales<45||r.rendered<45)throw new Error(kind+' '+q+' coverage regressed '+JSON.stringify(r));
    if(r.maxSlope!==null&&r.maxSlope>4)throw new Error(kind+' '+q+' slope '+r.maxSlope);
    if(kind==='webkit'&&r.ms>45000)throw new Error(kind+' '+q+' still too slow '+r.ms);
  }
  await browser.close();return rows;
}
const chrome=await run('chrome');
const webkitRows=await run('webkit');
console.log('M83_WORKLOAD_V2_PASS '+JSON.stringify({chrome,webkit:webkitRows}));
