import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra46-16801-arkansas-stage-loss';
const TARGET=[-91.71263,35.06357];
const GRIDS=[96,192];
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];

for(const grid of GRIDS){
  const context=await browser.newContext({viewport:{width:1908,height:882}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();
    if(grid!==96){
      const old='const openGrid16201=focusMode?220:96,mapGrid16201=focusMode?180:96;';
      const neu=`const openGrid16201=focusMode?220:${grid},mapGrid16201=focusMode?180:${grid};`;
      if(body.split(old).length-1!==1)throw new Error('base grid owner not found');
      body=body.replace(old,neu);
    }
    const call="let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);";
    if(body.split(call).length-1!==1)throw new Error('main swale call not found');
    body=body.replace(call,"window.__EARTHLINE_M46_STAGE_HY=hy;window.__EARTHLINE_M46_STAGE_CONTOURS=swaleCandidateContours16609;"+call);
    const cap="window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;";
    if(body.split(cap).length-1!==1)throw new Error('generation audit owner not found');
    body=body.replace(cap,"if(hy===window.__EARTHLINE_M46_STAGE_HY)window.__EARTHLINE_M46_STAGE_CHAIN={candidates:[...candidates],chosen:[...chosen]};"+cap);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  try{
    await page.goto(BASE+'?m46_16801='+grid+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    });
    try{
      await page.waitForFunction(()=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_STAGE_CHAIN&&!!window.__EARTHLINE_M46_STAGE_HY;
      },{timeout:80000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(700);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(target=>{
    const hy=window.__EARTHLINE_M46_STAGE_HY;
    const contours=window.__EARTHLINE_M46_STAGE_CONTOURS;
    const chain=window.__EARTHLINE_M46_STAGE_CHAIN;
    const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const published=visual?.swales?.features||[];
    const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;

    const rad=x=>x*Math.PI/180;
    const metersPerLng=lat=>111320*Math.cos(rad(lat));
    const xy=ll=>[(Number(ll[0])-target[0])*metersPerLng((Number(ll[1])+target[1])/2),(Number(ll[1])-target[1])*111320];
    function pointSegM(a,b){
      const A=xy(a),B=xy(b),vx=B[0]-A[0],vy=B[1]-A[1],vv=vx*vx+vy*vy;
      let t=vv?(-(A[0]*vx+A[1]*vy)/vv):0;t=Math.max(0,Math.min(1,t));
      return Math.hypot(A[0]+t*vx,A[1]+t*vy);
    }
    function lineDistM(coords){
      if(!Array.isArray(coords)||coords.length<2)return Infinity;
      let d=Infinity;for(let i=1;i<coords.length;i++)d=Math.min(d,pointSegM(coords[i-1],coords[i]));return d;
    }
    function nearestRows(list,getCoords,n=8){
      return (list||[]).map((x,i)=>({i,d:lineDistM(getCoords(x)),score:Number(x?.score)||null,slope:Number(x?.slope)||null,confidence:x?.confidence||null,x:x?.x,y:x?.y,coverageGap:!!x?.coverageGap16731,refined:!!(x?.refined16710||x?.refined16702)})).filter(r=>Number.isFinite(r.d)).sort((a,b)=>a.d-b.d).slice(0,n).map(r=>({...r,dM:Math.round(r.d)}));
    }
    const contourLines=(contours?.features||[]).filter(f=>f?.geometry?.type==='LineString');
    const nearestContours=contourLines.map((f,i)=>({i,d:lineDistM(f.geometry.coordinates),elev:f?.properties?.elevation??f?.properties?.level??null})).filter(r=>Number.isFinite(r.d)).sort((a,b)=>a.d-b.d).slice(0,8).map(r=>({...r,dM:Math.round(r.d)}));
    const nearestCandidates=nearestRows(chain?.candidates,c=>c?.segment,12);
    const nearestChosen=nearestRows(chain?.chosen,c=>c?.segment,12);
    const nearestPublished=(published||[]).map((f,i)=>({i,d:lineDistM(f?.geometry?.coordinates),grade:f?.properties?.grade,rank:f?.properties?.rank,score:f?.properties?.score})).filter(r=>Number.isFinite(r.d)).sort((a,b)=>a.d-b.d).slice(0,12).map(r=>({...r,dM:Math.round(r.d)}));

    const [w,s,e,n]=hy.bounds;
    const gx=(target[0]-w)/(e-w)*(hy.w-1),gy=(n-target[1])/(n-s)*(hy.h-1);
    const x=Math.max(1,Math.min(hy.w-2,Math.round(gx))),y=Math.max(1,Math.min(hy.h-2,Math.round(gy))),idx=y*hy.w+x;
    const channelVals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    const channel=channelVals.length?channelVals[Math.floor((channelVals.length-1)*.972)]:Infinity;
    const local=[];
    for(let yy=Math.max(0,y-2);yy<=Math.min(hy.h-1,y+2);yy++)for(let xx=Math.max(0,x-2);xx<=Math.min(hy.w-1,x+2);xx++){
      const ii=yy*hy.w+xx,sp=Number(hy.slope[ii]),ac=Number(hy.acc[ii]),valid=hy.validityMask16584?.[ii]===1;
      local.push({dx:xx-x,dy:yy-y,valid,slope:Number.isFinite(sp)?Number(sp.toFixed(3)):null,acc:Number.isFinite(ac)?Number(ac.toFixed(2)):null,eligible:valid&&Number.isFinite(sp)&&sp>=.05&&sp<=4&&Number.isFinite(ac)&&ac<channel});
    }
    return {
      grid:{w:hy.w,h:hy.h,cellX:hy.cellX,cellY:hy.cellY},targetGrid:{gx:Number(gx.toFixed(2)),gy:Number(gy.toFixed(2)),x,y},targetCell:{valid:hy.validityMask16584?.[idx]===1,slope:Number(hy.slope[idx]),acc:Number(hy.acc[idx]),channel,eligible:hy.validityMask16584?.[idx]===1&&Number(hy.slope[idx])>=.05&&Number(hy.slope[idx])<=4&&Number(hy.acc[idx])<channel},local,
      counts:{contours:contourLines.length,candidates:chain?.candidates?.length||0,chosen:chain?.chosen?.length||0,published:published.length},
      nearestContours,nearestCandidates,nearestChosen,nearestPublished,
      generationAudit:gen,spread,coreMs:perf?.totalMs??null
    };
  },TARGET);

  const row={grid,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};rows.push(row);
  console.log('EARTHLINE_M46_16801 '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/arkansas-'+grid+'.png',fullPage:false});}catch(_){ }
  await context.close();
}
await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
console.log('EARTHLINE_M46_16801_SUMMARY '+JSON.stringify(rows));
