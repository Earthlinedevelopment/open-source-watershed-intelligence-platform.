import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const ALL=['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const STATES=(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean); const targets=STATES.length?STATES:ALL;
const REPEATS=Math.max(1,Number(process.env.REPEATS||1));
const OUTDIR=process.env.OUTDIR||'artifacts/earthline-16852-us-regional';
mkdirSync(OUTDIR,{recursive:true});
const browser=await chromium.launch({headless:true}); const rows=[];
for(const query of targets){for(let repeat=1;repeat<=REPEATS;repeat++){
 const context=await browser.newContext({viewport:{width:1800,height:950}}); const page=await context.newPage();
 const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e))); let loadError=null,timedOut=false; const started=Date.now();
 try{
  await page.goto(BASE+'?earthline_16852='+encodeURIComponent(query)+'_'+repeat+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const marker=await page.evaluate(()=>document.documentElement.outerHTML.includes('EARTHLINE 16844 — FINAL FINE-SUPPORT REGIONAL CAPACITY'));
  if(!marker)throw new Error('candidate does not contain 16844 production marker');
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');if(!i||!b)throw new Error('search controls unavailable');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  try{await page.waitForFunction(q=>{const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(err)return true;const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;return /screening published\./i.test(s)&&!!pub&&!!perf;},query,{timeout:45000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(250);
 }catch(e){loadError=String(e);}
 const a=loadError?{}:await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()}));
 const coreMs=a?.perf?.totalMs??null, generated=a?.pub?.generated??null, visible=a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null, unsafe=a?.flow?.unsafeSegments??null, outside=a?.boundary?.outsideAfterClip??null;
 const pass=!loadError&&!timedOut&&!a?.lastError&&!pageErrors.length&&Number(coreMs)<=15000&&Number(generated)===Number(visible)&&Number(unsafe)===0&&Number(outside?.swales||0)===0;
 const row={query,repeat,pass,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs,generated,visible,unsafe,outsideAfterClip:outside,lastError:a?.lastError||null,status:a?.status||''}; rows.push(row); console.log('EARTHLINE_16852_US '+JSON.stringify(row));
 if(['Alaska','Arkansas','Iowa','Oklahoma','New York','Vermont'].includes(query)){try{await page.screenshot({path:`${OUTDIR}/${query.toLowerCase().replace(/\s+/g,'-')}-${repeat}.png`,fullPage:false});}catch(_){}}
 await context.close();
}}
await browser.close();
const summary={total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,failed:rows.filter(r=>!r.pass).map(r=>({query:r.query,repeat:r.repeat,coreMs:r.coreMs,generated:r.generated,visible:r.visible,unsafe:r.unsafe,outside:r.outsideAfterClip,loadError:r.loadError,timedOut:r.timedOut,lastError:r.lastError})),over15:rows.filter(r=>Number(r.coreMs)>15000).map(r=>({query:r.query,repeat:r.repeat,coreMs:r.coreMs}))};
writeFileSync(`${OUTDIR}/results.json`,JSON.stringify({summary,rows},null,2)); console.log('EARTHLINE_16852_US_SUMMARY '+JSON.stringify(summary)); if(summary.fail)process.exitCode=1;
