import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1, found '+n);body=body.replace(needle,replacement);};
 apply('grid128',
 `    const openGrid16201=focusMode?220:96,mapGrid16201=focusMode?180:96;`,
 `    const openGrid16201=focusMode?220:128,mapGrid16201=focusMode?180:128;`);
 apply('coastAudit',
 `    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`,
 `    const coastDist16664=ll16664=>{if(!Array.isArray(ll16664)||!hy.outsideLandMask16632)return null;const g16664=llGrid(hy,ll16664);if(!g16664||!Number.isFinite(g16664.x)||!Number.isFinite(g16664.y))return null;const cx16664=Math.max(0,Math.min(hy.w-1,Math.round(g16664.x))),cy16664=Math.max(0,Math.min(hy.h-1,Math.round(g16664.y)));for(let r16664=0;r16664<=16;r16664++)for(let dy16664=-r16664;dy16664<=r16664;dy16664++)for(let dx16664=-r16664;dx16664<=r16664;dx16664++){if(Math.max(Math.abs(dx16664),Math.abs(dy16664))!==r16664)continue;const x16664=cx16664+dx16664,y16664=cy16664+dy16664;if(x16664<0||x16664>=hy.w||y16664<0||y16664>=hy.h)continue;if(hy.outsideLandMask16632[y16664*hy.w+x16664])return r16664;}return null;};
    const ds16664=chosen.map(c16664=>{const s16664=c16664.segment||[],m16664=s16664[Math.floor((s16664.length-1)/2)]||null;return coastDist16664(m16664);}).filter(Number.isFinite).sort((a,b)=>a-b);
    window.EARTHLINE_TX_GRID128_COAST_16664={gridW:hy.w,gridH:hy.h,cellKm:Number((Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)/1000).toFixed(2)),finite:ds16664.length,minCells:ds16664[0]??null,minKm:ds16664.length?Number((ds16664[0]*Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)/1000).toFixed(1)):null,le2:ds16664.filter(x=>x<=2).length,le3:ds16664.filter(x=>x<=3).length,le4:ds16664.filter(x=>x<=4).length,le6:ds16664.filter(x=>x<=6).length};
    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_grid128='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=2;repeat++){
 const prev=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prev,{timeout:40000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(500);
 const state=await page.evaluate(()=>{const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];const mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;};const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(m&&pred(+m[0],+m[1])?1:0);},0);const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;return {coast:window.EARTHLINE_TX_GRID128_COAST_16664||null,swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};});
 const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_GRID128 '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_GRID128_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
const completed=rows.filter(r=>!r.timedOut&&!r.state.lastError&&r.state.visible===r.state.published&&Number(r.state.visible||0)>0);
if(patches.grid128!==1||patches.coastAudit!==1||completed.length<1)process.exitCode=1;
