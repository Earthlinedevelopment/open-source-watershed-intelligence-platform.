import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const results=[];

async function runVariant(name,endpointCandidate){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const patches={};
  await page.route('**/*',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();let body=await resp.text();
    const apply=(label,needle,replacement)=>{const n=body.split(needle).length-1;patches[label]=n;if(n!==1)throw new Error(label+' expected 1, found '+n);body=body.replace(needle,replacement);};

    if(endpointCandidate){
      apply('endpointSampling',
`    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68];
      for(const frac of fractions){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),false);if(c)candidates.push(c);}
    }`,
`    const coastEndpointAudit16652={tested:0,nearStart:0,nearEnd:0,passedStart:0,passedEnd:0};
    const nearOutsideEnd16652=(ll,radius16652=2)=>{
      if(!Array.isArray(ll)||!hy.outsideLandMask16632)return false;
      const g16652=llGrid(hy,ll);if(!g16652||!Number.isFinite(g16652.x)||!Number.isFinite(g16652.y))return false;
      const cx16652=Math.max(0,Math.min(hy.w-1,Math.round(g16652.x))),cy16652=Math.max(0,Math.min(hy.h-1,Math.round(g16652.y)));
      for(let dy16652=-radius16652;dy16652<=radius16652;dy16652++)for(let dx16652=-radius16652;dx16652<=radius16652;dx16652++){
        const x16652=cx16652+dx16652,y16652=cy16652+dy16652;if(x16652<0||x16652>=hy.w||y16652<0||y16652>=hy.h)continue;
        if(hy.outsideLandMask16632[y16652*hy.w+x16652])return true;
      }
      return false;
    };
    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68];
      for(const frac of fractions){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),false);if(c)candidates.push(c);}
      if(!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>10000){
        coastEndpointAudit16652.tested++;
        if(nearOutsideEnd16652(coords[0],2)){coastEndpointAudit16652.nearStart++;const c16652=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,6)),false);if(c16652){c16652.coastEndpoint16652='start';candidates.push(c16652);coastEndpointAudit16652.passedStart++;}}
        if(nearOutsideEnd16652(coords[coords.length-1],2)){coastEndpointAudit16652.nearEnd++;const c16652=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,coords.length-7)),false);if(c16652){c16652.coastEndpoint16652='end';candidates.push(c16652);coastEndpointAudit16652.passedEnd++;}}
      }
    }
    window.EARTHLINE_TX_COAST_ENDPOINT_CANDIDATE_16652=coastEndpointAudit16652;`);
    }

    apply('coastDistanceAudit',
`    let swales=makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`,
`    let swales=makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);
    try{
      const coastDist16652=ll16652=>{
        if(!Array.isArray(ll16652)||!hy.outsideLandMask16632)return null;
        const g16652=llGrid(hy,ll16652);if(!g16652||!Number.isFinite(g16652.x)||!Number.isFinite(g16652.y))return null;
        const cx16652=Math.max(0,Math.min(hy.w-1,Math.round(g16652.x))),cy16652=Math.max(0,Math.min(hy.h-1,Math.round(g16652.y)));
        for(let r16652=0;r16652<=12;r16652++)for(let dy16652=-r16652;dy16652<=r16652;dy16652++)for(let dx16652=-r16652;dx16652<=r16652;dx16652++){
          if(Math.max(Math.abs(dx16652),Math.abs(dy16652))!==r16652)continue;
          const x16652=cx16652+dx16652,y16652=cy16652+dy16652;if(x16652<0||x16652>=hy.w||y16652<0||y16652>=hy.h)continue;
          if(hy.outsideLandMask16632[y16652*hy.w+x16652])return r16652;
        }
        return null;
      };
      const rows16652=[];
      for(const f16652 of (swales&&swales.features||[])){const c16652=f16652&&f16652.geometry&&f16652.geometry.coordinates||[];const m16652=c16652.length?c16652[Math.floor((c16652.length-1)/2)]:null;rows16652.push({mid:m16652,dist:coastDist16652(m16652)});}
      const ds16652=rows16652.map(x=>x.dist).filter(Number.isFinite).sort((a,b)=>a-b);
      window.EARTHLINE_TX_COAST_DISTANCE_16652={rows:rows16652,finite:ds16652.length,min:ds16652[0]??null,median:ds16652.length?ds16652[Math.floor(ds16652.length/2)]:null,le1:ds16652.filter(x=>x<=1).length,le2:ds16652.filter(x=>x<=2).length,le3:ds16652.filter(x=>x<=3).length,le4:ds16652.filter(x=>x<=4).length,le6:ds16652.filter(x=>x<=6).length};
    }catch(e){window.EARTHLINE_TX_COAST_DISTANCE_16652={error:String(e)};}
    noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`);
    return route.fulfill({response:resp,body});
  });

  await page.goto(URL+'?tx_coast_endpoint_'+name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
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
      return {coast:window.EARTHLINE_TX_COAST_DISTANCE_16652||null,endpoint:window.EARTHLINE_TX_COAST_ENDPOINT_CANDIDATE_16652||null,swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
    });
    const row={name,repeat,elapsedMs:Date.now()-started,timedOut,patches,state};results.push(row);console.log('EARTHLINE_TX_COAST_ENDPOINT_AB '+JSON.stringify(row));
  }
  await page.close();
}

await runVariant('baseline',false);
await runVariant('endpoint',true);
console.log('EARTHLINE_TX_COAST_ENDPOINT_AB_SUMMARY '+JSON.stringify(results));
await browser.close();

const base=results.filter(r=>r.name==='baseline'),cand=results.filter(r=>r.name==='endpoint');
const bad=results.some(r=>r.timedOut||r.state.lastError||!(r.state.totalMs<=15000)||Number(r.state.unsafe)!==0||Number(r.state.outside?.swales||0)!==0||r.state.visible!==r.state.published);
const regression=cand.some(r=>r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10);
const noCoastGain=cand.every((r,i)=>Number(r.state.coast?.le2||0)<=Number(base[i]?.state.coast?.le2||0)&&Number(r.state.coast?.le3||0)<=Number(base[i]?.state.coast?.le3||0));
if(bad||regression||noCoastGain)process.exitCode=1;
