import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Iowa','Arkansas','Oklahoma','Nebraska','Vermont','Texas','Florida','Louisiana','California','New York','Maryland','Colorado'];
const OUT='artifacts/mantra46-16795-chain-audit';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const rows=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();
    const needle="    const range16713=(list16713,key16713)=>{";
    const probe=`
    // M46 diagnostic only: fine opportunity -> candidate -> chosen chain.
    try{
      const nxM46=24,nyM46=24,binsM46=[];
      for(let byM46=0;byM46<nyM46;byM46++)for(let bxM46=0;bxM46<nxM46;bxM46++)binsM46.push({bx:bxM46,by:byM46,valid:0,opp:0});
      const binM46=(xM46,yM46)=>{
        const bxM46=Math.max(0,Math.min(nxM46-1,Math.floor(Number(xM46)*nxM46/Math.max(1,hy.w))));
        const byM46=Math.max(0,Math.min(nyM46-1,Math.floor(Number(yM46)*nyM46/Math.max(1,hy.h))));
        return binsM46[byM46*nxM46+bxM46];
      };
      for(let yM46=0;yM46<hy.h;yM46++)for(let xM46=0;xM46<hy.w;xM46++){
        const iM46=yM46*hy.w+xM46;
        if(hy.validityMask16584&&hy.validityMask16584[iM46]!==1)continue;
        const bM46=binM46(xM46,yM46);bM46.valid++;
        const spM46=Number(hy.slope[iM46]),acM46=Number(hy.acc[iM46]);
        if(Number.isFinite(spM46)&&Number.isFinite(acM46)&&acM46<channel&&spM46>=.05&&spM46<=4)bM46.opp++;
      }
      const qualifiedM46=new Set(binsM46.filter(bM46=>bM46.valid>=5&&bM46.opp>=2&&(bM46.opp/Math.max(1,bM46.valid))>=.18).map(bM46=>bM46.bx+','+bM46.by));
      const footprintM46=(cM46)=>{
        const outM46=new Set(),segM46=Array.isArray(cM46&&cM46.segment)?cM46.segment:null;
        if(segM46&&segM46.length){
          let prevM46=null;
          for(const llM46 of segM46){
            const gM46=llGrid(hy,llM46);
            if(!gM46||!Number.isFinite(Number(gM46.x))||!Number.isFinite(Number(gM46.y)))continue;
            if(prevM46){
              const dxM46=Number(gM46.x)-prevM46.x,dyM46=Number(gM46.y)-prevM46.y,stepsM46=Math.max(1,Math.ceil(Math.hypot(dxM46,dyM46)*2));
              for(let sM46=0;sM46<=stepsM46;sM46++){
                const tM46=sM46/stepsM46,bM46=binM46(prevM46.x+dxM46*tM46,prevM46.y+dyM46*tM46);
                outM46.add(bM46.bx+','+bM46.by);
              }
            }else{
              const bM46=binM46(Number(gM46.x),Number(gM46.y));outM46.add(bM46.bx+','+bM46.by);
            }
            prevM46={x:Number(gM46.x),y:Number(gM46.y)};
          }
        }else if(Number.isFinite(Number(cM46&&cM46.x))&&Number.isFinite(Number(cM46&&cM46.y))){
          const bM46=binM46(Number(cM46.x),Number(cM46.y));outM46.add(bM46.bx+','+bM46.by);
        }
        return outM46;
      };
      const candM46=new Set(),chosenM46=new Set();
      for(const cM46 of candidates||[])for(const kM46 of footprintM46(cM46))if(qualifiedM46.has(kM46))candM46.add(kM46);
      for(const cM46 of chosen||[])for(const kM46 of footprintM46(cM46))if(qualifiedM46.has(kM46))chosenM46.add(kM46);
      const noCandidateM46=[...qualifiedM46].filter(kM46=>!candM46.has(kM46));
      const selectionMissM46=[...qualifiedM46].filter(kM46=>candM46.has(kM46)&&!chosenM46.has(kM46));
      window.__EARTHLINE_M46_CHAIN_16795={
        qualified:[...qualifiedM46],candidateCovered:[...candM46],chosenCovered:[...chosenM46],
        noCandidate:noCandidateM46,selectionMiss:selectionMissM46,
        candidates:(candidates||[]).length,chosen:(chosen||[]).length,
        hy:{w:hy.w,h:hy.h}
      };
    }catch(eM46){window.__EARTHLINE_M46_CHAIN_ERROR_16795=String(eM46);}
`;
    const count=body.split(needle).length-1;
    if(count!==1)throw new Error('final-selection insertion owner count='+count);
    body=body.replace(needle,probe+needle);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false; const started=Date.now();

  try{
    await page.goto(BASE+'?m46_chain2='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(()=>!!window.__EARTHLINE_M46_CHAIN_16795||!!window.__EARTHLINE_M46_CHAIN_ERROR_16795,{timeout:50000,polling:100});
    }catch(_){timedOut=true;}
  }catch(e){loadError=String(e);}

  const raw=loadError||timedOut?null:await page.evaluate(()=>({
    chain:window.__EARTHLINE_M46_CHAIN_16795||null,
    chainError:window.__EARTHLINE_M46_CHAIN_ERROR_16795||null,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null
  }));

  const clusterSizes=(keys,nx=24,ny=24)=>{
    const set=new Set(keys||[]),seen=new Set(),sizes=[];
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
  };

  let audit=null;
  if(raw?.chain){
    const c=raw.chain,qc=c.qualified.length,cc=c.candidateCovered.length,sc=c.chosenCovered.length;
    audit={
      candidates:c.candidates,chosen:c.chosen,qualified:qc,candidateCovered:cc,chosenCovered:sc,
      noCandidate:c.noCandidate.length,selectionMiss:c.selectionMiss.length,
      candidateCoverageRatio:qc?Number((cc/qc).toFixed(4)):null,
      chosenCoverageRatio:qc?Number((sc/qc).toFixed(4)):null,
      selectionCaptureRatio:cc?Number((sc/cc).toFixed(4)):null,
      noCandidateClusters:clusterSizes(c.noCandidate).slice(0,12),
      selectionMissClusters:clusterSizes(c.selectionMiss).slice(0,12),
      coreMs:raw.perf?.totalMs??null
    };
  }

  const row={query,loadError,timedOut,pageErrors,chainError:raw?.chainError||null,elapsedMs:Date.now()-started,audit};
  rows.push(row);
  console.log('EARTHLINE_M46_CHAIN2 '+JSON.stringify(row));
  await context.close();
}

await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
console.log('EARTHLINE_M46_CHAIN2_SUMMARY '+JSON.stringify(rows.map(r=>({query:r.query,...(r.audit||{}),chainError:r.chainError,timedOut:r.timedOut}))));
