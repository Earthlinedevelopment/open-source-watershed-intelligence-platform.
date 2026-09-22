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
    const injected=`
    if(!focusMode){
      try{
        const nx16800=24,ny16800=24,bins16800=[];
        for(let by16800=0;by16800<ny16800;by16800++)for(let bx16800=0;bx16800<nx16800;bx16800++)bins16800.push({bx:bx16800,by:by16800,valid:0,opp:0,pref:0});
        const bin16800=(x16800,y16800)=>{
          const bx16800=Math.max(0,Math.min(nx16800-1,Math.floor(Number(x16800)*nx16800/Math.max(1,hy.w))));
          const by16800=Math.max(0,Math.min(ny16800-1,Math.floor(Number(y16800)*ny16800/Math.max(1,hy.h))));
          return bins16800[by16800*nx16800+bx16800];
        };
        let insideSamples16800=0,outsideSamples16800=0;
        for(let y16800=0;y16800<hy.h;y16800++)for(let x16800=0;x16800<hy.w;x16800++){
          const i16800=y16800*hy.w+x16800;if(hy.validityMask16584?.[i16800]!==1)continue;
          if(jurisdictionGeometry16539){
            const ll16800=gridLL(hy,x16800,y16800);
            if(!earthlinePointInJurisdiction16539(ll16800,jurisdictionGeometry16539)){outsideSamples16800++;continue;}
          }
          insideSamples16800++;
          const b16800=bin16800(x16800,y16800);b16800.valid++;
          const sp16800=Number(hy.slope[i16800]),ac16800=Number(hy.acc[i16800]);
          if(!Number.isFinite(sp16800)||!Number.isFinite(ac16800)||ac16800>=channel)continue;
          if(sp16800>=.05&&sp16800<=4)b16800.opp++;
          if(sp16800>=.20&&sp16800<=4)b16800.pref++;
        }
        const qualified16800=new Set(bins16800.filter(b16800=>b16800.valid>=5&&b16800.opp>=2&&(b16800.opp/Math.max(1,b16800.valid))>=.18).map(b16800=>b16800.bx+','+b16800.by));

        const markSeg16800=(seg16800,set16800)=>{
          if(!Array.isArray(seg16800)||!seg16800.length)return;
          let prev16800=null;
          const markGrid16800=(x16800,y16800)=>{
            const b16800=bin16800(x16800,y16800),k16800=b16800.bx+','+b16800.by;
            if(qualified16800.has(k16800))set16800.add(k16800);
          };
          for(const ll16800 of seg16800){
            const g16800=llGrid(hy,ll16800);if(!g16800||!Number.isFinite(Number(g16800.x))||!Number.isFinite(Number(g16800.y)))continue;
            const gx16800=Number(g16800.x),gy16800=Number(g16800.y);markGrid16800(gx16800,gy16800);
            if(prev16800){
              const dx16800=gx16800-prev16800.x,dy16800=gy16800-prev16800.y,steps16800=Math.max(1,Math.ceil(Math.hypot(dx16800,dy16800)*2));
              for(let s16800=1;s16800<steps16800;s16800++){const t16800=s16800/steps16800;markGrid16800(prev16800.x+dx16800*t16800,prev16800.y+dy16800*t16800);}
            }
            prev16800={x:gx16800,y:gy16800};
          }
        };
        const cand16800=new Set(),sel16800=new Set();
        for(const c16800 of candidates||[])markSeg16800(c16800&&c16800.segment,cand16800);
        for(const c16800 of chosen||[])markSeg16800(c16800&&c16800.segment,sel16800);
        const q16800=Array.from(qualified16800),noCand16800=q16800.filter(k16800=>!cand16800.has(k16800)),selMiss16800=q16800.filter(k16800=>cand16800.has(k16800)&&!sel16800.has(k16800));

        let target16800=null;
        if(window.__EARTHLINE_M46_QUERY_16800==='Arkansas'){
          const ll16800=[-91.71263,35.06357],g16800=llGrid(hy,ll16800),b16800=g16800?bin16800(Number(g16800.x),Number(g16800.y)):null,k16800=b16800?b16800.bx+','+b16800.by:null;
          target16800={lng:ll16800[0],lat:ll16800[1],inside:jurisdictionGeometry16539?earthlinePointInJurisdiction16539(ll16800,jurisdictionGeometry16539):true,cell:k16800,valid:b16800?.valid??null,opp:b16800?.opp??null,pref:b16800?.pref??null,qualified:k16800?qualified16800.has(k16800):false,candidateCovered:k16800?cand16800.has(k16800):false,selectedCovered:k16800?sel16800.has(k16800):false};
        }

        window.__EARTHLINE_M46_16800_AUDIT={
          insideSamples:insideSamples16800,outsideSamples:outsideSamples16800,
          qualified:q16800.length,candidates:(candidates||[]).length,chosen:(chosen||[]).length,
          candidateCoverable:cand16800.size,selectedCovered:sel16800.size,
          noCandidateKeys:noCand16800,selectionMissKeys:selMiss16800,target:target16800
        };
      }catch(e16800){window.__EARTHLINE_M46_16800_AUDIT={error:String(e16800)};}
    }
    `;
    if(body.split(cap).length-1!==1)throw new Error('generation capture owner not found');
    body=body.replace(cap,injected+cap);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();

  try{
    await page.goto(BASE+'?m46_16800='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      window.__EARTHLINE_M46_QUERY_16800=q;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(()=>!!window.__EARTHLINE_M46_16800_AUDIT,{timeout:65000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(300);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(()=>window.__EARTHLINE_M46_16800_AUDIT||null);

  if(audit&&!audit.error){
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
