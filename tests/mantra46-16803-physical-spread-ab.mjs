import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Texas','Vermont','Florida','Colorado'];
const OUT='artifacts/mantra46-16803-physical-spread-ab';
const TARGET=[-91.71263,35.06357];
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];

function clusterSizes(keys,nx=24,ny=24){
  const set=new Set(keys),seen=new Set(),sizes=[];
  for(const k0 of set){if(seen.has(k0))continue;const [sx,sy]=k0.split(',').map(Number),q=[[sx,sy]];seen.add(k0);let size=0;while(q.length){const [x,y]=q.shift();size++;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const xx=x+ox,yy=y+oy,k=xx+','+yy;if(xx<0||xx>=nx||yy<0||yy>=ny||!set.has(k)||seen.has(k))continue;seen.add(k);q.push([xx,yy]);}}sizes.push(size);}return sizes.sort((a,b)=>b-a);
}

async function runOne(query,variant){
  const context=await browser.newContext({viewport:{width:1908,height:882}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();let body=await resp.text();
    if(variant){
      const old='const nx16783=12,ny16783=12;';
      const neu=`const validCells16803=hy.validityMask16584?Array.from(hy.validityMask16584).reduce((n16803,v16803)=>n16803+(v16803===1?1:0),0):hy.w*hy.h;
      const validAreaM216803=Math.max(1,validCells16803*Math.max(1,Number(hy.cellX)||1)*Math.max(1,Number(hy.cellY)||1));
      const targetCellM16803=Math.sqrt(validAreaM216803/Math.max(1,chosen.length*4));
      const widthM16803=Math.max(1,(hy.w-1)*Math.max(1,Number(hy.cellX)||1)),heightM16803=Math.max(1,(hy.h-1)*Math.max(1,Number(hy.cellY)||1));
      const nx16783=Math.max(12,Math.min(48,Math.round(widthM16803/Math.max(1,targetCellM16803))));
      const ny16783=Math.max(12,Math.min(48,Math.round(heightM16803/Math.max(1,targetCellM16803))));`;
      if(body.split(old).length-1!==1)throw new Error('final spread grid owner mismatch');body=body.replace(old,neu);
      const rx='const cx16791=Math.max(0,Math.min(11,Math.floor(Number(g16791.x)*12/Math.max(1,hy.w))));',ry='const cy16791=Math.max(0,Math.min(11,Math.floor(Number(g16791.y)*12/Math.max(1,hy.h))));';
      if(body.split(rx).length-1!==1||body.split(ry).length-1!==1)throw new Error('coverage audit owner mismatch');
      body=body.replace(rx,'const cx16791=Math.max(0,Math.min(nx16783-1,Math.floor(Number(g16791.x)*nx16783/Math.max(1,hy.w))));').replace(ry,'const cy16791=Math.max(0,Math.min(ny16783-1,Math.floor(Number(g16791.y)*ny16783/Math.max(1,hy.h))));');
      const auditAnchor="build:'EARTHLINE 16785',candidateCells:bestByCell16783.size,chosenCount:chosen.length,";
      if(body.split(auditAnchor).length-1!==1)throw new Error('spread audit anchor mismatch');
      body=body.replace(auditAnchor,"build:'EARTHLINE 16803 TEST',gridX:nx16783,gridY:ny16783,targetCellM16803:typeof targetCellM16803==='number'?targetCellM16803:null,candidateCells:bestByCell16783.size,chosenCount:chosen.length,");
    }
    const call="let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);";
    if(body.split(call).length-1!==1)throw new Error('main call not found');body=body.replace(call,"window.__EARTHLINE_M46_16803_HY=hy;"+call);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));let loadError=null,timedOut=false;const started=Date.now();
  try{await page.goto(BASE+'?m46_16803='+encodeURIComponent(query)+'_'+(variant?'physical':'control')+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);try{await page.waitForFunction(q=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;return /screening published\./i.test(s)&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());},query,{timeout:65000,polling:100});}catch(_){timedOut=true;}await page.waitForTimeout(600);}catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(({query,target})=>{
    const hy=window.__EARTHLINE_M46_16803_HY,visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,swales=visual?.swales?.features||[],perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;
    const rad=x=>x*Math.PI/180,metersPerLng=lat=>111320*Math.cos(rad(lat)),xy=ll=>[(Number(ll[0])-target[0])*metersPerLng((Number(ll[1])+target[1])/2),(Number(ll[1])-target[1])*111320];
    const segD=(a,b)=>{const A=xy(a),B=xy(b),vx=B[0]-A[0],vy=B[1]-A[1],vv=vx*vx+vy*vy;let t=vv?(-(A[0]*vx+A[1]*vy)/vv):0;t=Math.max(0,Math.min(1,t));return Math.hypot(A[0]+t*vx,A[1]+t*vy)},lineD=c=>{if(!Array.isArray(c)||c.length<2)return Infinity;let d=Infinity;for(let i=1;i<c.length;i++)d=Math.min(d,segD(c[i-1],c[i]));return d};let targetNearest=null;if(query==='Arkansas'){const ds=swales.map(f=>lineD(f?.geometry?.coordinates)).filter(Number.isFinite);targetNearest=ds.length?Math.round(Math.min(...ds)):null;}
    const nx=24,ny=24,vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b),channel=vals.length?vals[Math.floor((vals.length-1)*.972)]:Infinity,[w,s,e,n]=hy.bounds,toGrid=ll=>({x:(Number(ll[0])-w)/(e-w)*(hy.w-1),y:(n-Number(ll[1]))/(n-s)*(hy.h-1)}),bins=[];for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0,covered:false});const binAt=(x,y)=>bins[Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))))*nx+Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))))];
    for(let y=0;y<hy.h;y++)for(let x=0;x<hy.w;x++){const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;const b=binAt(x,y);b.valid++;const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);if(Number.isFinite(sp)&&sp>=.05&&sp<=4&&Number.isFinite(ac)&&ac<channel)b.opp++;}
    for(const f of swales){const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;if(!c?.length)continue;let prev=null;for(const ll of c){const g=toGrid(ll);binAt(g.x,g.y).covered=true;if(prev){const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));for(let j=1;j<steps;j++){const t=j/steps;binAt(prev.x+dx*t,prev.y+dy*t).covered=true}}prev=g;}}
    const qualified=bins.filter(b=>b.valid>=5&&b.opp>=2&&(b.opp/Math.max(1,b.valid))>=.18),unserved=qualified.filter(b=>!b.covered);
    return{coreMs:perf?.totalMs??null,generated:pub?.generated??null,visible:display?.swaleLines??pub?.overlaySwaleLines??null,unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip??null,targetNearest,spread:{gridX:spread?.gridX,gridY:spread?.gridY,targetCellM:spread?.targetCellM16803,candidateCells:spread?.candidateCells,chosenCount:spread?.chosenCount,initialCells:spread?.initialCells,finalCells:spread?.finalCells,targetCells:spread?.targetCells,stop:spread?.selectionStopReason,swaps:spread?.swaps},qualified:qualified.length,covered:qualified.length-unserved.length,unservedKeys:unserved.map(b=>b.bx+','+b.by)};
  },{query,target:TARGET});
  if(audit){audit.unserved=audit.unservedKeys.length;audit.coverageRatio=audit.qualified?Number((audit.covered/audit.qualified).toFixed(4)):null;audit.gapClusters=clusterSizes(audit.unservedKeys);delete audit.unservedKeys;}
  const row={query,variant:variant?'physical-adaptive':'12x12-control',loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};rows.push(row);console.log('EARTHLINE_M46_16803 '+JSON.stringify(row));try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'-'+(variant?'physical':'control')+'.png',fullPage:false});}catch(_){ }await context.close();
}
for(const q of STATES){await runOne(q,false);await runOne(q,true)}await browser.close();writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));console.log('EARTHLINE_M46_16803_SUMMARY '+JSON.stringify(rows));const bad=rows.filter(r=>!r.audit||r.loadError||r.timedOut||r.pageErrors.length||Number(r.audit.coreMs)>15000||Number(r.audit.generated)!==Number(r.audit.visible)||Number(r.audit.unsafe)!==0||Number(r.audit.outside?.swales||0)!==0);if(bad.length)process.exitCode=1;
