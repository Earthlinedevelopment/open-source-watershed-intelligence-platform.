import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1, found '+n);body=body.replace(needle,replacement);};

 apply('sampleSignature',
 `    function sampleSegment(coords,center,relaxed){`,
 `    function sampleSegment(coords,center,relaxed,coastEdge16670=false){`);

 apply('sampleHalf',
 `      const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);
      const raw=coords.slice(start,end);if(raw.length<10)return null;`,
 `      const half=coastEdge16670?Math.max(4,Math.min(8,Math.floor(coords.length*.10))):Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);
      const raw=coords.slice(start,end);if(raw.length<(coastEdge16670?6:10))return null;`);

 apply('segmentPoints',
 `      const segment=chaikin(raw,2,false);if(segment.length<10)return null;`,
 `      const segment=chaikin(raw,2,false);if(segment.length<(coastEdge16670?6:10))return null;`);

 apply('preferredLoop',
 `    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68];
      for(const frac of fractions){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),false);if(c)candidates.push(c);}
    }`,
 `    const coastEndAudit16670={tested:0,near:0,passed:0};
    const nearOutside16670=ll16670=>{
      if(!Array.isArray(ll16670)||!hy.outsideLandMask16632)return false;
      const g16670=llGrid(hy,ll16670);if(!g16670||!Number.isFinite(g16670.x)||!Number.isFinite(g16670.y))return false;
      const cx16670=Math.max(0,Math.min(hy.w-1,Math.round(g16670.x))),cy16670=Math.max(0,Math.min(hy.h-1,Math.round(g16670.y)));
      for(let dy16670=-6;dy16670<=6;dy16670++)for(let dx16670=-6;dx16670<=6;dx16670++){const xx16670=cx16670+dx16670,yy16670=cy16670+dy16670;if(xx16670<0||xx16670>=hy.w||yy16670<0||yy16670>=hy.h)continue;if(hy.outsideLandMask16632[yy16670*hy.w+xx16670])return true;}return false;
    };
    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68];
      for(const frac of fractions){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),false);if(c)candidates.push(c);}
      if(!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>10000&&hy.outsideLandMask16632){
        coastEndAudit16670.tested+=2;
        if(nearOutside16670(coords[0])){coastEndAudit16670.near++;const c16670=sampleSegment(coords,2,false,true);if(c16670){c16670.coast_edge_16670=true;candidates.push(c16670);coastEndAudit16670.passed++;}}
        if(nearOutside16670(coords[coords.length-1])){coastEndAudit16670.near++;const c16670=sampleSegment(coords,coords.length-3,false,true);if(c16670){c16670.coast_edge_16670=true;candidates.push(c16670);coastEndAudit16670.passed++;}}
      }
    }
    window.EARTHLINE_COAST_EDGE_SAMPLING_16670=coastEndAudit16670;`);

 apply('coastAudit',
 `    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`,
 `    const coastDist16670=ll16670=>{if(!Array.isArray(ll16670)||!hy.outsideLandMask16632)return null;const g16670=llGrid(hy,ll16670);if(!g16670||!Number.isFinite(g16670.x)||!Number.isFinite(g16670.y))return null;const cx16670=Math.max(0,Math.min(hy.w-1,Math.round(g16670.x))),cy16670=Math.max(0,Math.min(hy.h-1,Math.round(g16670.y)));for(let r16670=0;r16670<=12;r16670++)for(let dy16670=-r16670;dy16670<=r16670;dy16670++)for(let dx16670=-r16670;dx16670<=r16670;dx16670++){if(Math.max(Math.abs(dx16670),Math.abs(dy16670))!==r16670)continue;const xx16670=cx16670+dx16670,yy16670=cy16670+dy16670;if(xx16670<0||xx16670>=hy.w||yy16670<0||yy16670>=hy.h)continue;if(hy.outsideLandMask16632[yy16670*hy.w+xx16670])return r16670;}return null;};
    const ds16670=chosen.map(c16670=>{const s16670=c16670.segment||[],m16670=s16670[Math.floor((s16670.length-1)/2)]||null;return coastDist16670(m16670);}).filter(Number.isFinite).sort((a,b)=>a-b);
    window.EARTHLINE_TX_COAST_EDGE_RESULT_16670={sampling:window.EARTHLINE_COAST_EDGE_SAMPLING_16670||null,finite:ds16670.length,min:ds16670[0]??null,le1:ds16670.filter(x=>x<=1).length,le2:ds16670.filter(x=>x<=2).length,le3:ds16670.filter(x=>x<=3).length,le4:ds16670.filter(x=>x<=4).length,le6:ds16670.filter(x=>x<=6).length};
    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`);

 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_coast_edge70='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=3;repeat++){
 const prev=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prev,{timeout:35000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(400);
 const state=await page.evaluate(()=>{const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];const mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;};const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(m&&pred(+m[0],+m[1])?1:0);},0);const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;return {coast:window.EARTHLINE_TX_COAST_EDGE_RESULT_16670||null,swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,aquifer:a,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};});
 const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_COAST_EDGE70 '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_COAST_EDGE70_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
const ok=rows.filter(r=>!r.timedOut&&!r.state.lastError&&r.state.visible===r.state.published&&Number(r.state.visible||0)>0);
const bad=ok.some(r=>!(r.state.totalMs<=15000)||Number(r.state.unsafe)!==0||Number(r.state.outside?.swales||0)!==0||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10);
const coast=ok.length>=2&&ok.every(r=>Number(r.state.coast?.min||99)<=2&&Number(r.state.coast?.le2||0)>0);
if(Object.values(patches).some(v=>v!==1)||ok.length<2||bad||!coast)process.exitCode=1;
