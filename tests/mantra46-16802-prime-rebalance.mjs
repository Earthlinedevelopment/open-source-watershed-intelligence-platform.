import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Florida','Colorado'];
const OUT='artifacts/mantra46-16802-prime-rebalance';
mkdirSync(OUT,{recursive:true});

const BASELINE={
  Arkansas:{candidatePrime:208,selectedPrime:179,targetSelected:false},
  Oklahoma:{candidatePrime:209,selectedPrime:196},
  Maryland:{candidatePrime:65,selectedPrime:63},
  Florida:{candidatePrime:44,selectedPrime:42},
  Colorado:{candidatePrime:276,selectedPrime:216}
};

const browser=await chromium.launch({headless:true});
const rows=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();

    const marker="const range16713=(list16713,key16713)=>{const a16713=list16713.map(c16713=>Number(c16713[key16713])).filter(Number.isFinite);return a16713.length?Math.max(...a16713)-Math.min(...a16713):0;};";
    if(body.split(marker).length-1!==1)throw new Error('prime rebalance insertion owner not found');

    const injected=`
    if(!focusMode&&chosen.length&&candidates.length){
      try{
        const nx16802=24,ny16802=24,bins16802=[];
        for(let by16802=0;by16802<ny16802;by16802++)for(let bx16802=0;bx16802<nx16802;bx16802++)bins16802.push({bx:bx16802,by:by16802,valid:0,opp:0,pref:0});
        const bin16802=(x16802,y16802)=>{
          const bx16802=Math.max(0,Math.min(nx16802-1,Math.floor(Number(x16802)*nx16802/Math.max(1,hy.w))));
          const by16802=Math.max(0,Math.min(ny16802-1,Math.floor(Number(y16802)*ny16802/Math.max(1,hy.h))));
          return bins16802[by16802*nx16802+bx16802];
        };
        for(let y16802=0;y16802<hy.h;y16802++)for(let x16802=0;x16802<hy.w;x16802++){
          const i16802=y16802*hy.w+x16802;if(hy.validityMask16584?.[i16802]!==1)continue;
          if(jurisdictionGeometry16539){
            const ll16802=gridLL(hy,x16802,y16802);
            if(!earthlinePointInJurisdiction16539(ll16802,jurisdictionGeometry16539))continue;
          }
          const b16802=bin16802(x16802,y16802);b16802.valid++;
          const sp16802=Number(hy.slope[i16802]),ac16802=Number(hy.acc[i16802]);
          if(!Number.isFinite(sp16802)||!Number.isFinite(ac16802)||ac16802>=channel)continue;
          if(sp16802>=.05&&sp16802<=4)b16802.opp++;
          if(sp16802>=.20&&sp16802<=4)b16802.pref++;
        }

        const prime16802=new Set(bins16802.filter(b16802=>b16802.valid>=8&&b16802.opp>=8&&(b16802.opp/Math.max(1,b16802.valid))>=.70).map(b16802=>b16802.bx+','+b16802.by));
        const priority16802=k16802=>{
          const p16802=k16802.split(',').map(Number),b16802=bins16802[p16802[1]*nx16802+p16802[0]];
          return (b16802.opp/Math.max(1,b16802.valid))*100+(b16802.pref/Math.max(1,b16802.valid))*20+b16802.opp/4;
        };
        const footprint16802=c16802=>{
          const out16802=new Set(),seg16802=Array.isArray(c16802&&c16802.segment)?c16802.segment:null;if(!seg16802||!seg16802.length)return out16802;
          let prev16802=null;
          const markGrid16802=(x16802,y16802)=>{
            const b16802=bin16802(x16802,y16802),k16802=b16802.bx+','+b16802.by;
            if(prime16802.has(k16802))out16802.add(k16802);
          };
          for(const ll16802 of seg16802){
            const g16802=llGrid(hy,ll16802);if(!g16802||!Number.isFinite(Number(g16802.x))||!Number.isFinite(Number(g16802.y)))continue;
            const gx16802=Number(g16802.x),gy16802=Number(g16802.y);markGrid16802(gx16802,gy16802);
            if(prev16802){
              const dx16802=gx16802-prev16802.x,dy16802=gy16802-prev16802.y,steps16802=Math.max(1,Math.ceil(Math.hypot(dx16802,dy16802)*2));
              for(let s16802=1;s16802<steps16802;s16802++){const t16802=s16802/steps16802;markGrid16802(prev16802.x+dx16802*t16802,prev16802.y+dy16802*t16802);}
            }
            prev16802={x:gx16802,y:gy16802};
          }
          return out16802;
        };

        const candFoot16802=new Map(),cellCandidates16802=new Map();
        for(const c16802 of candidates){
          const f16802=footprint16802(c16802);candFoot16802.set(c16802,f16802);
          for(const k16802 of f16802){let arr16802=cellCandidates16802.get(k16802);if(!arr16802)cellCandidates16802.set(k16802,arr16802=[]);arr16802.push(c16802);}
        }
        const candidatePrime16802=new Set(cellCandidates16802.keys());
        const coverageCount16802=new Map();
        const parentKey16802=c16802=>{
          if(!c16802||!Number.isFinite(Number(c16802.x))||!Number.isFinite(Number(c16802.y)))return null;
          const px16802=Math.max(0,Math.min(5,Math.floor(Number(c16802.x)*6/Math.max(1,hy.w))));
          const py16802=Math.max(0,Math.min(5,Math.floor(Number(c16802.y)*6/Math.max(1,hy.h))));
          return px16802+','+py16802;
        };
        const parentCount16802=new Map();
        const rebuild16802=()=>{
          coverageCount16802.clear();parentCount16802.clear();
          for(const c16802 of chosen){
            const pk16802=parentKey16802(c16802);if(pk16802)parentCount16802.set(pk16802,(parentCount16802.get(pk16802)||0)+1);
            for(const k16802 of candFoot16802.get(c16802)||[])coverageCount16802.set(k16802,(coverageCount16802.get(k16802)||0)+1);
          }
        };
        rebuild16802();

        let swaps16802=0,attempts16802=0;
        while(swaps16802<48){
          const missed16802=Array.from(candidatePrime16802).filter(k16802=>(coverageCount16802.get(k16802)||0)===0).sort((a16802,b16802)=>priority16802(b16802)-priority16802(a16802));
          if(!missed16802.length)break;
          let changed16802=false;
          for(const key16802 of missed16802){
            const addOptions16802=(cellCandidates16802.get(key16802)||[]).filter(c16802=>!chosen.includes(c16802)).sort((a16802,b16802)=>{
              const ac16802=Array.from(candFoot16802.get(a16802)||[]).filter(k16802=>(coverageCount16802.get(k16802)||0)===0).length;
              const bc16802=Array.from(candFoot16802.get(b16802)||[]).filter(k16802=>(coverageCount16802.get(k16802)||0)===0).length;
              return bc16802-ac16802||(Number(b16802.score)||0)-(Number(a16802.score)||0);
            });
            for(const add16802 of addOptions16802){
              attempts16802++;
              const addParent16802=parentKey16802(add16802);
              let donorIdx16802=-1,donorMetric16802=Infinity;
              for(let i16802=0;i16802<chosen.length;i16802++){
                const donor16802=chosen[i16802];if(donor16802===add16802)continue;
                const donorParent16802=parentKey16802(donor16802),parentN16802=donorParent16802?(parentCount16802.get(donorParent16802)||0):0;
                if(donorParent16802&&donorParent16802!==addParent16802&&parentN16802<=3)continue;
                let losesPrime16802=false;
                for(const k16802 of candFoot16802.get(donor16802)||[]){
                  if((coverageCount16802.get(k16802)||0)<=1){losesPrime16802=true;break;}
                }
                if(losesPrime16802)continue;
                const donorPrime16802=(candFoot16802.get(donor16802)||new Set()).size;
                const metric16802=(Number(donor16802.score)||0)+donorPrime16802*.05;
                if(metric16802<donorMetric16802){donorMetric16802=metric16802;donorIdx16802=i16802;}
              }
              if(donorIdx16802<0)continue;
              chosen[donorIdx16802]=add16802;swaps16802++;rebuild16802();changed16802=true;break;
            }
            if(changed16802)break;
          }
          if(!changed16802)break;
        }

        const selectedPrime16802=Array.from(candidatePrime16802).filter(k16802=>(coverageCount16802.get(k16802)||0)>0);
        const targetKey16802=(()=>{
          if(window.__EARTHLINE_M46_QUERY_16802!=='Arkansas')return null;
          const g16802=llGrid(hy,[-91.71263,35.06357]);if(!g16802)return null;
          const b16802=bin16802(Number(g16802.x),Number(g16802.y));return b16802.bx+','+b16802.by;
        })();
        window.EARTHLINE_PRIME_REBALANCE_16802={
          build:'EARTHLINE 16802',grid:'24x24',primeCells:prime16802.size,candidatePrime:candidatePrime16802.size,
          selectedPrime:selectedPrime16802.length,missedPrime:candidatePrime16802.size-selectedPrime16802.length,
          swaps:swaps16802,attempts:attempts16802,targetKey:targetKey16802,targetSelected:targetKey16802?(coverageCount16802.get(targetKey16802)||0)>0:null,
          rule:'count-neutral swaps may replace only a corridor redundant for all currently covered prime cells; donor 6x6 parents retain at least three corridors unless replacement stays in the same parent; add candidate must cover an unserved candidate-backed prime cell',
          at:new Date().toISOString()
        };
      }catch(e16802){window.EARTHLINE_PRIME_REBALANCE_16802={build:'EARTHLINE 16802',error:String(e16802),at:new Date().toISOString()};}
    }
    `;
    body=body.replace(marker,injected+marker);

    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();

  try{
    await page.goto(BASE+'?m46_16802='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      window.__EARTHLINE_M46_QUERY_16802=q;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.EARTHLINE_PRIME_REBALANCE_16802&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:65000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(500);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(()=>({
    rebalance:window.EARTHLINE_PRIME_REBALANCE_16802||null,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null
  }));

  const base=BASELINE[query];
  const row={
    query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,
    audit,
    baseline:base,
    deltaSelectedPrime:audit?.rebalance?audit.rebalance.selectedPrime-base.selectedPrime:null
  };
  rows.push(row);
  console.log('EARTHLINE_M46_16802 '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'.png',fullPage:false});}catch(_){}
  await context.close();
}

await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
const bad=rows.filter(r=>
  r.loadError||r.timedOut||r.pageErrors.length||!r.audit?.rebalance||r.audit.rebalance.error||
  Number(r.audit?.perf?.totalMs)>15000||
  Number(r.audit?.pub?.generated)!==Number(r.audit?.display?.swaleLines??r.audit?.pub?.overlaySwaleLines)||
  Number(r.audit?.flow?.unsafeSegments)!==0||
  Number(r.audit?.boundary?.outsideAfterClip?.swales||0)!==0
);
console.log('EARTHLINE_M46_16802_SUMMARY '+JSON.stringify(rows));
if(bad.length)process.exitCode=1;
