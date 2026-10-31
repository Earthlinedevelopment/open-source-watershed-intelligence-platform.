import {chromium,devices} from 'playwright';

const REPS=[
  ["const start16839=performance.now(),N16839=24,groupSize16839=6,channel16839=percentile(hy.acc,.972),rows16839=[];","const start16839=performance.now(),N16839=24,groupSize16839=24,channel16839=percentile(hy.acc,.972),rows16839=[];"],
  ["if(chosenBins16730.length>=4)break;","if(chosenBins16730.length>=3)break;"],
  ["const refinementTileBudget16782=Math.min(16,Math.max(8,Math.ceil(gapsBefore16780.length/3)));","const refinementTileBudget16782=Math.min(8,Math.max(4,Math.ceil(gapsBefore16780.length/3)));"],
  ["const lateBins16741=unresolved16731.slice(0,4),lateStart16741=performance.now();","const lateBins16741=unresolved16731.slice(0,2),lateStart16741=performance.now();"]
];

const browser=await chromium.launch({headless:true});
const cases=[
  {name:'desktop',opts:{viewport:{width:1440,height:900}}},
  {name:'iPhone 13',opts:{...devices['iPhone 13']}},
  {name:'Pixel 7',opts:{...devices['Pixel 7']}}
];
const out=[];
for(const c of cases){
  const ctx=await browser.newContext(c.opts);
  const p=await ctx.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.route('https://earthlinedevelopment.org/',async route=>{
    const response=await route.fetch();let body=await response.text();
    for(const [a,b] of REPS){if(!body.includes(a))throw new Error('candidate owner missing');body=body.replace(a,b);}
    await route.fulfill({response,body});
  });
  await p.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForTimeout(1600);
  for(const q of ['Vermont','Arizona']){
    const input=p.locator('#searchInput');
    await input.fill(q);
    const before=await p.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
    const button=p.locator('button:visible').filter({hasText:/RUN ANALYSIS/i}).first();
    const count=await button.count();
    if(!count){out.push({device:c.name,q,completed:false,error:'RUN ANALYSIS button not visible',errors});continue;}
    const t=Date.now();
    try{
      await button.tap({timeout:10000});
      await p.waitForFunction(prev=>{
        const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
        return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
      },before,{timeout:120000});
      await p.waitForTimeout(400);
      out.push(await p.evaluate(({device,q,t,errors})=>{
        const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
        return {device,q,completed:true,wallMs:Date.now()-t,tier:d?.tier||d?.mode,swales:Number(d?.derived?.swaleOpportunityLines||0),errors};
      },{device:c.name,q,t,errors}));
    }catch(e){
      out.push({device:c.name,q,completed:false,error:String(e?.message||e),elapsedMs:Date.now()-t,errors});
    }
  }
  await ctx.close();
}
await browser.close();
const failures=out.filter(r=>!r.completed||String(r.tier||'').toLowerCase()!=='regional'||!(r.swales>0)||r.wallMs>20000);
console.log('M83_REAL_USER_PATH '+JSON.stringify({out,failures}));
if(failures.length)process.exitCode=2;
