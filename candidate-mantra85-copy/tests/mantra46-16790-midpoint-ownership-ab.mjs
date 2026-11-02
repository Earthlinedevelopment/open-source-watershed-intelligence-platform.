import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Louisiana','Maryland','Mississippi','New Hampshire','New Jersey','New Mexico','North Carolina','South Carolina','Tennessee'];
mkdirSync('artifacts/mantra46-16790-midpoint-ab',{recursive:true});

function patchBody(body){
  const old=`      const point16783=c16783=>{
        if(!c16783||!Number.isFinite(Number(c16783.x))||!Number.isFinite(Number(c16783.y)))return null;
        const fx16783=Math.max(0,Math.min(nx16783-1,Math.floor(Number(c16783.x)*nx16783/Math.max(1,hy.w))));
        const fy16783=Math.max(0,Math.min(ny16783-1,Math.floor(Number(c16783.y)*ny16783/Math.max(1,hy.h))));
        const px16783=Math.max(0,Math.min(5,Math.floor(Number(c16783.x)*6/Math.max(1,hy.w))));
        const py16783=Math.max(0,Math.min(5,Math.floor(Number(c16783.y)*6/Math.max(1,hy.h))));
        return {cell:fx16783+','+fy16783,parent:px16783+','+py16783,fx:fx16783,fy:fy16783};
      };`;
  const repl=`      const point16783=c16783=>{
        if(!c16783)return null;
        let gx16783=Number(c16783.x),gy16783=Number(c16783.y);
        const seg16790=Array.isArray(c16783.segment)?c16783.segment:null;
        if(seg16790&&seg16790.length){
          const mid16790=seg16790[Math.floor((seg16790.length-1)/2)],g16790=llGrid(hy,mid16790);
          if(g16790&&Number.isFinite(Number(g16790.x))&&Number.isFinite(Number(g16790.y))){gx16783=Number(g16790.x);gy16783=Number(g16790.y);}
        }
        if(!Number.isFinite(gx16783)||!Number.isFinite(gy16783))return null;
        const fx16783=Math.max(0,Math.min(nx16783-1,Math.floor(gx16783*nx16783/Math.max(1,hy.w))));
        const fy16783=Math.max(0,Math.min(ny16783-1,Math.floor(gy16783*ny16783/Math.max(1,hy.h))));
        const px16783=Math.max(0,Math.min(5,Math.floor(gx16783*6/Math.max(1,hy.w))));
        const py16783=Math.max(0,Math.min(5,Math.floor(gy16783*6/Math.max(1,hy.h))));
        return {cell:fx16783+','+fy16783,parent:px16783+','+py16783,fx:fx16783,fy:fy16783};
      };`;
  const n=body.split(old).length-1;
  if(n!==1)throw new Error('point16783 expected once, found '+n);
  return body.replace(old,repl);
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
      const response=await route.fetch();let body=await response.text();body=patchBody(body);
      await route.fulfill({response,body});return;
    }
    await route.continue();
  });
  try{
    await page.goto(BASE+'?earthline_m46_16790_midpoint='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{
      await page.waitForFunction(q=>{
        const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(e)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:45000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(300);
  }catch(e){loadError=String(e);}
  const a=loadError?{}:await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
  }));
  try{await page.screenshot({path:'artifacts/mantra46-16790-midpoint-ab/'+query.toLowerCase().replace(/\s+/g,'-')+'.png',fullPage:false});}catch(_){}
  const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs:a?.perf?.totalMs??null,
    generated:a?.pub?.generated??null,visible:a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null,unsafe:a?.flow?.unsafeSegments??null,
    rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,lineage:a?.root?.cellLineage??null,
    candidateCells:a?.spread?.candidateCells??null,finalCells:a?.spread?.finalCells??null,targetCells:a?.spread?.targetCells??null,swaps:a?.spread?.swaps??null,
    outsideAfterClip:a?.boundary?.outsideAfterClip??null,lastError:a?.lastError||null};
  results.push(row);console.log('EARTHLINE_M46_16790_MIDPOINT_AB '+JSON.stringify(row));await context.close();
}
await browser.close();
writeFileSync('artifacts/mantra46-16790-midpoint-ab/results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.coreMs)>15000||Number(r.unsafe)!==0||Number(r.generated)!==Number(r.visible)||Number(r.outsideAfterClip?.swales||0)!==0))process.exitCode=1;
