import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra46-16795-ar-gap-ab';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const rows=[];

async function runOne(label,patch){
  const context=await browser.newContext({viewport:{width:1908,height:882}});
  if(patch){
    await context.route('https://earthlinedevelopment.org/**',async route=>{
      const req=route.request();
      if(req.resourceType()!=='document')return route.continue();
      const resp=await route.fetch();
      let body=await resp.text();
      const old='if(used16780>=2)continue;';
      const count=body.split(old).length-1;
      if(count!==1)throw new Error('expected one parent-cap owner, found '+count);
      body=body.replace(old,'if(used16780>=3)continue;');
      await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
    });
  }

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  const started=Date.now();

  await page.goto(BASE+'?m46_16795_ab='+label+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='Arkansas';
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    b.click();
  });
  await page.waitForFunction(()=>{
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
    return /screening published\./i.test(s)&&root&&String(root.query||'').toLowerCase().includes('arkansas');
  },{timeout:55000,polling:100});
  await page.waitForTimeout(1500);

  const result=await page.evaluate(()=>{
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const fine=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null;
    const spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const bbox=pkg?.location?.bbox||[-94.61786,33.0043,-89.641,36.49953];
    const cellFor=(lng,lat)=>({
      bx:Math.max(0,Math.min(11,Math.floor((lng-bbox[0])/(bbox[2]-bbox[0])*12))),
      by:Math.max(0,Math.min(11,Math.floor((bbox[3]-lat)/(bbox[3]-bbox[1])*12)))
    });

    let data=null;
    try{data=earthlineMap.getSource('el-live-swales-15970')?._data||null}catch(_){}
    const counts={};
    for(const f of data?.features||[]){
      const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;
      if(!c||!c.length)continue;
      const mid=c[Math.floor((c.length-1)/2)];
      const cell=cellFor(Number(mid[0]),Number(mid[1]));
      const k=cell.bx+','+cell.by;counts[k]=(counts[k]||0)+1;
    }

    const selected=new Set((fine?.selected||[]).map(r=>r.bx+','+r.by));
    const unresolved=new Set((fine?.unresolvedAfter||[]).map(r=>r.bx+','+r.by));
    const final=new Set(spread?.finalCellKeys||[]);
    return {
      selected66:selected.has('6,6'),
      unresolved66:unresolved.has('6,6'),
      displayed66:Number(counts['6,6']||0),
      displayed65:Number(counts['6,5']||0),
      displayed64:Number(counts['6,4']||0),
      fineSelected:fine?.selected||[],
      fineAdded:fine?.added??null,
      fineUnresolved:fine?.unresolvedAfter||[],
      final66:final.has('6,6'),
      coreMs:perf?.totalMs??null,
      generated:pub?.generated??null,
      visible:display?.swaleLines??pub?.overlaySwaleLines??null,
      unsafe:flow?.unsafeSegments??null,
      outside:boundary?.outsideAfterClip??null
    };
  });

  const row={label,patch,pageErrors,elapsedMs:Date.now()-started,...result};
  rows.push(row);
  console.log('EARTHLINE_M46_16795_AR_AB '+JSON.stringify(row));
  await page.screenshot({path:OUT+'/'+label+'.png',fullPage:false});
  await context.close();
}

await runOne('control-16794',false);
await runOne('variant-parent-cap-3',true);
await browser.close();

writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));

const control=rows[0],variant=rows[1];
if(
  variant.pageErrors.length ||
  variant.unsafe!==0 ||
  Number(variant.coreMs)>15000 ||
  Number(variant.generated)!==Number(variant.visible) ||
  !variant.selected66 ||
  variant.unresolved66 ||
  variant.displayed66<1 ||
  variant.displayed66<=control.displayed66
){
  process.exitCode=1;
}
