import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Florida','Colorado'];
const OUT='artifacts/mantra46-16798-contour-gap';
mkdirSync(OUT,{recursive:true});

const BASELINE={
  Arkansas:{candidate:0.7391,selected:0.6069},
  Oklahoma:{candidate:0.5270,selected:0.4783},
  Maryland:{candidate:0.2946,selected:0.2713},
  Florida:{candidate:0.9024,selected:0.8293},
  Colorado:{candidate:0.9706,selected:0.7798}
};

function clusterSizes(keys,nx=24,ny=24){
  const set=new Set(keys),seen=new Set(),sizes=[];
  for(const k0 of set){
    if(seen.has(k0))continue;
    let size=0;const [sx,sy]=k0.split(',').map(Number),q=[[sx,sy]];seen.add(k0);
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

const browser=await chromium.launch({headless:true});
const rows=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();

    const insertionPoint="if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);";
    if(body.split(insertionPoint).length-1!==1)throw new Error('target insertion point not found');

    const injected=`
    if(!focusMode){
      const nx16798=24,ny16798=24;
      const qBins16798=[];
      for(let by16798=0;by16798<ny16798;by16798++)for(let bx16798=0;bx16798<nx16798;bx16798++)qBins16798.push({bx:bx16798,by:by16798,valid:0,opp:0});
      const bin16798=(x16798,y16798)=>{
        const bx16798=Math.max(0,Math.min(nx16798-1,Math.floor(Number(x16798)*nx16798/Math.max(1,hy.w))));
        const by16798=Math.max(0,Math.min(ny16798-1,Math.floor(Number(y16798)*ny16798/Math.max(1,hy.h))));
        return qBins16798[by16798*nx16798+bx16798];
      };
      for(let y16798=0;y16798<hy.h;y16798++)for(let x16798=0;x16798<hy.w;x16798++){
        const i16798=y16798*hy.w+x16798;if(hy.validityMask16584?.[i16798]!==1)continue;
        const b16798=bin16798(x16798,y16798);b16798.valid++;
        const sp16798=Number(hy.slope[i16798]),ac16798=Number(hy.acc[i16798]);
        if(!Number.isFinite(sp16798)||!Number.isFinite(ac16798)||ac16798>=channel)continue;
        if(sp16798>=.05&&sp16798<=4)b16798.opp++;
      }
      const qualified16798=new Set(qBins16798.filter(b16798=>b16798.valid>=5&&b16798.opp>=2&&(b16798.opp/Math.max(1,b16798.valid))>=.18).map(b16798=>b16798.bx+','+b16798.by));
      const candidateCovered16798=new Set();
      const markSeg16798=(seg16798,set16798)=>{
        if(!Array.isArray(seg16798)||!seg16798.length)return;
        let prev16798=null;
        const markGrid16798=(x16798,y16798)=>{
          const b16798=bin16798(x16798,y16798),k16798=b16798.bx+','+b16798.by;
          if(qualified16798.has(k16798))set16798.add(k16798);
        };
        for(const ll16798 of seg16798){
          const g16798=llGrid(hy,ll16798);if(!g16798||!Number.isFinite(Number(g16798.x))||!Number.isFinite(Number(g16798.y)))continue;
          markGrid16798(Number(g16798.x),Number(g16798.y));
          if(prev16798){
            const dx16798=Number(g16798.x)-prev16798.x,dy16798=Number(g16798.y)-prev16798.y,steps16798=Math.max(1,Math.ceil(Math.hypot(dx16798,dy16798)*2));
            for(let s16798=1;s16798<steps16798;s16798++){const t16798=s16798/steps16798;markGrid16798(prev16798.x+dx16798*t16798,prev16798.y+dy16798*t16798);}
          }
          prev16798={x:Number(g16798.x),y:Number(g16798.y)};
        }
      };
      for(const c16798 of candidates)markSeg16798(c16798&&c16798.segment,candidateCovered16798);

      const anchors16798=new Map();
      for(const f16798 of lines){
        const coords16798=f16798&&f16798.geometry&&f16798.geometry.coordinates;if(!Array.isArray(coords16798)||coords16798.length<12)continue;
        for(let idx16798=3;idx16798<coords16798.length-3;idx16798++){
          const g16798=llGrid(hy,coords16798[idx16798]);if(!g16798||!Number.isFinite(Number(g16798.x))||!Number.isFinite(Number(g16798.y)))continue;
          const b16798=bin16798(Number(g16798.x),Number(g16798.y)),k16798=b16798.bx+','+b16798.by;
          if(!qualified16798.has(k16798)||candidateCovered16798.has(k16798))continue;
          let list16798=anchors16798.get(k16798);if(!list16798)anchors16798.set(k16798,list16798=[]);
          if(list16798.length<6)list16798.push({coords:coords16798,idx:idx16798});
        }
      }

      const gapKeys16798=Array.from(anchors16798.keys());
      let added16798=0,attempted16798=0;
      for(const k16798 of gapKeys16798){
        if(candidateCovered16798.has(k16798))continue;
        const options16798=anchors16798.get(k16798)||[];
        for(const opt16798 of options16798){
          attempted16798++;
          const c16798=sampleSegment(opt16798.coords,opt16798.idx,true);
          if(!c16798)continue;
          const touched16798=new Set();markSeg16798(c16798.segment,touched16798);
          if(!touched16798.has(k16798))continue;
          c16798.contourGap16798=true;c16798.contourGapCell16798=k16798;
          candidates.push(c16798);added16798++;markSeg16798(c16798.segment,candidateCovered16798);break;
        }
      }
      window.EARTHLINE_CONTOUR_GAP_GENERATION_16798={build:'EARTHLINE 16798',grid:'24x24',qualifiedCells:qualified16798.size,gapCellsWithContour:gapKeys16798.length,attempted:attempted16798,added:added16798,coveredAfter:candidateCovered16798.size,rule:'for qualified <=4% opportunity subcells already crossed by a real contour but lacking candidate footprint, add at most one real contour-derived screening candidate in that exact subcell; final capacity and science gates unchanged',at:new Date().toISOString()};
    }
    `;
    body=body.replace(insertionPoint,injected+insertionPoint);

    const cap="window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;";
    const neu="window.__EARTHLINE_M46_16798_CHAIN={hy,candidates,chosen};"+cap;
    if(body.split(cap).length-1!==1)throw new Error('generation capture owner not found');
    body=body.replace(cap,neu);

    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();

  try{
    await page.goto(BASE+'?m46_16798='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_16798_CHAIN&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:65000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(500);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const {hy,candidates,chosen}=window.__EARTHLINE_M46_16798_CHAIN;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const gap=window.EARTHLINE_CONTOUR_GAP_GENERATION_16798||null;

    const nx=24,ny=24;
    const vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    const channel=vals.length?vals[Math.max(0,Math.min(vals.length-1,Math.floor((vals.length-1)*.972)))]:Infinity;
    const [w,s,e,n]=hy.bounds;
    const toGrid=ll=>{
      if(!Array.isArray(ll)||ll.length<2||e===w||n===s)return null;
      const lng=Number(ll[0]),lat=Number(ll[1]);if(!Number.isFinite(lng)||!Number.isFinite(lat))return null;
      return {x:(lng-w)/(e-w)*Math.max(1,hy.w-1),y:(n-lat)/(n-s)*Math.max(1,hy.h-1)};
    };
    const bins=[];for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0});
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
    const qualified=new Set(bins.filter(b=>b.valid>=5&&b.opp>=2&&(b.opp/Math.max(1,b.valid))>=.18).map(b=>b.bx+','+b.by));
    const footprint=c=>{
      const out=new Set(),seg=Array.isArray(c?.segment)?c.segment:null;if(!seg||!seg.length)return out;
      let prev=null;
      for(const ll of seg){
        const g=toGrid(ll);if(!g)continue;
        const mark=(x,y)=>{const b=binAt(x,y),k=b.bx+','+b.by;if(qualified.has(k))out.add(k);};
        mark(g.x,g.y);
        if(prev){
          const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));
          for(let j=1;j<steps;j++){const t=j/steps;mark(prev.x+dx*t,prev.y+dy*t);}
        }
        prev=g;
      }
      return out;
    };
    const cand=new Set(),sel=new Set();
    for(const c of candidates||[])for(const k of footprint(c))cand.add(k);
    for(const c of chosen||[])for(const k of footprint(c))sel.add(k);
    const q=[...qualified];
    return {
      candidates:(candidates||[]).length,
      chosen:(chosen||[]).length,
      qualified:q.length,
      candidateCoverable:cand.size,
      selectedCovered:sel.size,
      noCandidateKeys:q.filter(k=>!cand.has(k)),
      selectionMissKeys:q.filter(k=>cand.has(k)&&!sel.has(k)),
      gap,
      coreMs:perf?.totalMs??null,
      generated:pub?.generated??null,
      visible:display?.swaleLines??pub?.overlaySwaleLines??null,
      unsafe:flow?.unsafeSegments??null,
      outside:boundary?.outsideAfterClip?.swales??null
    };
  });

  if(audit){
    audit.candidateCoverageRatio=audit.qualified?Number((audit.candidateCoverable/audit.qualified).toFixed(4)):null;
    audit.selectedCoverageRatio=audit.qualified?Number((audit.selectedCovered/audit.qualified).toFixed(4)):null;
    audit.noCandidateCount=audit.noCandidateKeys.length;
    audit.selectionMissCount=audit.selectionMissKeys.length;
    audit.noCandidateClusters=clusterSizes(audit.noCandidateKeys);
    audit.selectionMissClusters=clusterSizes(audit.selectionMissKeys);
    delete audit.noCandidateKeys;delete audit.selectionMissKeys;
  }

  const base=BASELINE[query];
  const row={
    query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit,
    deltaCandidate:audit?Number((audit.candidateCoverageRatio-base.candidate).toFixed(4)):null,
    deltaSelected:audit?Number((audit.selectedCoverageRatio-base.selected).toFixed(4)):null
  };
  rows.push(row);
  console.log('EARTHLINE_M46_16798 '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'.png',fullPage:false});}catch(_){}
  await context.close();
}

await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
const bad=rows.filter(r=>
  r.loadError||r.timedOut||r.pageErrors.length||!r.audit||
  Number(r.audit.coreMs)>15000||
  Number(r.audit.generated)!==Number(r.audit.visible)||
  Number(r.audit.unsafe)!==0||
  Number(r.audit.outside||0)!==0
);
console.log('EARTHLINE_M46_16798_SUMMARY '+JSON.stringify(rows));
if(bad.length)process.exitCode=1;
