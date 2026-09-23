import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Maryland','Texas','Florida','Colorado'];
const VARIANTS=[
  {name:'control-120',cap:120},
  {name:'cap-160',cap:160},
  {name:'cap-200',cap:200}
];
const TARGET=[-91.71263,35.06357];
const OUT='artifacts/mantra46-16804-capacity-sweep';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];

function clusterSizes(keys,nx=24,ny=24){
  const set=new Set(keys),seen=new Set(),sizes=[];
  for(const k0 of set){
    if(seen.has(k0))continue;
    const [sx,sy]=k0.split(',').map(Number),q=[[sx,sy]];seen.add(k0);let size=0;
    while(q.length){
      const [x,y]=q.shift();size++;
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
        if(!ox&&!oy)continue;const xx=x+ox,yy=y+oy,k=xx+','+yy;
        if(xx<0||xx>=nx||yy<0||yy>=ny||!set.has(k)||seen.has(k))continue;
        seen.add(k);q.push([xx,yy]);
      }
    }
    sizes.push(size);
  }
  return sizes.sort((a,b)=>b-a);
}

async function runOne(query,variant){
  const context=await browser.newContext({viewport:{width:1908,height:882}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();let body=await resp.text();
    if(variant.cap!==120){
      const old='const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));';
      const neu=`const regionalCapacity16755=focusMode?80:Math.min(${variant.cap},Math.max(80,coverageGroups16736.size*4));`;
      const count=body.split(old).length-1;if(count!==1)throw new Error('capacity owner count='+count);body=body.replace(old,neu);
      // Also let the reserve actually scale above 120 by using occupied-parent complexity;
      // diagnostic only: no science/candidate/exclusion changes.
      const old2=`const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775);`;
      if(body.split(old2).length-1!==1)throw new Error('reserve owner count mismatch');
    }
    const call="let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);";
    if(body.split(call).length-1!==1)throw new Error('main call not found');
    body=body.replace(call,"window.__EARTHLINE_M46_16804_HY=hy;"+call);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  try{
    await page.goto(BASE+'?m46_16804='+encodeURIComponent(query)+'_'+variant.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{await page.waitForFunction(q=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_16804_HY&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());},query,{timeout:70000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(600);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(({query,target})=>{
    const hy=window.__EARTHLINE_M46_16804_HY,visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,swales=visual?.swales?.features||[];
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,score=window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||null,spatial=window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null;
    const rad=x=>x*Math.PI/180,metersPerLng=lat=>111320*Math.cos(rad(lat));
    const xy=ll=>[(Number(ll[0])-target[0])*metersPerLng((Number(ll[1])+target[1])/2),(Number(ll[1])-target[1])*111320];
    const segD=(a,b)=>{const A=xy(a),B=xy(b),vx=B[0]-A[0],vy=B[1]-A[1],vv=vx*vx+vy*vy;let t=vv?(-(A[0]*vx+A[1]*vy)/vv):0;t=Math.max(0,Math.min(1,t));return Math.hypot(A[0]+t*vx,A[1]+t*vy)};
    const lineD=c=>{if(!Array.isArray(c)||c.length<2)return Infinity;let d=Infinity;for(let i=1;i<c.length;i++)d=Math.min(d,segD(c[i-1],c[i]));return d};
    let targetNearest=null;if(query==='Arkansas'){const vals=swales.map(f=>lineD(f?.geometry?.coordinates)).filter(Number.isFinite);targetNearest=vals.length?Math.round(Math.min(...vals)):null;}

    const nx=24,ny=24,vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b),channel=vals.length?vals[Math.floor((vals.length-1)*.972)]:Infinity;
    const [w,s,e,n]=hy.bounds,toGrid=ll=>({x:(Number(ll[0])-w)/(e-w)*(hy.w-1),y:(n-Number(ll[1]))/(n-s)*(hy.h-1)}),bins=[];
    for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0,covered:false});
    const binAt=(x,y)=>bins[Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))))*nx+Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))))];
    for(let y=0;y<hy.h;y++)for(let x=0;x<hy.w;x++){const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;const b=binAt(x,y);b.valid++;const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);if(Number.isFinite(sp)&&sp>=.05&&sp<=4&&Number.isFinite(ac)&&ac<channel)b.opp++;}
    for(const f of swales){const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;if(!c?.length)continue;let prev=null;for(const ll of c){const g=toGrid(ll);binAt(g.x,g.y).covered=true;if(prev){const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));for(let j=1;j<steps;j++){const t=j/steps;binAt(prev.x+dx*t,prev.y+dy*t).covered=true}}prev=g;}}
    const qualified=bins.filter(b=>b.valid>=5&&b.opp>=2&&(b.opp/Math.max(1,b.valid))>=.18),unserved=qualified.filter(b=>!b.covered);
    return {coreMs:perf?.totalMs??null,generated:pub?.generated??null,visible:display?.swaleLines??pub?.overlaySwaleLines??null,unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip??null,declaredCapacity:score?.capacity16755??spatial?.capacity??null,chosen:score?.chosen??swales.length,reserved:spatial?.reserved??null,candidateBins:spatial?.candidateBins??null,targetNearest,qualified:qualified.length,covered:qualified.length-unserved.length,unservedKeys:unserved.map(b=>b.bx+','+b.by)};
  },{query,target:TARGET});
  if(audit){audit.unserved=audit.unservedKeys.length;audit.coverageRatio=audit.qualified?Number((audit.covered/audit.qualified).toFixed(4)):null;audit.gapClusters=clusterSizes(audit.unservedKeys);delete audit.unservedKeys;}
  const row={query,variant:variant.name,cap:variant.cap,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};rows.push(row);console.log('EARTHLINE_M46_16804 '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'-'+variant.name+'.png',fullPage:false});}catch(_){ }
  await context.close();
}

for(const q of STATES)for(const v of VARIANTS)await runOne(q,v);
await browser.close();writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));console.log('EARTHLINE_M46_16804_SUMMARY '+JSON.stringify(rows));
