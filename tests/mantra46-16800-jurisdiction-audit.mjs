import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Florida','Colorado'];
const OUT='artifacts/mantra46-16800-jurisdiction-audit';
mkdirSync(OUT,{recursive:true});

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
    const cap="window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;";
    const neu="window.__EARTHLINE_M46_16800_CHAIN={hy,candidates,chosen,jurisdictionGeometry16539};"+cap;
    if(body.split(cap).length-1!==1)throw new Error('generation capture owner not found');
    body=body.replace(cap,neu);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();

  try{
    await page.goto(BASE+'?m46_16800='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_16800_CHAIN&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:65000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(300);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate((query)=>{
    const {hy,candidates,chosen,jurisdictionGeometry16539:jur}=window.__EARTHLINE_M46_16800_CHAIN;
    const nx=24,ny=24;
    const vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    const channel=vals.length?vals[Math.max(0,Math.min(vals.length-1,Math.floor((vals.length-1)*.972)))]:Infinity;
    const [w,s,e,n]=hy.bounds;
    const toGrid=ll=>{
      if(!Array.isArray(ll)||ll.length<2||e===w||n===s)return null;
      const lng=Number(ll[0]),lat=Number(ll[1]);if(!Number.isFinite(lng)||!Number.isFinite(lat))return null;
      return {x:(lng-w)/(e-w)*Math.max(1,hy.w-1),y:(n-lat)/(n-s)*Math.max(1,hy.h-1)};
    };
    const bins=[];for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0,pref:0});
    const binAt=(x,y)=>{
      const bx=Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))));
      const by=Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))));
      return bins[by*nx+bx];
    };
    let insideSamples=0,outsideSamples=0;
    for(let y=0;y<hy.h;y++)for(let x=0;x<hy.w;x++){
      const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;
      if(jur){
        const ll=gridLL(hy,x,y);
        if(!earthlinePointInJurisdiction16539(ll,jur)){outsideSamples++;continue;}
      }
      insideSamples++;
      const b=binAt(x,y);b.valid++;
      const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);
      if(!Number.isFinite(sp)||!Number.isFinite(ac)||ac>=channel)continue;
      if(sp>=.05&&sp<=4)b.opp++;
      if(sp>=.20&&sp<=4)b.pref++;
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
    const q=[...qualified],noCandidate=q.filter(k=>!cand.has(k)),selectionMiss=q.filter(k=>cand.has(k)&&!sel.has(k));

    let target=null;
    if(query==='Arkansas'){
      const ll=[-91.71263,35.06357],g=toGrid(ll),b=g?binAt(g.x,g.y):null,k=b?b.bx+','+b.by:null;
      const inside=jur?earthlinePointInJurisdiction16539(ll,jur):true;
      target={lng:ll[0],lat:ll[1],inside,cell:k,valid:b?.valid??null,opp:b?.opp??null,pref:b?.pref??null,qualified:k?qualified.has(k):false,candidateCovered:k?cand.has(k):false,selectedCovered:k?sel.has(k):false};
    }
    return {
      insideSamples,outsideSamples,qualified:q.length,candidates:(candidates||[]).length,chosen:(chosen||[]).length,
      candidateCoverable:cand.size,selectedCovered:sel.size,noCandidateKeys:noCandidate,selectionMissKeys:selectionMiss,target
    };
  },query);

  if(audit){
    audit.noCandidateCount=audit.noCandidateKeys.length;
    audit.selectionMissCount=audit.selectionMissKeys.length;
    audit.candidateCoverageRatio=audit.qualified?Number((audit.candidateCoverable/audit.qualified).toFixed(4)):null;
    audit.selectedCoverageRatio=audit.qualified?Number((audit.selectedCovered/audit.qualified).toFixed(4)):null;
    audit.selectionCaptureRatio=audit.candidateCoverable?Number((audit.selectedCovered/audit.candidateCoverable).toFixed(4)):null;
    audit.noCandidateClusters=clusterSizes(audit.noCandidateKeys);
    audit.selectionMissClusters=clusterSizes(audit.selectionMissKeys);
    delete audit.noCandidateKeys;delete audit.selectionMissKeys;
  }

  const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};
  rows.push(row);console.log('EARTHLINE_M46_16800 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
console.log('EARTHLINE_M46_16800_SUMMARY '+JSON.stringify(rows));
