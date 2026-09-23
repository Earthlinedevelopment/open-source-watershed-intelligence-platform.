import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Colorado','Florida'];
const OUT='artifacts/mantra46-16802-combined-global-ab';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];

function clusterSizes(keys,nx=24,ny=24){
  const set=new Set(keys),seen=new Set(),sizes=[];
  for(const k0 of set){if(seen.has(k0))continue;const [sx,sy]=k0.split(',').map(Number),q=[[sx,sy]];seen.add(k0);let size=0;
    while(q.length){const [x,y]=q.shift();size++;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const xx=x+ox,yy=y+oy,k=xx+','+yy;if(xx<0||xx>=nx||yy<0||yy>=ny||!set.has(k)||seen.has(k))continue;seen.add(k);q.push([xx,yy]);}}
    sizes.push(size);}return sizes.sort((a,b)=>b-a);
}

async function runOne(query,variant){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();let body=await resp.text();
    if(variant){
      const capOld='const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));';
      const capNew='const regionalCapacity16755=focusMode?80:Math.min(240,Math.max(80,coverageGroups16736.size*8));';
      if(body.split(capOld).length-1!==1)throw new Error('capacity owner mismatch');body=body.replace(capOld,capNew);
      const repl=[
        ['const binsX16731=6,binsY16731=6','const binsX16731=24,binsY16731=24',1],
        ['r16731.valid>=45&&r16731.opportunity>=8&&ratio16731>=.035','r16731.valid>=5&&r16731.opportunity>=2&&ratio16731>=.18',1],
        ['row16749.valid<45||row16749.opportunity<8||(row16749.opportunity/Math.max(1,row16749.valid))<.035','row16749.valid<5||row16749.opportunity<2||(row16749.opportunity/Math.max(1,row16749.valid))<.18',1],
        ['r16731.valid>=45&&r16731.opportunity>=8&&(r16731.opportunity/Math.max(1,r16731.valid))>=.035','r16731.valid>=5&&r16731.opportunity>=2&&(r16731.opportunity/Math.max(1,r16731.valid))>=.18',2],
        ["loadDEM(tile16731.b,48,48,8000,'coverage-gap refinement '+tile16731.id)","loadDEM(tile16731.b,32,32,5500,'coverage-gap refinement '+tile16731.id)",1]
      ];
      for(const [a,b,n] of repl){const c=body.split(a).length-1;if(c!==n)throw new Error('gap owner mismatch '+a+' count='+c);body=body.split(a).join(b);}
      const density=`const earthlineCoverageDensityTarget16767=r16767=>{\n        const preferred16767=Number(r16767&&r16767.preferred||0);\n        if(preferred16767>=60)return 3;\n        if(preferred16767>=30)return 2;\n        return 1;\n      };`;
      if(body.split(density).length-1!==1)throw new Error('density owner mismatch');body=body.replace(density,'const earthlineCoverageDensityTarget16767=r16767=>1;');
      const select='const selected16731=[];for(const gap16731 of gaps16731){if(selected16731.length>=18)break;selected16731.push(gap16731);}';
      const selectNew=`const gapMap16802=new Map(gaps16731.map(g=>[g.bx+','+g.by,g])),seen16802=new Set();\n      for(const g0 of gaps16731){const k0=g0.bx+','+g0.by;if(seen16802.has(k0))continue;const q=[g0],comp=[];seen16802.add(k0);while(q.length){const cur=q.shift();comp.push(cur);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const k=(cur.bx+ox)+','+(cur.by+oy),n=gapMap16802.get(k);if(!n||seen16802.has(k))continue;seen16802.add(k);q.push(n);}}for(const c of comp)c.component16802=comp.length;}\n      const pool16802=gaps16731.filter(g=>Number(g.component16802||0)>=20).sort((a,b)=>Number(b.component16802||0)-Number(a.component16802||0)||(b.opportunity/Math.max(1,b.valid))-(a.opportunity/Math.max(1,a.valid))||b.preferred-a.preferred);\n      const selected16731=[];while(pool16802.length&&selected16731.length<4){let bi=0,bm=-Infinity;for(let i=0;i<pool16802.length;i++){const g=pool16802[i],spread=selected16731.length?Math.min(...selected16731.map(s=>Math.hypot(s.bx-g.bx,s.by-g.by))):4,m=Number(g.component16802||0)*1000+spread*80+(g.opportunity/Math.max(1,g.valid))*100+g.preferred;if(m>bm){bm=m;bi=i;}}selected16731.push(pool16802.splice(bi,1)[0]);}`;
      if(body.split(select).length-1!==1)throw new Error('gap selection owner mismatch');body=body.replace(select,selectNew);
    }
    const call="let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);";
    if(body.split(call).length-1!==1)throw new Error('main swale call owner not found');body=body.replace(call,"window.__EARTHLINE_M46_16802_HY=hy;"+call);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });
  const page=await context.newPage(),pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));let loadError=null,timedOut=false;const started=Date.now();
  try{await page.goto(BASE+'?m46_16802='+encodeURIComponent(query)+'_'+(variant?'variant':'control')+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);try{await page.waitForFunction(q=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_16802_HY&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());},query,{timeout:70000,polling:100});}catch(_){timedOut=true;}await page.waitForTimeout(700);}catch(e){loadError=String(e);}
  const audit=loadError||timedOut?null:await page.evaluate(q=>{
    const hy=window.__EARTHLINE_M46_16802_HY,visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,swales=visual?.swales?.features||[],perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,spatial=window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,gap=window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null;
    const nx=24,ny=24,vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b),channel=vals.length?vals[Math.max(0,Math.min(vals.length-1,Math.floor((vals.length-1)*.972)))]:Infinity,[w,s,e,n]=hy.bounds;
    const toGrid=ll=>{if(!Array.isArray(ll)||ll.length<2||e===w||n===s)return null;const lng=Number(ll[0]),lat=Number(ll[1]);if(!Number.isFinite(lng)||!Number.isFinite(lat))return null;return{x:(lng-w)/(e-w)*Math.max(1,hy.w-1),y:(n-lat)/(n-s)*Math.max(1,hy.h-1)}};
    const bins=[];for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0,covered:false});const binAt=(x,y)=>bins[Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))))*nx+Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))))];
    for(let y=0;y<hy.h;y++)for(let x=0;x<hy.w;x++){const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;const b=binAt(x,y);b.valid++;const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);if(!Number.isFinite(sp)||!Number.isFinite(ac)||ac>=channel)continue;if(sp>=.05&&sp<=4)b.opp++;}
    let targetNearest=Infinity,targetGrid=q==='Arkansas'?toGrid([-91.71263,35.06357]):null;const dist=(px,py,ax,ay,bx,by)=>{const vx=bx-ax,vy=by-ay,wx=px-ax,wy=py-ay,vv=vx*vx+vy*vy;let t=vv?((wx*vx+wy*vy)/vv):0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+t*vx),py-(ay+t*vy));};
    for(const f of swales){const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;if(!Array.isArray(c)||!c.length)continue;let prev=null;for(const ll of c){const g=toGrid(ll);if(!g)continue;binAt(g.x,g.y).covered=true;if(prev){const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));for(let j=1;j<steps;j++){const t=j/steps;binAt(prev.x+dx*t,prev.y+dy*t).covered=true;}if(targetGrid)targetNearest=Math.min(targetNearest,dist(targetGrid.x,targetGrid.y,prev.x,prev.y,g.x,g.y));}prev=g;}}
    const qualified=bins.filter(b=>b.valid>=5&&b.opp>=2&&(b.opp/Math.max(1,b.valid))>=.18),unserved=qualified.filter(b=>!b.covered);
    return{coreMs:perf?.totalMs??null,generated:pub?.generated??null,visible:display?.swaleLines??pub?.overlaySwaleLines??null,unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip??null,candidates:gen?.candidates??null,eligible:gen?.jurisdictionEligibleCandidates??null,chosen:gen?.chosenBeforeTierGate??null,capacity:spatial?.capacity??null,gapSelected:(gap?.selected||[]).length,gapAdded:gap?.added??null,gapError:gap?.error||null,qualified:qualified.length,covered:qualified.length-unserved.length,unservedKeys:unserved.map(b=>b.bx+','+b.by),targetNearest:Number.isFinite(targetNearest)?Number(targetNearest.toFixed(2)):null};
  },query);
  if(audit){audit.unserved=audit.unservedKeys.length;audit.coverageRatio=audit.qualified?Number((audit.covered/audit.qualified).toFixed(4)):null;audit.gapClusters=clusterSizes(audit.unservedKeys);delete audit.unservedKeys;}
  const row={query,variant:variant?'combined':'control',loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};rows.push(row);console.log('EARTHLINE_M46_16802_AB '+JSON.stringify(row));try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'-'+(variant?'combined':'control')+'.png',fullPage:false});}catch(_){}await context.close();
}
for(const q of STATES){await runOne(q,false);await runOne(q,true);}await browser.close();writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));console.log('EARTHLINE_M46_16802_AB_SUMMARY '+JSON.stringify(rows));
const bad=rows.filter(r=>!r.audit||r.loadError||r.timedOut||r.pageErrors.length||Number(r.audit.coreMs)>15000||Number(r.audit.generated)!==Number(r.audit.visible)||Number(r.audit.unsafe)!==0||Number(r.audit.outside?.swales||0)!==0||r.audit.gapError);if(bad.length)process.exitCode=1;
