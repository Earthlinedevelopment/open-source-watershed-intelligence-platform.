import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Florida','Colorado'];
const OUT='artifacts/mantra46-16801-prime-selection';
mkdirSync(OUT,{recursive:true});

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
        const nx16801=24,ny16801=24,bins16801=[];
        for(let by16801=0;by16801<ny16801;by16801++)for(let bx16801=0;bx16801<nx16801;bx16801++)bins16801.push({bx:bx16801,by:by16801,valid:0,opp:0,pref:0});
        const bin16801=(x16801,y16801)=>{
          const bx16801=Math.max(0,Math.min(nx16801-1,Math.floor(Number(x16801)*nx16801/Math.max(1,hy.w))));
          const by16801=Math.max(0,Math.min(ny16801-1,Math.floor(Number(y16801)*ny16801/Math.max(1,hy.h))));
          return bins16801[by16801*nx16801+bx16801];
        };
        for(let y16801=0;y16801<hy.h;y16801++)for(let x16801=0;x16801<hy.w;x16801++){
          const i16801=y16801*hy.w+x16801;if(hy.validityMask16584?.[i16801]!==1)continue;
          if(jurisdictionGeometry16539){
            const ll16801=gridLL(hy,x16801,y16801);
            if(!earthlinePointInJurisdiction16539(ll16801,jurisdictionGeometry16539))continue;
          }
          const b16801=bin16801(x16801,y16801);b16801.valid++;
          const sp16801=Number(hy.slope[i16801]),ac16801=Number(hy.acc[i16801]);
          if(!Number.isFinite(sp16801)||!Number.isFinite(ac16801)||ac16801>=channel)continue;
          if(sp16801>=.05&&sp16801<=4)b16801.opp++;
          if(sp16801>=.20&&sp16801<=4)b16801.pref++;
        }

        const qualified16801=new Set(bins16801.filter(b16801=>b16801.valid>=5&&b16801.opp>=2&&(b16801.opp/Math.max(1,b16801.valid))>=.18).map(b16801=>b16801.bx+','+b16801.by));
        const prime16801=new Set(bins16801.filter(b16801=>b16801.valid>=8&&b16801.opp>=8&&(b16801.opp/Math.max(1,b16801.valid))>=.70).map(b16801=>b16801.bx+','+b16801.by));

        const coverMap16801=(list16801)=>{
          const map16801=new Map();
          const mark16801=(key16801,c16801)=>{
            let arr16801=map16801.get(key16801);if(!arr16801)map16801.set(key16801,arr16801=[]);
            if(!arr16801.includes(c16801))arr16801.push(c16801);
          };
          for(const c16801 of list16801||[]){
            const seg16801=Array.isArray(c16801&&c16801.segment)?c16801.segment:null;if(!seg16801||!seg16801.length)continue;
            let prev16801=null;
            const markGrid16801=(x16801,y16801)=>{
              const b16801=bin16801(x16801,y16801),k16801=b16801.bx+','+b16801.by;
              if(qualified16801.has(k16801))mark16801(k16801,c16801);
            };
            for(const ll16801 of seg16801){
              const g16801=llGrid(hy,ll16801);if(!g16801||!Number.isFinite(Number(g16801.x))||!Number.isFinite(Number(g16801.y)))continue;
              const gx16801=Number(g16801.x),gy16801=Number(g16801.y);markGrid16801(gx16801,gy16801);
              if(prev16801){
                const dx16801=gx16801-prev16801.x,dy16801=gy16801-prev16801.y,steps16801=Math.max(1,Math.ceil(Math.hypot(dx16801,dy16801)*2));
                for(let s16801=1;s16801<steps16801;s16801++){const t16801=s16801/steps16801;markGrid16801(prev16801.x+dx16801*t16801,prev16801.y+dy16801*t16801);}
              }
              prev16801={x:gx16801,y:gy16801};
            }
          }
          return map16801;
        };

        const candMap16801=coverMap16801(candidates),selMap16801=coverMap16801(chosen);
        const candidatePrime16801=Array.from(prime16801).filter(k16801=>candMap16801.has(k16801));
        const selectedPrime16801=candidatePrime16801.filter(k16801=>selMap16801.has(k16801));
        const missedPrime16801=candidatePrime16801.filter(k16801=>!selMap16801.has(k16801));

        const priority16801=k16801=>{
          const [bx16801,by16801]=k16801.split(',').map(Number),b16801=bins16801[by16801*nx16801+bx16801];
          const ratio16801=b16801.opp/Math.max(1,b16801.valid),prefRatio16801=b16801.pref/Math.max(1,b16801.valid);
          return ratio16801*100+prefRatio16801*20+b16801.opp/4;
        };
        const missedRows16801=missedPrime16801.map(k16801=>({key:k16801,priority:priority16801(k16801),candidates:(candMap16801.get(k16801)||[]).length})).sort((a16801,b16801)=>b16801.priority-a16801.priority);

        let target16801=null;
        if(window.__EARTHLINE_M46_QUERY_16801==='Arkansas'){
          const ll16801=[-91.71263,35.06357],g16801=llGrid(hy,ll16801),b16801=g16801?bin16801(Number(g16801.x),Number(g16801.y)):null,k16801=b16801?b16801.bx+','+b16801.by:null;
          const targetPriority16801=k16801?priority16801(k16801):null;
          const ranked16801=candidatePrime16801.map(k16801=>({key:k16801,priority:priority16801(k16801)})).sort((a16801,b16801)=>b16801.priority-a16801.priority);
          target16801={cell:k16801,inside:jurisdictionGeometry16539?earthlinePointInJurisdiction16539(ll16801,jurisdictionGeometry16539):true,valid:b16801?.valid??null,opp:b16801?.opp??null,pref:b16801?.pref??null,ratio:b16801?Number((b16801.opp/Math.max(1,b16801.valid)).toFixed(4)):null,prime:k16801?prime16801.has(k16801):false,candidate:k16801?candMap16801.has(k16801):false,selected:k16801?selMap16801.has(k16801):false,priority:targetPriority16801,rank:ranked16801.findIndex(r16801=>r16801.key===k16801)+1,totalCandidatePrime:ranked16801.length};
        }

        window.__EARTHLINE_M46_16801_AUDIT={
          qualified:qualified16801.size,prime:prime16801.size,
          candidatePrime:candidatePrime16801.length,selectedPrime:selectedPrime16801.length,
          missedPrime:missedPrime16801.length,
          primeSelectionCapture:candidatePrime16801.length?selectedPrime16801.length/candidatePrime16801.length:1,
          topMissed:missedRows16801.slice(0,25),target:target16801
        };
      }catch(e16801){window.__EARTHLINE_M46_16801_AUDIT={error:String(e16801)};}
    }
    `;
    if(body.split(cap).length-1!==1)throw new Error('capture owner not found');
    body=body.replace(cap,injected+cap);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  try{
    await page.goto(BASE+'?m46_16801='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      window.__EARTHLINE_M46_QUERY_16801=q;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{await page.waitForFunction(()=>!!window.__EARTHLINE_M46_16801_AUDIT,{timeout:65000,polling:100});}catch(_){timedOut=true;}
  }catch(e){loadError=String(e);}
  const audit=loadError||timedOut?null:await page.evaluate(()=>window.__EARTHLINE_M46_16801_AUDIT||null);
  const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};
  rows.push(row);console.log('EARTHLINE_M46_16801 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
console.log('EARTHLINE_M46_16801_SUMMARY '+JSON.stringify(rows));
