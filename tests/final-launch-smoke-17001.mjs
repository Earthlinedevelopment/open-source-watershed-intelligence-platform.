import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const ROLLOUT=['Vermont','Maryland','New York','Massachusetts','Arizona','Colorado','New Mexico','Nevada','Utah','Oklahoma','California','Nebraska','North Carolina','Texas','Alabama','Alaska','Florida','Hawaii','Idaho','Missouri','Virginia'];
const WATCH=['Iowa','Arkansas'];
const ALL=['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const REST=ALL.filter(s=>!ROLLOUT.includes(s)&&!WATCH.includes(s));
const STATES=[...ROLLOUT,...WATCH,...REST];
mkdirSync('artifacts/final-launch-smoke-17001',{recursive:true});

const browser=await chromium.launch({headless:true});
const results=[];

async function runState(query,attempt){
  const context=await browser.newContext({viewport:{width:1600,height:900}});
  const page=await context.newPage();
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false; const started=Date.now();
  try{
    await page.goto(BASE+'?final_launch_17001='+encodeURIComponent(query)+'_'+attempt+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#searchInput',{timeout:15000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      if(!i||!b)throw new Error('search controls unavailable');
      i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(()=>{
        const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(err)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;
      },{timeout:25000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(300);
  }catch(e){loadError=String(e);}
  const a=loadError?{}:await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
  }));
  await context.close();
  const coreMs=a?.perf?.totalMs??null;
  const generated=a?.pub?.generated??null;
  const visible=a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null;
  const unsafe=a?.flow?.unsafeSegments??null;
  const outside=a?.boundary?.outsideAfterClip??null;
  const published=/screening published\./i.test(a?.status||'');
  const perfPass=Number.isFinite(Number(coreMs))&&Number(coreMs)>0&&Number(coreMs)<=15000;
  const swalePass=generated==null||visible==null?true:(Number(generated)>0&&Number(generated)===Number(visible));
  const safetyPass=unsafe==null||Number(unsafe)===0;
  const boundaryPass=outside==null||Number(outside?.swales||0)===0;
  const pass=!loadError&&!timedOut&&!a?.lastError&&!pageErrors.length&&published&&perfPass&&swalePass&&safetyPass&&boundaryPass;
  return {query,attempt,pass,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs,generated,visible,unsafe,outsideAfterClip:outside,lastError:a?.lastError||null,status:a?.status||''};
}

for(const query of STATES){
  let row;
  for(let attempt=1;attempt<=3;attempt++){
    row=await runState(query,attempt);
    if(row.pass)break;
    const transient=String(row?.lastError?.error||row?.loadError||'').toLowerCase().includes('failed to fetch');
    if(!transient)break;
    await new Promise(r=>setTimeout(r,1800));
  }
  row.phase=ROLLOUT.includes(query)?'rollout':WATCH.includes(query)?'watch':'remaining';
  results.push(row);
  console.log('EARTHLINE_FINAL_17001 '+JSON.stringify(row));
  await new Promise(r=>setTimeout(r,500));
}
await browser.close();

const group=p=>results.filter(r=>r.phase===p);
const summary={
 total:results.length,pass:results.filter(r=>r.pass).length,fail:results.filter(r=>!r.pass).length,
 rollout:{total:group('rollout').length,pass:group('rollout').filter(r=>r.pass).length,fail:group('rollout').filter(r=>!r.pass).map(r=>r.query)},
 watch:{total:group('watch').length,pass:group('watch').filter(r=>r.pass).length,fail:group('watch').filter(r=>!r.pass).map(r=>r.query)},
 remaining:{total:group('remaining').length,pass:group('remaining').filter(r=>r.pass).length,fail:group('remaining').filter(r=>!r.pass).map(r=>r.query)},
 failed:results.filter(r=>!r.pass),
 over15:results.filter(r=>Number(r.coreMs)>15000).map(r=>({query:r.query,coreMs:r.coreMs})),
 unsafe:results.filter(r=>r.unsafe!=null&&Number(r.unsafe)!==0).map(r=>({query:r.query,unsafe:r.unsafe})),
 mismatch:results.filter(r=>r.generated!=null&&r.visible!=null&&Number(r.generated)!==Number(r.visible)).map(r=>({query:r.query,generated:r.generated,visible:r.visible}))
};
writeFileSync('artifacts/final-launch-smoke-17001/results.json',JSON.stringify({summary,results},null,2));
console.log('EARTHLINE_FINAL_17001_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
