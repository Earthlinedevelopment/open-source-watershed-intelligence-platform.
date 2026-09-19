import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1, found '+n);body=body.replace(needle,replacement);};

 apply('candidateMin',
 `    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];`,
 `    const min=percentile(hy.elev,candidateQuantile16609?0.002:0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];`);

 apply('candidateLowTail',
 `      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}`,
 `      const seen16609=new Set();
      for(const q16669 of [.005,.01,.015,.02,.025,.03,.04]){const v16669=percentile(hy.elev,q16669),k16669=Math.round(v16669*10)/10;if(k16669>min&&k16669<max&&!seen16609.has(k16669)){seen16609.add(k16669);levels.push(k16669);}}
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}`);

 apply('coastAudit',
 `    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`,
 `    const coastDist16669=ll16669=>{if(!Array.isArray(ll16669)||!hy.outsideLandMask16632)return null;const g16669=llGrid(hy,ll16669);if(!g16669||!Number.isFinite(g16669.x)||!Number.isFinite(g16669.y))return null;const cx16669=Math.max(0,Math.min(hy.w-1,Math.round(g16669.x))),cy16669=Math.max(0,Math.min(hy.h-1,Math.round(g16669.y)));for(let r16669=0;r16669<=12;r16669++)for(let dy16669=-r16669;dy16669<=r16669;dy16669++)for(let dx16669=-r16669;dx16669<=r16669;dx16669++){if(Math.max(Math.abs(dx16669),Math.abs(dy16669))!==r16669)continue;const xx16669=cx16669+dx16669,yy16669=cy16669+dy16669;if(xx16669<0||xx16669>=hy.w||yy16669<0||yy16669>=hy.h)continue;if(hy.outsideLandMask16632[yy16669*hy.w+xx16669])return r16669;}return null;};
    const ds16669=chosen.map(c16669=>{const s16669=c16669.segment||[],m16669=s16669[Math.floor((s16669.length-1)/2)]||null;return coastDist16669(m16669);}).filter(Number.isFinite).sort((a,b)=>a-b);
    window.EARTHLINE_TX_LOWTAIL2_16669={finite:ds16669.length,min:ds16669[0]??null,le1:ds16669.filter(x=>x<=1).length,le2:ds16669.filter(x=>x<=2).length,le3:ds16669.filter(x=>x<=3).length,le4:ds16669.filter(x=>x<=4).length,le6:ds16669.filter(x=>x<=6).length};
    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`);

 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_lowtail2='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=3;repeat++){
 const prev=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prev,{timeout:35000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(400);
 const state=await page.evaluate(()=>{const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];const mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;};const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(m&&pred(+m[0],+m[1])?1:0);},0);const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;return {coast:window.EARTHLINE_TX_LOWTAIL2_16669||null,swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,aquifer:a,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};});
 const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_LOWTAIL2 '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_LOWTAIL2_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
const ok=rows.filter(r=>!r.timedOut&&!r.state.lastError&&r.state.visible===r.state.published&&Number(r.state.visible||0)>0);
const bad=ok.some(r=>!(r.state.totalMs<=15000)||Number(r.state.unsafe)!==0||Number(r.state.outside?.swales||0)!==0||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10);
const coast=ok.length>=2&&ok.every(r=>Number(r.state.coast?.min||99)<=2&&Number(r.state.coast?.le2||0)>0);
if(Object.values(patches).some(v=>v!==1)||ok.length<2||bad||!coast)process.exitCode=1;
