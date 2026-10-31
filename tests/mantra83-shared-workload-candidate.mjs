import {chromium,devices} from 'playwright';

const REPS=[
  ["const start16839=performance.now(),N16839=24,groupSize16839=6,channel16839=percentile(hy.acc,.972),rows16839=[];","const start16839=performance.now(),N16839=24,groupSize16839=12,channel16839=percentile(hy.acc,.972),rows16839=[];"],
  ["if(chosenBins16730.length>=4)break;","if(chosenBins16730.length>=3)break;"],
  ["const refinementTileBudget16782=Math.min(16,Math.max(8,Math.ceil(gapsBefore16780.length/3)));","const refinementTileBudget16782=Math.min(8,Math.max(4,Math.ceil(gapsBefore16780.length/3)));"],
  ["const lateBins16741=unresolved16731.slice(0,4),lateStart16741=performance.now();","const lateBins16741=unresolved16731.slice(0,2),lateStart16741=performance.now();"]
];

const browser=await chromium.launch({headless:true});
const cases=[
  {name:'desktop',opts:{viewport:{width:1440,height:900}}},
  {name:'phone',opts:{...devices['iPhone 13']}}
];
const out=[];
for(const c of cases){
  const ctx=await browser.newContext(c.opts);
  const p=await ctx.newPage();
  await p.route('https://earthlinedevelopment.org/',async route=>{
    const response=await route.fetch(); let body=await response.text();
    for(const [a,b] of REPS){if(!body.includes(a))throw new Error('owner missing');body=body.replace(a,b);}
    await route.fulfill({response,body});
  });
  await p.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForTimeout(1600);
  for(const q of ['Vermont','Arizona','Arkansas','Iowa']){
    const before=await p.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
    await p.locator('#searchInput').fill(q);
    const t=Date.now();
    await p.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
    await p.waitForFunction(prev=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
      return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
    },before,{timeout:120000});
    await p.waitForTimeout(500);
    out.push(await p.evaluate(({name,q,t})=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
      const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
      let max=-Infinity;
      const sig=[];
      for(const f of fs){
        const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))max=Math.max(max,n);
        const c=f?.geometry?.coordinates||[],m=c[Math.floor((c.length-1)/2)]||[];
        sig.push([Number(m[0]||0).toFixed(4),Number(m[1]||0).toFixed(4),Number(n||0).toFixed(2)].join(','));
      }
      sig.sort();
      return {
        name,q,wallMs:Date.now()-t,swales:Number(d?.derived?.swaleOpportunityLines||0),
        water:Number(d?.derived?.waterPaths||0),contours:Number(d?.derived?.contours||0),
        maxSlope:Number.isFinite(max)?max:null,signature:sig,
        perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null
      };
    },{name:c.name,q,t}));
  }
  await ctx.close();
}
await browser.close();

const failures=[];
for(const r of out){
  if(!(r.swales>0))failures.push(r.name+' '+r.q+' zero swales');
  if(r.maxSlope!==null&&r.maxSlope>4)failures.push(r.name+' '+r.q+' slope '+r.maxSlope);
  if(r.wallMs>20000)failures.push(r.name+' '+r.q+' slow '+r.wallMs);
}
for(const q of ['Vermont','Arizona','Arkansas','Iowa']){
  const d=out.find(r=>r.name==='desktop'&&r.q===q),m=out.find(r=>r.name==='phone'&&r.q===q);
  if(!d||!m||JSON.stringify(d.signature)!==JSON.stringify(m.signature))failures.push(q+' desktop/phone geometry mismatch');
}
console.log('M83_SHARED_WORKLOAD_CANDIDATE '+JSON.stringify({out:out.map(r=>({...r,signature:undefined})),failures}));
if(failures.length)process.exitCode=2;
