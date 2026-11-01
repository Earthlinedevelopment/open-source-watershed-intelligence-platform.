import {chromium,webkit} from 'playwright';
import fs from 'node:fs';

const OLD="if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);\n    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);";
const NEW="if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);\n    if(!focusMode&&candidates.length>576){const bins83=new Map();for(const c83 of candidates){if(!c83||!Number.isFinite(Number(c83.x))||!Number.isFinite(Number(c83.y)))continue;const bx83=Math.max(0,Math.min(11,Math.floor(Number(c83.x)*12/Math.max(1,hy.w)))),by83=Math.max(0,Math.min(11,Math.floor(Number(c83.y)*12/Math.max(1,hy.h)))),k83=bx83+','+by83;let a83=bins83.get(k83);if(!a83)bins83.set(k83,a83=[]);a83.push(c83)}const reduced83=[];for(const a83 of bins83.values()){a83.sort((u83,v83)=>(Number(v83.score)||0)-(Number(u83.score)||0));reduced83.push(...a83.slice(0,4))}candidates.length=0;candidates.push(...reduced83);window.EARTHLINE_REGIONAL_CANDIDATE_REDUCTION_83={before:Array.from(bins83.values()).reduce((n83,a83)=>n83+a83.length,0),after:candidates.length,bins:bins83.size,perBin:4,at:new Date().toISOString()}}\n    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);";

const chromePaths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const chromePath=chromePaths.find(p=>fs.existsSync(p));

async function run(kind){
  const bt=kind==='webkit'?webkit:chromium;
  const opts=kind==='webkit'?{headless:true}:{headless:true,executablePath:chromePath,args:['--no-sandbox']};
  const browser=await bt.launch(opts);
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.route('https://earthlinedevelopment.org/',async route=>{
    const res=await route.fetch();let body=await res.text();if(!body.includes(OLD))throw new Error('candidate reduction insertion owner missing');body=body.replace(OLD,NEW);await route.fulfill({response:res,body});
  });
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(1000);
  const rows=[];
  for(const q of ['Vermont','Arizona']){
    const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
    await page.locator('#searchInput').fill(q);
    const t0=Date.now();
    await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
    await page.waitForFunction(prev=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
      return !!d&&String(d.runToken||'')!==String(prev||'')&&String(d.tier||d.mode||'').toLowerCase()==='regional';
    },before,{timeout:90000});
    await page.waitForTimeout(300);
    const r=await page.evaluate(t0=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
      const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
      let max=-Infinity;for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))max=Math.max(max,n);}
      return {ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Number.isFinite(max)?max:null,reduction:window.EARTHLINE_REGIONAL_CANDIDATE_REDUCTION_83||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null};
    },t0);
    rows.push({q,...r});
    if(r.swales<50||r.rendered<50)throw new Error(kind+' '+q+' coverage regressed '+JSON.stringify(r));
    if(r.maxSlope!==null&&r.maxSlope>4)throw new Error(kind+' '+q+' slope '+r.maxSlope);
    if(kind==='webkit'&&r.ms>45000)throw new Error(kind+' '+q+' still too slow '+r.ms);
  }
  await browser.close();
  return rows;
}
const chrome=await run('chrome');
const webkitRows=await run('webkit');
console.log('M83_CANDIDATE_REDUCTION_PASS '+JSON.stringify({chrome,webkit:webkitRows}));
