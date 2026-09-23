import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Iowa','Arkansas','Oklahoma','Nebraska','Vermont','Texas','Florida','Louisiana','California','New York','Maryland','Colorado'];
const OUT='artifacts/mantra46-16802-targeted-regression';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();let body=await resp.text();
    const repl=[
      ['const nx16783=12,ny16783=12;','const nx16783=24,ny16783=24;',1],
      ['const cx16791=Math.max(0,Math.min(11,Math.floor(Number(g16791.x)*12/Math.max(1,hy.w))));','const cx16791=Math.max(0,Math.min(nx16783-1,Math.floor(Number(g16791.x)*nx16783/Math.max(1,hy.w))));',1],
      ['const cy16791=Math.max(0,Math.min(11,Math.floor(Number(g16791.y)*12/Math.max(1,hy.h))));','const cy16791=Math.max(0,Math.min(ny16783-1,Math.floor(Number(g16791.y)*ny16783/Math.max(1,hy.h))));',1]
    ];
    for(const [oldv,newv,expected] of repl){const c=body.split(oldv).length-1;if(c!==expected)throw new Error('16802 owner mismatch '+oldv+' count='+c);body=body.replace(oldv,newv);}
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  try{
    await page.goto(BASE+'?m46_16802_reg='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{await page.waitForFunction(q=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;return /screening published\./i.test(s)&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());},query,{timeout:60000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(1000);
  }catch(e){loadError=String(e);}

  const a=loadError||timedOut?null:await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    pkg:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
    spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
    center:(()=>{try{const c=earthlineMap.getCenter();return{lng:c.lng,lat:c.lat,zoom:earthlineMap.getZoom()}}catch(_){return null}})()
  }));
  const coreMs=a?.perf?.totalMs??null,generated=a?.pub?.generated??null,visible=a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null,unsafe=a?.flow?.unsafeSegments??null,outside=a?.boundary?.outsideAfterClip??null,pkgName=a?.pkg?.identity?.name??null;
  const hardRootFail=Array.isArray(a?.root?.rankedCauses)&&a.root.rankedCauses.some(r=>r.status==='critical'||r.status==='fail');
  const pass=!!a&&!pageErrors.length&&Number(coreMs)<=15000&&Number(generated)===Number(visible)&&Number(unsafe)===0&&Number(outside?.swales||0)===0&&!hardRootFail&&pkgName===query&&a.center&&Number(a.center.zoom)>=5;
  const row={query,pass,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs,generated,visible,unsafe,outside,pkgName,spread:{candidateCells:a?.spread?.candidateCells,chosenCount:a?.spread?.chosenCount,initialCells:a?.spread?.initialCells,finalCells:a?.spread?.finalCells,targetCells:a?.spread?.targetCells,stop:a?.spread?.selectionStopReason,swaps:a?.spread?.swaps}};
  rows.push(row);console.log('EARTHLINE_M46_16802_REG '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase().replace(/\s+/g,'-')+'.png',fullPage:false});}catch(_){ }
  await context.close();
}
await browser.close();
const summary={total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,failed:rows.filter(r=>!r.pass).map(r=>r.query),over15:rows.filter(r=>Number(r.coreMs)>15000).map(r=>({query:r.query,coreMs:r.coreMs})),unsafe:rows.filter(r=>Number(r.unsafe)!==0).map(r=>({query:r.query,unsafe:r.unsafe})),pageErrors:rows.filter(r=>r.pageErrors?.length).map(r=>({query:r.query,pageErrors:r.pageErrors}))};
writeFileSync(OUT+'/results.json',JSON.stringify({summary,rows},null,2));console.log('EARTHLINE_M46_16802_REG_SUMMARY '+JSON.stringify(summary));if(summary.fail)process.exitCode=1;
