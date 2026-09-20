import { chromium } from 'playwright';

const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

async function runCandidate(label,patchSlope){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  let patchA=0,patchB=0;
  if(patchSlope){
    await page.route('**/*',async route=>{
      if(route.request().resourceType()!=='document')return route.continue();
      const resp=await route.fetch();let body=await resp.text();
      const a=`        const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=relaxed?18:13.5;`;
      const ar=`        const slope=hy.slope[i],acc=hy.acc[i],minSlope=.05,maxSlope=4;`;
      const b=`      const slopeScore=Math.max(0,1-Math.abs(meanSlope-3.4)/(relaxed?12:7.5));`;
      const br=`      const slopeScore=(meanSlope>=.05&&meanSlope<=4)?1:0;`;
      patchA=body.split(a).length-1;patchB=body.split(b).length-1;
      if(patchA!==1||patchB!==1)throw new Error('slope patch anchors '+patchA+'/'+patchB);
      body=body.replace(a,ar).replace(b,br);
      return route.fulfill({response:resp,body});
    });
  }
  await page.goto(BASE+'?tx_flat_slope_'+label+'='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const rows=[];
  for(let repeat=1;repeat<=3;repeat++){
    const prior=await page.evaluate(()=>String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||'')),started=Date.now();
    await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
    let timedOut=false;try{await page.waitForFunction(prev=>{const t=String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!e||((!prev||t!==prev)&&!!t&&/screening published\./i.test(s));},prior,{timeout:45000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(350);
    const snap=await page.evaluate(()=>{
      const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[],mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;},pts=sw.map(f=>({p:mid(f),s:Number(f?.properties?.slope_pct)})).filter(r=>Array.isArray(r.p));
      const reg=fn=>pts.filter(r=>fn(+r.p[0],+r.p[1])).length,slopes=pts.map(r=>r.s).filter(Number.isFinite).sort((a,b)=>a-b);
      const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
      return {
        swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,
        regions:{panhandle:reg((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:reg((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerGulf:reg((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:reg((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)},
        slopes:{min:slopes[0]??null,median:slopes.length?slopes[Math.floor(slopes.length/2)]:null,max:slopes.length?slopes[slopes.length-1]:null,le1:slopes.filter(x=>x<=1).length,le2:slopes.filter(x=>x<=2).length,le4:slopes.filter(x=>x<=4).length},
        lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
      };
    });
    rows.push({repeat,elapsedMs:Date.now()-started,timedOut,snap});
  }
  await page.close();return {label,patches:{eligibility:patchA,ranking:patchB},rows};
}

const control=await runCandidate('control',false);
const candidate=await runCandidate('le4',true);
console.log('EARTHLINE_TX_FLAT_SLOPE '+JSON.stringify({control,candidate}));
await browser.close();
if(candidate.patches.eligibility!==1||candidate.patches.ranking!==1||candidate.rows.some(r=>r.timedOut||r.snap.lastError||Number(r.snap.unsafe||0)!==0||Number(r.snap.outside?.swales||0)!==0||Number(r.snap.visible)!==Number(r.snap.published)||!(Number(r.snap.totalMs)<=15000)))process.exitCode=1;
