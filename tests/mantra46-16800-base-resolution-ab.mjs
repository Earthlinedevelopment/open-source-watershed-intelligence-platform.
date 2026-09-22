import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Colorado'];
const GRIDS=[96,192,256];
const OUT='artifacts/mantra46-16800-base-resolution-ab';
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
        if(!ox&&!oy)continue;
        const xx=x+ox,yy=y+oy,k=xx+','+yy;
        if(xx<0||xx>=nx||yy<0||yy>=ny||!set.has(k)||seen.has(k))continue;
        seen.add(k);q.push([xx,yy]);
      }
    }
    sizes.push(size);
  }
  return sizes.sort((a,b)=>b-a);
}

async function runOne(query,grid){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();
    if(grid!==96){
      const old='const openGrid16201=focusMode?220:96,mapGrid16201=focusMode?180:96;';
      const neu=`const openGrid16201=focusMode?220:${grid},mapGrid16201=focusMode?180:${grid};`;
      const count=body.split(old).length-1;
      if(count!==1)throw new Error('base-grid owner count='+count);
      body=body.replace(old,neu);
    }
    const call="let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);";
    if(body.split(call).length-1!==1)throw new Error('main swale call owner not found');
    body=body.replace(call,"window.__EARTHLINE_M46_BASE_HY=hy;"+call);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  try{
    await page.goto(BASE+'?m46_16800='+encodeURIComponent(query)+'_'+grid+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_BASE_HY&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:80000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(700);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(q=>{
    const hy=window.__EARTHLINE_M46_BASE_HY;
    const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const swales=visual?.swales?.features||[];
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;

    const nx=24,ny=24;
    const vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    const channel=vals.length?vals[Math.max(0,Math.min(vals.length-1,Math.floor((vals.length-1)*.972)))]:Infinity;
    const [w,s,e,n]=hy.bounds;
    const toGrid=ll=>{
      if(!Array.isArray(ll)||ll.length<2||e===w||n===s)return null;
      const lng=Number(ll[0]),lat=Number(ll[1]);if(!Number.isFinite(lng)||!Number.isFinite(lat))return null;
      return {x:(lng-w)/(e-w)*Math.max(1,hy.w-1),y:(n-lat)/(n-s)*Math.max(1,hy.h-1)};
    };
    const bins=[];for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0,covered:false});
    const binAt=(x,y)=>{
      const bx=Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))));
      const by=Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))));
      return bins[by*nx+bx];
    };
    for(let y=0;y<hy.h;y++)for(let x=0;x<hy.w;x++){
      const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;
      const b=binAt(x,y);b.valid++;
      const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);
      if(!Number.isFinite(sp)||!Number.isFinite(ac)||ac>=channel)continue;
      if(sp>=.05&&sp<=4)b.opp++;
    }
    const mark=(x,y)=>{if(Number.isFinite(x)&&Number.isFinite(y))binAt(x,y).covered=true};
    let targetNearest=Infinity,targetGrid=null;
    const target=q==='Arkansas'?[-91.71263,35.06357]:null;
    if(target)targetGrid=toGrid(target);
    const distSeg=(px,py,ax,ay,bx,by)=>{
      const vx=bx-ax,vy=by-ay,wx=px-ax,wy=py-ay,vv=vx*vx+vy*vy;
      let t=vv?((wx*vx+wy*vy)/vv):0;t=Math.max(0,Math.min(1,t));
      return Math.hypot(px-(ax+t*vx),py-(ay+t*vy));
    };
    for(const f of swales){
      const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;if(!Array.isArray(c)||!c.length)continue;
      let prev=null;
      for(const ll of c){
        const g=toGrid(ll);if(!g)continue;mark(g.x,g.y);
        if(prev){
          const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));
          for(let j=1;j<steps;j++){const t=j/steps;mark(prev.x+dx*t,prev.y+dy*t);}
          if(targetGrid)targetNearest=Math.min(targetNearest,distSeg(targetGrid.x,targetGrid.y,prev.x,prev.y,g.x,g.y));
        }
        prev=g;
      }
    }
    // Scale the 96-grid fine qualification to the current base grid by area.
    const scale=(hy.w/96)*(hy.h/96);
    const minValid=Math.max(5,Math.round(5*scale));
    const minOpp=Math.max(2,Math.round(2*scale));
    const qualified=bins.filter(b=>b.valid>=minValid&&b.opp>=minOpp&&(b.opp/Math.max(1,b.valid))>=.18);
    const unserved=qualified.filter(b=>!b.covered);
    return {
      grid:{w:hy.w,h:hy.h,cellX:hy.cellX,cellY:hy.cellY},
      coreMs:perf?.totalMs??null,
      generated:pub?.generated??null,
      visible:display?.swaleLines??pub?.overlaySwaleLines??null,
      unsafe:flow?.unsafeSegments??null,
      outside:boundary?.outsideAfterClip??null,
      generationAudit:gen,
      qualified:qualified.length,
      covered:qualified.length-unserved.length,
      unservedKeys:unserved.map(b=>b.bx+','+b.by),
      targetNearest:Number.isFinite(targetNearest)?Number(targetNearest.toFixed(2)):null
    };
  },query);

  if(audit){
    audit.unserved=audit.unservedKeys.length;
    audit.coverageRatio=audit.qualified?Number((audit.covered/audit.qualified).toFixed(4)):null;
    audit.gapClusters=clusterSizes(audit.unservedKeys);
    delete audit.unservedKeys;
  }
  const row={query,grid,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};
  rows.push(row);console.log('EARTHLINE_M46_16800_AB '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'-'+grid+'.png',fullPage:false});}catch(_){ }
  await context.close();
}

for(const q of STATES)for(const g of GRIDS)await runOne(q,g);
await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
console.log('EARTHLINE_M46_16800_AB_SUMMARY '+JSON.stringify(rows));

const bad=rows.filter(r=>!r.audit||r.loadError||r.timedOut||r.pageErrors.length||Number(r.audit.coreMs)>15000||Number(r.audit.generated)!==Number(r.audit.visible)||Number(r.audit.unsafe)!==0||Number(r.audit.outside?.swales||0)!==0);
if(bad.length)process.exitCode=1;
