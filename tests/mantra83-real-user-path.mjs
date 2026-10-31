// production abf4e3c6 actual-control verification
// production f7c2020 actual control verification
import {chromium,devices} from 'playwright';

const browser=await chromium.launch({headless:true});
const cases=[
  {name:'desktop',opts:{viewport:{width:1440,height:900}},touch:false},
  {name:'iPhone 13',opts:{...devices['iPhone 13']},touch:true},
  {name:'Pixel 7',opts:{...devices['Pixel 7']},touch:true}
];
const out=[];
for(const c of cases){
  const ctx=await browser.newContext(c.opts);
  const p=await ctx.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
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
      if(c.touch)await button.tap({timeout:10000});else await button.click({timeout:10000});
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
console.log('M83_PRODUCTION_REAL_USER_PATH '+JSON.stringify({out,failures}));
if(failures.length)process.exitCode=2;
