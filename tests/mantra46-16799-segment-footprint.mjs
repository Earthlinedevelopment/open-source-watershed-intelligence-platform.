import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Florida','Colorado'];
const OUT='artifacts/mantra46-16799-segment-footprint';
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
      const nx16799=24,ny16799=24;
      const bins16799=[];
      for(let by16799=0;by16799<ny16799;by16799++)for(let bx16799=0;bx16799<nx16799;bx16799++)bins16799.push({bx:bx16799,by:by16799,valid:0,opp:0});
      const bin16799=(x16799,y16799)=>{
        const bx16799=Math.max(0,Math.min(nx16799-1,Math.floor(Number(x16799)*nx16799/Math.max(1,hy.w))));
        const by16799=Math.max(0,Math.min(ny16799-1,Math.floor(Number(y16799)*ny16799/Math.max(1,hy.h))));
        return bins16799[by16799*nx16799+bx16799];
      };
      for(let y16799=0;y16799<hy.h;y16799++)for(let x16799=0;x16799<hy.w;x16799++){
        const i16799=y16799*hy.w+x16799;if(hy.validityMask16584?.[i16799]!==1)continue;
        const b16799=bin16799(x16799,y16799);b16799.valid++;
        const sp16799=Number(hy.slope[i16799]),ac16799=Number(hy.acc[i16799]);
        if(!Number.isFinite(sp16799)||!Number.isFinite(ac16799)||ac16799>=channel)continue;
        if(sp16799>=.05&&sp16799<=4)b16799.opp++;
      }
      const qualified16799=new Set(bins16799.filter(b16799=>b16799.valid>=5&&b16799.opp>=2&&(b16799.opp/Math.max(1,b16799.valid))>=.18).map(b16799=>b16799.bx+','+b16799.by));

      const markSegment16799=(seg16799,set16799)=>{
        if(!Array.isArray(seg16799)||!seg16799.length)return;
        let prev16799=null;
        const markGrid16799=(x16799,y16799)=>{
          const b16799=bin16799(x16799,y16799),k16799=b16799.bx+','+b16799.by;
          if(qualified16799.has(k16799))set16799.add(k16799);
        };
        for(const ll16799 of seg16799){
          const g16799=llGrid(hy,ll16799);if(!g16799||!Number.isFinite(Number(g16799.x))||!Number.isFinite(Number(g16799.y)))continue;
          const gx16799=Number(g16799.x),gy16799=Number(g16799.y);markGrid16799(gx16799,gy16799);
          if(prev16799){
            const dx16799=gx16799-prev16799.x,dy16799=gy16799-prev16799.y,steps16799=Math.max(1,Math.ceil(Math.hypot(dx16799,dy16799)*2));
            for(let s16799=1;s16799<steps16799;s16799++){const t16799=s16799/steps16799;markGrid16799(prev16799.x+dx16799*t16799,prev16799.y+dy16799*t16799);}
          }
          prev16799={x:gx16799,y:gy16799};
        }
      };

      const candidateCovered16799=new Set();
      for(const c16799 of candidates)markSegment16799(c16799&&c16799.segment,candidateCovered16799);

      const anchors16799=new Map();
      const addAnchor16799=(key16799,coords16799,idx16799)=>{
        if(!qualified16799.has(key16799)||candidateCovered16799.has(key16799))return;
        idx16799=Math.max(3,Math.min(coords16799.length-4,idx16799));
        let list16799=anchors16799.get(key16799);if(!list16799)anchors16799.set(key16799,list16799=[]);
        if(list16799.some(o16799=>o16799.coords===coords16799&&o16799.idx===idx16799))return;
        if(list16799.length<10)list16799.push({coords:coords16799,idx:idx16799});
      };

      for(const f16799 of lines){
        const coords16799=f16799&&f16799.geometry&&f16799.geometry.coordinates;
        if(!Array.isArray(coords16799)||coords16799.length<12)continue;
        for(let i16799=1;i16799<coords16799.length;i16799++){
          const ga16799=llGrid(hy,coords16799[i16799-1]),gb16799=llGrid(hy,coords16799[i16799]);
          if(!ga16799||!gb16799||!Number.isFinite(Number(ga16799.x))||!Number.isFinite(Number(ga16799.y))||!Number.isFinite(Number(gb16799.x))||!Number.isFinite(Number(gb16799.y)))continue;
          const ax16799=Number(ga16799.x),ay16799=Number(ga16799.y),bx16799=Number(gb16799.x),by16799=Number(gb16799.y);
          const steps16799=Math.max(1,Math.ceil(Math.hypot(bx16799-ax16799,by16799-ay16799)*2));
          for(let s16799=0;s16799<=steps16799;s16799++){
            const t16799=s16799/steps16799,x16799=ax16799+(bx16799-ax16799)*t16799,y16799=ay16799+(by16799-ay16799)*t16799;
            const b16799=bin16799(x16799,y16799),key16799=b16799.bx+','+b16799.by;
            addAnchor16799(key16799,coords16799,i16799-1);
            addAnchor16799(key16799,coords16799,i16799);
          }
        }
      }

      const gapKeys16799=Array.from(anchors16799.keys());
      let attempted16799=0,added16799=0;
      for(const key16799 of gapKeys16799){
        if(candidateCovered16799.has(key16799))continue;
        for(const opt16799 of anchors16799.get(key16799)||[]){
          attempted16799++;
          const c16799=sampleSegment(opt16799.coords,opt16799.idx,true);
          if(!c16799)continue;
          const touched16799=new Set();markSegment16799(c16799.segment,touched16799);
          if(!touched16799.has(key16799))continue;
          c16799.contourGap16799=true;c16799.contourGapCell16799=key16799;
          candidates.push(c16799);added16799++;markSegment16799(c16799.segment,candidateCovered16799);break;
        }
      }

      window.EARTHLINE_CONTOUR_SEGMENT_GAP_16799={
        build:'EARTHLINE 16799',grid:'24x24',qualifiedCells:qualified16799.size,
        contourCrossedGapCells:gapKeys16799.length,attempted:attempted16799,added:added16799,
        candidateCoveredAfter:candidateCovered16799.size,
        rule:'walk full real contour segment footprints; for each qualified <=4% opportunity subcell crossed by a contour but lacking candidate footprint, add at most one real contour-derived screening candidate in that exact subcell; no synthetic lines or capacity change',
        at:new Date().toISOString()
      };
    }
    `;
    body=body.replace(insertionPoint,injected+insertionPoint);

    const cap="window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;";
    const neu="window.__EARTHLINE_M46_16799_CHAIN={hy,candidates,chosen};"+cap;
    if(body.split(cap).length-1!==1)throw new Error('generation capture owner not found');
    body=body.replace(cap,neu);

    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();

  try{
    await page.goto(BASE+'?m46_16799='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_16799_CHAIN&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:65000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(500);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const {hy,candidates,chosen}=window.__EARTHLINE_M46_16799_CHAIN;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const gap=window.EARTHLINE_CONTOUR_SEGMENT_GAP_16799||null;

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
      candidates:(candidates||[]).length,chosen:(chosen||[]).length,qualified:q.length,
      candidateCoverable:cand.size,selectedCovered:sel.size,
      noCandidateKeys:q.filter(k=>!cand.has(k)),
      selectionMissKeys:q.filter(k=>cand.has(k)&&!sel.has(k)),
      gap,coreMs:perf?.totalMs??null,
      generated:pub?.generated??null,visible:display?.swaleLines??pub?.overlaySwaleLines??null,
      unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip?.swales??null
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
  const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit,
    deltaCandidate:audit?Number((audit.candidateCoverageRatio-base.candidate).toFixed(4)):null,
    deltaSelected:audit?Number((audit.selectedCoverageRatio-base.selected).toFixed(4)):null};
  rows.push(row);
  console.log('EARTHLINE_M46_16799 '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'.png',fullPage:false});}catch(_){}
  await context.close();
}

await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
const bad=rows.filter(r=>r.loadError||r.timedOut||r.pageErrors.length||!r.audit||Number(r.audit.coreMs)>15000||Number(r.audit.generated)!==Number(r.audit.visible)||Number(r.audit.unsafe)!==0||Number(r.audit.outside||0)!==0);
console.log('EARTHLINE_M46_16799_SUMMARY '+JSON.stringify(rows));
if(bad.length)process.exitCode=1;
