import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const BASE='https://earthlinedevelopment.org/candidate-mantra92/';
const CASES=['Arizona','Arkansas','Iowa','Vermont'];
const EXPECTED='dcf6b9cfd38d51359cfa67049963bc2b9e45add2013c37c2a9dacf19b4cdb42e';
const output='artifacts/mantra92-live-visual';
mkdirSync(output,{recursive:true});
const r=await fetch(BASE+'?manifest_check='+Date.now(),{headers:{'Cache-Control':'no-cache'}});
if(!r.ok)throw Error('Preview HTML is not live, status '+r.status);
const raw=Buffer.from(await r.arrayBuffer());
const hash=createHash('sha256').update(raw).digest('hex');
if(hash!==EXPECTED)throw Error('Published HTML does not match tested science/visual candidate. Live '+hash+' expected '+EXPECTED);
const manifest=await (await fetch(BASE+'RELEASE-CANDIDATE.json')).json();
if(manifest.previewHtmlSHA256!==EXPECTED||manifest.previewOfCandidateSha!=='166f5a603ef0762889972f1011ef4fac3d206f87')
  throw Error('Public release manifest does not match pinned visual correction.');
console.log('M92_LIVE_PREVIEW_SHA '+JSON.stringify({url:BASE,sha256:hash,sourceCommit:manifest.previewOfCandidateSha}));
const browser=await chromium.launch({headless:true});
const results=[];
for(const name of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:832}});
  const page=await context.newPage(),errors=[],bad=[];
  page.on('pageerror',x=>errors.push(String(x)));
  page.on('response',res=>{if(res.status()>=400&&res.url().startsWith(BASE))bad.push({code:res.status(),url:res.url()})});
  let failure=null;const t=Date.now();
  try{
    await page.goto(BASE+'?m92_live_'+encodeURIComponent(name)+'='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:16000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput');
      const b=document.getElementById('runBtn');
      if(!i||!b)throw Error('Search/Run missing');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },name);
    await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
      !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:100000,polling:200});
    await page.waitForTimeout(1100);
  }catch(e){failure=String(e)}
  const snap=await page.evaluate(()=>{
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{};
    const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
    const group=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
    const paths=[...(group?.querySelectorAll(':scope > path')||[])];
    const swaleCasing=paths.filter(x=>x.getAttribute('stroke')==='rgba(8,18,13,.96)');
    const core=paths.filter(x=>(x.getAttribute('class')||'').includes('earthline-swale-core-16168'));
    const widths=x=>x.map(p=>parseFloat(getComputedStyle(p).strokeWidth)).filter(Number.isFinite);
    const wc=widths(swaleCasing), wcore=widths(core);
    const great=swaleCasing.filter(p=>{
      const w=parseFloat(getComputedStyle(p).strokeWidth)||0;let len=Infinity;
      try{len=p.getTotalLength()}catch{}
      return len<3&&w>=10;
    });
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
    const waterWidth=[];
    if(map?.getStyle){for(const layer of map.getStyle()?.layers||[])
      if(/earthline-regional-flow/.test(layer.id))waterWidth.push({name:layer.id,width:layer.paint?.['line-width']||null});}
    return {coreMs:perf.phaseTotalsMs?.coreTotalMs??null,swales:p.generated??null,
      sourceCount:p.sourceFeatures??null,displayed:p.overlaySwaleLines??null,
      waterPaths:perf.waterPaths??null,profile:pkg.profileId||null,
      blackCount:swaleCasing.length,maxBlackWidth:Math.max(0,...wc),
      oversizedBlackDots:great.length,coreCount:core.length,maxCoreWidth:Math.max(0,...wcore),
      waterWidth,runError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      tier:document.documentElement.dataset.earthlineAnalysisTier||null};
  }).catch(e=>({evaluationError:String(e)}));
  const fails=[];
  if(failure||errors.length||snap.runError||snap.evaluationError)fails.push('browser/runtime error');
  if(bad.length)fails.push('asset 4xx/5xx');
  if(!Number.isFinite(snap.coreMs)||snap.coreMs>15000)fails.push('Regional >15 sec');
  if(!Number.isInteger(snap.swales)||snap.swales<=0||snap.sourceCount!==snap.swales||snap.displayed!==snap.swales)
    fails.push('missing or mismatched swales');
  if(snap.oversizedBlackDots!==0||snap.maxBlackWidth>=10)fails.push('black-dot regression');
  if(snap.coreCount!==snap.swales||snap.maxCoreWidth>10)fails.push('swale core regression');
  const row={name,wallMs:Date.now()-t,snap,fails,pass:fails.length===0,errors,bad,failure};
  results.push(row);console.log('M92_LIVE_BROWSER '+JSON.stringify(row));
  await page.screenshot({path:output+'/'+name.toLowerCase()+'.png',fullPage:false}).catch(()=>{});
  await context.close();
}
await browser.close();
writeFileSync(output+'/results.json',JSON.stringify({hash,manifest,results},null,2));
console.log('M92_LIVE_SUMMARY '+JSON.stringify({pass:results.every(x=>x.pass),passed:results.filter(x=>x.pass).length,states:results.length,failures:results.filter(x=>!x.pass).map(x=>({name:x.name,fails:x.fails}))}));
if(results.some(x=>!x.pass))process.exitCode=1;
