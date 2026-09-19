import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1, found '+n);body=body.replace(needle,replacement);};
 apply('lowTailInsert',
`      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}`,
`      const seen16609=new Set();
      for(const q16662 of [.025,.03,.035,.04,.045]){const v16662=percentile(hy.elev,q16662),k16662=Math.round(v16662*10)/10;if(k16662>min&&k16662<max&&!seen16609.has(k16662)){seen16609.add(k16662);levels.push(k16662);}}
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}`);
 apply('coastAudit',
`    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`,
`    const coastPubDist16662=ll16662=>{if(!Array.isArray(ll16662)||!hy.outsideLandMask16632)return null;const g16662=llGrid(hy,ll16662);if(!g16662||!Number.isFinite(g16662.x)||!Number.isFinite(g16662.y))return null;const cx16662=Math.max(0,Math.min(hy.w-1,Math.round(g16662.x))),cy16662=Math.max(0,Math.min(hy.h-1,Math.round(g16662.y)));for(let r16662=0;r16662<=12;r16662++)for(let dy16662=-r16662;dy16662<=r16662;dy16662++)for(let dx16662=-r16662;dx16662<=r16662;dx16662++){if(Math.max(Math.abs(dx16662),Math.abs(dy16662))!==r16662)continue;const x16662=cx16662+dx16662,y16662=cy16662+dy16662;if(x16662<0||x16662>=hy.w||y16662<0||y16662>=hy.h)continue;if(hy.outsideLandMask16632[y16662*hy.w+x16662])return r16662;}return null;};
    const d16662=chosen.map(c16662=>{const s16662=c16662.segment||[],m16662=s16662[Math.floor((s16662.length-1)/2)]||null;return coastPubDist16662(m16662);}).filter(Number.isFinite).sort((a,b)=>a-b);
    window.EARTHLINE_TX_LOWTAIL_COAST_16662={finite:d16662.length,min:d16662[0]??null,le1:d16662.filter(x=>x<=1).length,le2:d16662.filter(x=>x<=2).length,le3:d16662.filter(x=>x<=3).length,le4:d16662.filter(x=>x<=4).length,le6:d16662.filter(x=>x<=6).length};
    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_lowtail_candidate='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=3;repeat++){
 const prev=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prev,{timeout:35000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(500);
 const state=await page.evaluate(()=>{const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];const mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;};const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(m&&pred(+m[0],+m[1])?1:0);},0);const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;return {coast:window.EARTHLINE_TX_LOWTAIL_COAST_16662||null,swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,aquifer:a,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};});
 const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_LOWTAIL_CANDIDATE '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_LOWTAIL_CANDIDATE_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
const completed=rows.filter(r=>!r.timedOut&&!r.state.lastError&&r.state.visible===r.state.published&&Number(r.state.visible||0)>0);
const scienceBad=completed.some(r=>!(r.state.totalMs<=15000)||Number(r.state.unsafe)!==0||Number(r.state.outside?.swales||0)!==0||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10);
const coastGain=completed.length>=2&&completed.every(r=>Number(r.state.coast?.le2||0)>0&&Number(r.state.coast?.min||99)<=2);
if(Object.values(patches).some(v=>v!==1)||completed.length<2||scienceBad||!coastGain)process.exitCode=1;
