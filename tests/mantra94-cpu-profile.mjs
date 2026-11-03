import {chromium} from 'playwright';
import {existsSync,statSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const BASE='https://earthlinedevelopment.org/';
const ROOT=process.cwd();
const states=['New York','Arizona'];
mkdirSync('artifacts/m94-cpu',{recursive:true});
const browser=await chromium.launch({headless:true});
for(const state of states){
  const ctx=await browser.newContext({viewport:{width:1600,height:950}});
  const page=await ctx.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.origin!==new URL(BASE).origin)return route.continue();
    let rel;try{rel=decodeURIComponent(u.pathname).replace(/^\/+/,'')||'index.html'}catch{return route.abort()}
    const file=path.resolve(ROOT,rel);
    if(file!==ROOT&&!file.startsWith(ROOT+path.sep))return route.abort();
    if(existsSync(file)&&statSync(file).isFile()){
      const ext=path.extname(file).toLowerCase();
      const ct={'.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.geojson':'application/geo+json','.html':'text/html; charset=utf-8','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'};
      return route.fulfill({status:200,contentType:ct[ext]||'application/octet-stream',body:readFileSync(file)});
    }
    return route.continue();
  });
  let failure=null,record=null;
  try{
    await page.goto(BASE+'?m94_cpu='+encodeURIComponent(state)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:20000});
    const cdp=await ctx.newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval',{interval:1000});
    await cdp.send('Profiler.start');
    const t=Date.now();
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      b.click();
    },state);
    try{
      await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
        !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:100000,polling:200});
    }catch(e){failure=String(e)}
    const durationMs=Date.now()-t;
    const metrics=await page.evaluate(()=>({
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      swale:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    }));
    const {profile}=await cdp.send('Profiler.stop');
    const nodes=new Map(profile.nodes.map(n=>[n.id,n]));
    const totals=new Map();
    for(let i=0;i<(profile.samples||[]).length;i++){
      const n=nodes.get(profile.samples[i]); if(!n)continue;
      const f=n.callFrame||{};
      const loc=(f.url||'').split('?')[0].split('/').slice(-1)[0];
      const key=(f.functionName||'(anonymous)')+' @'+loc+':'+(f.lineNumber+1);
      totals.set(key,(totals.get(key)||0)+(profile.timeDeltas?.[i]||1000)/1000);
    }
    const frames=[...totals].sort((a,b)=>b[1]-a[1]).slice(0,35).map(([name,selfMs])=>({name,selfMs:Math.round(selfMs)}));
    record={state,durationMs,coreMs:metrics.perf?.phaseTotalsMs?.coreTotalMs??null,phases:metrics.perf?.phaseTotalsMs||null,swaleCount:metrics.swale?.generated??null,runError:metrics.error||failure,errors,frames};
    console.log('M94_CPU_PROFILE_RESULT '+JSON.stringify(record));
  }catch(e){record={state,fatal:String(e),errors};console.log('M94_CPU_PROFILE_ERROR '+JSON.stringify(record))}
  writeFileSync('artifacts/m94-cpu/'+state.toLowerCase().replace(/\s+/g,'-')+'.json',JSON.stringify(record,null,2));
  await ctx.close();
}
await browser.close();