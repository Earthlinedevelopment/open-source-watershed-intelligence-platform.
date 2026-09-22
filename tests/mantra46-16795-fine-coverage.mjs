import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra46-16795-fine-coverage';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1908,height:882}});

await context.route('https://earthlinedevelopment.org/**',async route=>{
  const req=route.request();
  if(req.resourceType()!=='document') return route.continue();
  const resp=await route.fetch();
  let body=await resp.text();
  const old="try{earthlineStandardAudit16784({tier:focusMode?'focus':'regional',runToken,query:q,hy,stage:'core-published'});}catch(_){ }";
  const neu="try{window.__EARTHLINE_M46_HY_16795=hy;earthlineStandardAudit16784({tier:focusMode?'focus':'regional',runToken,query:q,hy,stage:'core-published'});}catch(_){ }";
  const count=body.split(old).length-1;
  if(count!==1) throw new Error('capture insertion owner count='+count);
  body=body.replace(old,neu);
  await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
});

const page=await context.newPage();
const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));

await page.goto(BASE+'?m46_fine_cov='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'), b=document.getElementById('runBtn');
  i.value='Arkansas';
  i.dispatchEvent(new Event('input',{bubbles:true}));
  i.dispatchEvent(new Event('change',{bubbles:true}));
  b.click();
});
await page.waitForFunction(()=>{
  const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
  return /screening published\./i.test(s) && !!window.__EARTHLINE_M46_HY_16795;
},{timeout:55000,polling:100});
await page.waitForTimeout(1200);

const result=await page.evaluate(()=>{
  const hy=window.__EARTHLINE_M46_HY_16795;
  const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  const swales=visual?.swales?.features||[];
  const fine=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null;

  const values=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  const pidx=Math.max(0,Math.min(values.length-1,Math.floor((values.length-1)*.972)));
  const channel=values.length?values[pidx]:Infinity;

  const toGrid=(ll)=>{
    if(!Array.isArray(ll)||ll.length<2||!Array.isArray(hy.bounds)||hy.bounds.length<4)return null;
    const [w,s,e,n]=hy.bounds;
    const lng=Number(ll[0]),lat=Number(ll[1]);
    if(!Number.isFinite(lng)||!Number.isFinite(lat)||e===w||n===s)return null;
    return {
      x:(lng-w)/(e-w)*Math.max(1,hy.w-1),
      y:(n-lat)/(n-s)*Math.max(1,hy.h-1)
    };
  };

  const nx=24, ny=24;
  const bins=[];
  for(let by=0;by<ny;by++) for(let bx=0;bx<nx;bx++){
    const x0=Math.floor(bx*hy.w/nx), x1=Math.min(hy.w-1,Math.ceil((bx+1)*hy.w/nx)-1);
    const y0=Math.floor(by*hy.h/ny), y1=Math.min(hy.h-1,Math.ceil((by+1)*hy.h/ny)-1);
    bins.push({bx,by,x0,x1,y0,y1,valid:0,opportunity:0,preferred:0,covered:false});
  }
  const binAt=(x,y)=>{
    const bx=Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))));
    const by=Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))));
    return bins[by*nx+bx];
  };

  for(let y=0;y<hy.h;y++) for(let x=0;x<hy.w;x++){
    const i=y*hy.w+x;
    if(hy.validityMask16584?.[i]!==1) continue;
    const b=binAt(x,y);
    b.valid++;
    const sp=Number(hy.slope[i]), ac=Number(hy.acc[i]);
    if(!Number.isFinite(sp)||!Number.isFinite(ac)||ac>=channel) continue;
    if(sp>=.05&&sp<=4)b.opportunity++;
    if(sp>=.20&&sp<=4)b.preferred++;
  }

  function markGrid(x,y){
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    binAt(x,y).covered=true;
  }

  for(const f of swales){
    const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;
    if(!Array.isArray(c)||!c.length)continue;
    for(let i=0;i<c.length;i++){
      const g=toGrid(c[i]);if(g)markGrid(g.x,g.y);
      if(i===0)continue;
      const ga=toGrid(c[i-1]),gb=toGrid(c[i]);
      if(!ga||!gb)continue;
      const dx=gb.x-ga.x,dy=gb.y-ga.y;
      const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));
      for(let s=1;s<steps;s++){
        const t=s/steps;
        markGrid(ga.x+dx*t,ga.y+dy*t);
      }
    }
  }

  // Scale the existing 12x12 opportunity rule to quarter-area 24x24 bins:
  // valid >= ceil(20/4)=5, opportunity >= ceil(8/4)=2, same 18% ratio.
  const qualified=bins.filter(b=>b.valid>=5&&b.opportunity>=2&&(b.opportunity/Math.max(1,b.valid))>=.18);
  const unserved=qualified.filter(b=>!b.covered);

  const set=new Set(unserved.map(b=>b.bx+','+b.by)),seen=new Set(),clusters=[];
  for(const b of unserved){
    const key=b.bx+','+b.by;if(seen.has(key))continue;
    const q=[b],cells=[];seen.add(key);
    while(q.length){
      const cur=q.shift();cells.push(cur);
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
        if(!ox&&!oy)continue;
        const nx2=cur.bx+ox,ny2=cur.by+oy,k=nx2+','+ny2;
        if(nx2<0||nx2>=nx||ny2<0||ny2>=ny||!set.has(k)||seen.has(k))continue;
        seen.add(k);q.push(bins[ny2*nx+nx2]);
      }
    }
    clusters.push(cells);
  }
  clusters.sort((a,b)=>b.length-a.length);

  const target={lng:-91.71263,lat:35.06357};
  const tg=toGrid([target.lng,target.lat]);
  const tb=tg?binAt(tg.x,tg.y):null;

  function pointSegDist(px,py,ax,ay,bx,by){
    const vx=bx-ax,vy=by-ay,wx=px-ax,wy=py-ay;
    const vv=vx*vx+vy*vy;
    let t=vv?((wx*vx+wy*vy)/vv):0;t=Math.max(0,Math.min(1,t));
    const qx=ax+t*vx,qy=ay+t*vy;
    return Math.hypot(px-qx,py-qy);
  }
  let targetNearest=Infinity;
  if(tg){
    for(const f of swales){
      const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;
      if(!Array.isArray(c)||c.length<2)continue;
      for(let i=1;i<c.length;i++){
        const a=toGrid(c[i-1]),b=toGrid(c[i]);
        if(!a||!b)continue;
        targetNearest=Math.min(targetNearest,pointSegDist(tg.x,tg.y,a.x,a.y,b.x,b.y));
      }
    }
  }

  return {
    hy:{w:hy.w,h:hy.h,bounds:hy.bounds},
    swaleCount:swales.length,
    fine,
    qualifiedCount:qualified.length,
    coveredQualified:qualified.filter(b=>b.covered).length,
    unservedCount:unserved.length,
    largestClusters:clusters.slice(0,12).map(c=>({
      size:c.length,
      cells:c.map(b=>({bx:b.bx,by:b.by,valid:b.valid,opportunity:b.opportunity,preferred:b.preferred}))
    })),
    target:{
      ...target,
      grid:tg?{x:Number(tg.x.toFixed(2)),y:Number(tg.y.toFixed(2))}:null,
      subcell:tb?{bx:tb.bx,by:tb.by,valid:tb.valid,opportunity:tb.opportunity,preferred:tb.preferred,covered:tb.covered}:null,
      nearestSwaleGridCells:Number.isFinite(targetNearest)?Number(targetNearest.toFixed(2)):null
    }
  };
});

result.pageErrors=pageErrors;
writeFileSync(OUT+'/result.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_M46_FINE_COVERAGE '+JSON.stringify({
  hy:result.hy,
  qualifiedCount:result.qualifiedCount,
  coveredQualified:result.coveredQualified,
  unservedCount:result.unservedCount,
  largestClusters:result.largestClusters.slice(0,5),
  target:result.target,
  pageErrors
}));
await page.screenshot({path:OUT+'/arkansas.png',fullPage:false});
await browser.close();
