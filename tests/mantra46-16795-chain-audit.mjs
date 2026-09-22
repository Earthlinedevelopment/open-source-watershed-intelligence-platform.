import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Iowa','Arkansas','Oklahoma','Nebraska','Vermont','Texas','Florida','Louisiana','California','New York','Maryland','Colorado'];
const OUT='artifacts/mantra46-16795-chain-audit';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const rows=[];

function clusterSizes(keys,nx=24,ny=24){
  const set=new Set(keys),seen=new Set(),sizes=[];
  for(const k0 of set){
    if(seen.has(k0))continue;
    const [sx,sy]=k0.split(',').map(Number);
    const q=[[sx,sy]];seen.add(k0);let size=0;
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

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();
    const old="    /* EARTHLINE 16717 — coverage reservation decides inclusion only.";
    const neu="    window.__EARTHLINE_M46_CHAIN_16795={hy:hy,candidates:candidates,chosen:chosen};\n    /* EARTHLINE 16717 — coverage reservation decides inclusion only.";
    const count=body.split(old).length-1;
    if(count!==1)throw new Error('final-selector capture owner count='+count);
    body=body.replace(old,neu);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();

  try{
    await page.goto(BASE+'?m46_chain2='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s) &&
          !!window.__EARTHLINE_M46_CHAIN_16795 &&
          !!root &&
          String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:55000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(400);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const cap=window.__EARTHLINE_M46_CHAIN_16795;
    const hy=cap.hy,candidates=cap.candidates||[],chosen=cap.chosen||[];
    const nx=24,ny=24;

    const vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    const channel=vals.length?vals[Math.max(0,Math.min(vals.length-1,Math.floor((vals.length-1)*.972)))]:Infinity;

    const bins=[];
    for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0,pref:0});
    const binAtGrid=(x,y)=>{
      const bx=Math.max(0,Math.min(nx-1,Math.floor(Number(x)*nx/Math.max(1,hy.w))));
      const by=Math.max(0,Math.min(ny-1,Math.floor(Number(y)*ny/Math.max(1,hy.h))));
      return bins[by*nx+bx];
    };
    const toGrid=(ll)=>{
      if(!Array.isArray(ll)||ll.length<2||!Array.isArray(hy.bounds)||hy.bounds.length<4)return null;
      const [w,s,e,n]=hy.bounds,lng=Number(ll[0]),lat=Number(ll[1]);
      if(!Number.isFinite(lng)||!Number.isFinite(lat)||e===w||n===s)return null;
      return {x:(lng-w)/(e-w)*Math.max(1,hy.w-1),y:(n-lat)/(n-s)*Math.max(1,hy.h-1)};
    };

    for(let y=0;y<hy.h;y++)for(let x=0;x<hy.w;x++){
      const i=y*hy.w+x;
      if(hy.validityMask16584?.[i]!==1)continue;
      const b=binAtGrid(x,y);b.valid++;
      const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);
      if(!Number.isFinite(sp)||!Number.isFinite(ac)||ac>=channel)continue;
      if(sp>=.05&&sp<=4)b.opp++;
      if(sp>=.20&&sp<=4)b.pref++;
    }

    const qualified=new Set(
      bins.filter(b=>b.valid>=5&&b.opp>=2&&(b.opp/Math.max(1,b.valid))>=.18)
          .map(b=>b.bx+','+b.by)
    );

    const footprint=(c)=>{
      const out=new Set();
      const seg=Array.isArray(c?.segment)?c.segment:null;
      if(seg&&seg.length){
        const gp=[];
        for(const ll of seg){
          const g=toGrid(ll);
          if(g&&Number.isFinite(g.x)&&Number.isFinite(g.y))gp.push(g);
        }
        for(let i=0;i<gp.length;i++){
          const a=gp[i],ba=binAtGrid(a.x,a.y);out.add(ba.bx+','+ba.by);
          if(i===0)continue;
          const p=gp[i-1],dx=a.x-p.x,dy=a.y-p.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));
          for(let s=1;s<steps;s++){
            const t=s/steps,b=binAtGrid(p.x+dx*t,p.y+dy*t);out.add(b.bx+','+b.by);
          }
        }
      }else if(Number.isFinite(Number(c?.x))&&Number.isFinite(Number(c?.y))){
        const b=binAtGrid(Number(c.x),Number(c.y));out.add(b.bx+','+b.by);
      }
      return [...out].filter(k=>qualified.has(k));
    };

    const candidateCover=new Set(),chosenCover=new Set();
    for(const c of candidates)for(const k of footprint(c))candidateCover.add(k);
    for(const c of chosen)for(const k of footprint(c))chosenCover.add(k);

    const q=[...qualified];
    const noCandidate=q.filter(k=>!candidateCover.has(k));
    const selectionMiss=q.filter(k=>candidateCover.has(k)&&!chosenCover.has(k));
    const covered=q.filter(k=>chosenCover.has(k));

    return {
      hy:{w:hy.w,h:hy.h},
      candidates:candidates.length,
      chosen:chosen.length,
      qualified:q.length,
      candidateCoverable:candidateCover.size,
      selectedCovered:covered.length,
      noCandidateCount:noCandidate.length,
      selectionMissCount:selectionMiss.length,
      candidateCoverageRatio:q.length?Number((candidateCover.size/q.length).toFixed(4)):null,
      selectedCoverageRatio:q.length?Number((covered.length/q.length).toFixed(4)):null,
      selectionCaptureRatio:candidateCover.size?Number((covered.length/candidateCover.size).toFixed(4)):null,
      noCandidateKeys:noCandidate,
      selectionMissKeys:selectionMiss
    };
  });

  if(audit){
    audit.noCandidateClusters=clusterSizes(audit.noCandidateKeys);
    audit.selectionMissClusters=clusterSizes(audit.selectionMissKeys);
    delete audit.noCandidateKeys;
    delete audit.selectionMissKeys;
  }

  const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};
  rows.push(row);
  console.log('EARTHLINE_M46_CHAIN2 '+JSON.stringify(row));
  await context.close();
}

await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
console.log('EARTHLINE_M46_CHAIN2_SUMMARY '+JSON.stringify(rows.map(r=>({query:r.query,...(r.audit||{})}))));
