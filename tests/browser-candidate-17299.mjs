import { chromium, firefox, webkit } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const html=readFileSync('index.html','utf8');
const BASE='https://earthlinedevelopment.org/';
const STATES=['Arizona','New Mexico','Colorado','Texas','California','Vermont','New York'];
const BROWSER=(process.env.BROWSER||'webkit').toLowerCase();
const browserType=BROWSER==='firefox'?firefox:BROWSER==='chromium'?chromium:webkit;
const HEADLESS=BROWSER==='firefox'?false:true;
mkdirSync('artifacts/browser-rollout-17299/'+BROWSER,{recursive:true});
const browser=await browserType.launch({headless:HEADLESS});
const rows=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  await page.route('https://earthlinedevelopment.org/**',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(req.resourceType()==='document'&&(u.pathname==='/'||u.pathname==='/index.html')){
      await route.fulfill({status:200,body:html,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
      return;
    }
    await route.continue();
  });
  let loadError=null,timedOut=false;const started=Date.now();
  try{
    await page.goto(BASE+'?browser_rollout_17299='+BROWSER+'_'+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      if(!i||!b)throw new Error('search controls unavailable');
      i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:120000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(400);
  }catch(e){loadError=String(e);}

  const a=loadError?{}:await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
  }));
  const coreMs=a?.perf?.totalMs??null,generated=a?.pub?.generated??null,visible=a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null,unsafe=a?.flow?.unsafeSegments??null,outside=a?.boundary?.outsideAfterClip??null;
  const hardRootFail=Array.isArray(a?.root?.rankedCauses)&&a.root.rankedCauses.some(r=>r.status==='critical'||r.status==='fail');
  const pass=!loadError&&!timedOut&&!a?.lastError&&!pageErrors.length&&Number(coreMs)<=15000&&Number(generated)===Number(visible)&&Number(unsafe)===0&&Number(outside?.swales||0)===0&&!hardRootFail;
  const row={query,browser:BROWSER,pass,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs,generated,visible,unsafe,outsideAfterClip:outside,rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,lastError:a?.lastError||null,status:a?.status||'',origin:await page.evaluate(()=>location.origin)};
  rows.push(row);
  console.log('EARTHLINE_BROWSER_ROLLOUT_17299 '+JSON.stringify(row));
  try{await page.screenshot({path:'artifacts/browser-rollout-17299/'+BROWSER+'/'+query.toLowerCase().replace(/\s+/g,'-')+'.png'});}catch(_){}
  await context.close();
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,failed:rows.filter(r=>!r.pass).map(r=>r.query),over15:rows.filter(r=>Number(r.coreMs)>15000).map(r=>({query:r.query,coreMs:r.coreMs})),unsafe:rows.filter(r=>Number(r.unsafe)!==0).map(r=>({query:r.query,unsafe:r.unsafe})),mismatch:rows.filter(r=>Number(r.generated)!==Number(r.visible)).map(r=>({query:r.query,generated:r.generated,visible:r.visible}))};
writeFileSync('artifacts/browser-rollout-17299/'+BROWSER+'/results.json',JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_BROWSER_ROLLOUT_17299_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;