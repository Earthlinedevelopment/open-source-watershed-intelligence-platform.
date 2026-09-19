import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const STATES=['Maryland','Texas','New Jersey','North Carolina','Vermont'];
const browser=await chromium.launch({headless:true});
const results=[];

async function runVariant(name,supplemental){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const patches={};
  await page.route('**/*',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();let body=await resp.text();
    if(supplemental){
      const needle=`    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);
    if(preferredEligibleCount16539<36){`;
      const replacement=`    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);
    if(preferredEligibleCount16539<80){
      for(const f16698 of lines){
        const coords16698=f16698.geometry.coordinates;if(coords16698.length<16)continue;
        for(const frac16698 of [.12,.24,.48,.64,.88]){
          const c16698=sampleSegment(coords16698,Math.max(3,Math.min(coords16698.length-4,Math.round((coords16698.length-1)*frac16698))),false);
          if(c16698)candidates.push(c16698);
        }
      }
    }
    if(preferredEligibleCount16539<36){`;
      const n=body.split(needle).length-1;patches.supplemental=n;if(n!==1)throw new Error('supplemental expected once, found '+n);body=body.replace(needle,replacement);
    }
    return route.fulfill({response:resp,body});
  });

  await page.goto(URL+'?normal_supplemental_'+name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  for(const stateName of STATES){
    const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
    await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
    let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return !!e||((!prev||at!==prev)&&!!at);},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(300);
    const snap=await page.evaluate(q=>{
      const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
      const mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;};
      const pts=sw.map(mid).filter(Array.isArray);
      const reg=fn=>pts.filter(p=>fn(+p[0],+p[1])).length;
      let regions=null;
      if(/maryland/i.test(q))regions={west:reg(x=>x<-78),central:reg(x=>x>=-78&&x<-76.8),east:reg(x=>x>=-76.8),north:reg((x,y)=>y>=39),south:reg((x,y)=>y<39)};
      if(/texas/i.test(q))regions={panhandle:reg((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:reg((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerGulf:reg((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:reg((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)};
      const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
      return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,rejected:g?.jurisdictionRejectedCandidates??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,regions,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
    },stateName);
    const row={variant:name,state:stateName,elapsedMs:Date.now()-started,timedOut,patches,snap};results.push(row);console.log('EARTHLINE_NORMAL_SUPPLEMENTAL '+JSON.stringify(row));
  }
  await page.close();
}

await runVariant('baseline',false);
await runVariant('supplemental',true);
console.log('EARTHLINE_NORMAL_SUPPLEMENTAL_SUMMARY '+JSON.stringify(results));
await browser.close();

const cand=results.filter(r=>r.variant==='supplemental');
const bad=cand.some(r=>r.timedOut||r.snap.lastError||!(Number(r.snap.totalMs)<=15000)||Number(r.snap.unsafe||0)!==0||Number(r.snap.outside?.swales||0)!==0||Number(r.snap.visible)!==Number(r.snap.published));
if(bad)process.exitCode=1;
