import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const results=[];

async function runVariant(name,coastDense){
 const page=await browser.newPage({viewport:{width:1800,height:1000}});
 const patches={};
 await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(label,needle,replacement)=>{const n=body.split(needle).length-1;patches[label]=n;if(n!==1)throw new Error(label+' expected 1, found '+n);body=body.replace(needle,replacement);};
  if(coastDense){
   apply('coastDense',
`    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);`,
`    const coastDenseAudit16654={tested:0,nearCoast:0,passedScience:0,added:0};
    const coastDistance16654=ll16654=>{
      if(!Array.isArray(ll16654)||!hy.outsideLandMask16632)return null;
      const g16654=llGrid(hy,ll16654);if(!g16654||!Number.isFinite(g16654.x)||!Number.isFinite(g16654.y))return null;
      const cx16654=Math.max(0,Math.min(hy.w-1,Math.round(g16654.x))),cy16654=Math.max(0,Math.min(hy.h-1,Math.round(g16654.y)));
      for(let r16654=0;r16654<=3;r16654++)for(let dy16654=-r16654;dy16654<=r16654;dy16654++)for(let dx16654=-r16654;dx16654<=r16654;dx16654++){
        if(Math.max(Math.abs(dx16654),Math.abs(dy16654))!==r16654)continue;
        const x16654=cx16654+dx16654,y16654=cy16654+dy16654;if(x16654<0||x16654>=hy.w||y16654<0||y16654>=hy.h)continue;
        if(hy.outsideLandMask16632[y16654*hy.w+x16654])return r16654;
      }
      return null;
    };
    if(!focusMode&&hy.outsideLandMask16632&&hy.validityMask16584){
      outerCoast16654:for(const f16654 of lines){
        const coords16654=f16654.geometry.coordinates;if(coords16654.length<16)continue;
        const stride16654=Math.max(3,Math.floor(coords16654.length/36));
        for(let center16654=3;center16654<coords16654.length-3;center16654+=stride16654){
          coastDenseAudit16654.tested++;
          const p16654=coords16654[center16654],g16654=llGrid(hy,p16654);
          if(!g16654||!Number.isFinite(g16654.x)||!Number.isFinite(g16654.y))continue;
          const gx16654=Math.max(0,Math.min(hy.w-1,Math.round(g16654.x))),gy16654=Math.max(0,Math.min(hy.h-1,Math.round(g16654.y)));
          if(hy.validityMask16584[gy16654*hy.w+gx16654]!==1)continue;
          const centerDist16654=coastDistance16654(p16654);if(!Number.isFinite(centerDist16654)||centerDist16654>2)continue;
          coastDenseAudit16654.nearCoast++;
          const c16654=sampleSegment(coords16654,center16654,false);if(!c16654)continue;
          coastDenseAudit16654.passedScience++;
          const seg16654=c16654.segment||[],mid16654=seg16654[Math.floor((seg16654.length-1)/2)]||null,midDist16654=coastDistance16654(mid16654);
          if(!Number.isFinite(midDist16654)||midDist16654>2)continue;
          if(candidates.some(q16654=>Math.hypot(Number(q16654.x)-Number(c16654.x),Number(q16654.y)-Number(c16654.y))<2))continue;
          candidates.push(c16654);coastDenseAudit16654.added++;
          if(coastDenseAudit16654.added>=10)break outerCoast16654;
        }
      }
    }
    window.EARTHLINE_TX_COAST_DENSE_16654=coastDenseAudit16654;
    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);`);
  }
  apply('coastAudit',
`    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`,
`    const coastPubDist16654=ll16654=>{if(!Array.isArray(ll16654)||!hy.outsideLandMask16632)return null;const g16654=llGrid(hy,ll16654);if(!g16654||!Number.isFinite(g16654.x)||!Number.isFinite(g16654.y))return null;const cx16654=Math.max(0,Math.min(hy.w-1,Math.round(g16654.x))),cy16654=Math.max(0,Math.min(hy.h-1,Math.round(g16654.y)));for(let r16654=0;r16654<=12;r16654++)for(let dy16654=-r16654;dy16654<=r16654;dy16654++)for(let dx16654=-r16654;dx16654<=r16654;dx16654++){if(Math.max(Math.abs(dx16654),Math.abs(dy16654))!==r16654)continue;const x16654=cx16654+dx16654,y16654=cy16654+dy16654;if(x16654<0||x16654>=hy.w||y16654<0||y16654>=hy.h)continue;if(hy.outsideLandMask16632[y16654*hy.w+x16654])return r16654;}return null;};
    const d16654=chosen.map(c16654=>{const s16654=c16654.segment||[],m16654=s16654[Math.floor((s16654.length-1)/2)]||null;return coastPubDist16654(m16654);}).filter(Number.isFinite).sort((a,b)=>a-b);
    window.EARTHLINE_TX_COAST_PUBLISHED_DISTANCE_16654={finite:d16654.length,min:d16654[0]??null,le1:d16654.filter(x=>x<=1).length,le2:d16654.filter(x=>x<=2).length,le3:d16654.filter(x=>x<=3).length,le4:d16654.filter(x=>x<=4).length,le6:d16654.filter(x=>x<=6).length};
    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`);
  return route.fulfill({response:resp,body});
 });
 await page.goto(URL+'?tx_coast_dense='+name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 for(let repeat=1;repeat<=2;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
  await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(500);
  const state=await page.evaluate(()=>{
   const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
   const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
   const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
   const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
   return {dense:window.EARTHLINE_TX_COAST_DENSE_16654||null,coast:window.EARTHLINE_TX_COAST_PUBLISHED_DISTANCE_16654||null,swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
  });
  const row={name,repeat,elapsedMs:Date.now()-started,timedOut,patches,state};results.push(row);console.log('EARTHLINE_TX_COAST_DENSE_AB '+JSON.stringify(row));
 }
 await page.close();
}
await runVariant('baseline',false);
await runVariant('candidate',true);
console.log('EARTHLINE_TX_COAST_DENSE_AB_SUMMARY '+JSON.stringify(results));
await browser.close();
const base=results.filter(r=>r.name==='baseline'),cand=results.filter(r=>r.name==='candidate');
const bad=results.some(r=>r.timedOut||r.state.lastError||!(r.state.totalMs<=15000)||r.elapsedMs>15500||Number(r.state.unsafe)!==0||Number(r.state.outside?.swales||0)!==0||r.state.visible!==r.state.published||Number(r.state.visible||0)<=0);
const regress=cand.some(r=>r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10);
const gain=cand.every((r,i)=>Number(r.state.coast?.le2||0)>Number(base[i]?.state.coast?.le2||0));
if(bad||regress||!gain)process.exitCode=1;
