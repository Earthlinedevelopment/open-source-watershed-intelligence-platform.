import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1, found '+n);body=body.replace(needle,replacement);};
  apply('beforeSort',
`    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);`,
`    const jurisdictionEligibleCandidates16539=candidates.length;
    const coastDistCandidate16653=c16653=>{
      const seg16653=c16653&&c16653.segment||[],ll16653=seg16653[Math.floor((seg16653.length-1)/2)]||null;
      if(!Array.isArray(ll16653)||!hy.outsideLandMask16632)return null;
      const g16653=llGrid(hy,ll16653);if(!g16653||!Number.isFinite(g16653.x)||!Number.isFinite(g16653.y))return null;
      const cx16653=Math.max(0,Math.min(hy.w-1,Math.round(g16653.x))),cy16653=Math.max(0,Math.min(hy.h-1,Math.round(g16653.y)));
      for(let r16653=0;r16653<=12;r16653++)for(let dy16653=-r16653;dy16653<=r16653;dy16653++)for(let dx16653=-r16653;dx16653<=r16653;dx16653++){
        if(Math.max(Math.abs(dx16653),Math.abs(dy16653))!==r16653)continue;
        const x16653=cx16653+dx16653,y16653=cy16653+dy16653;if(x16653<0||x16653>=hy.w||y16653<0||y16653>=hy.h)continue;
        if(hy.outsideLandMask16632[y16653*hy.w+x16653])return r16653;
      }
      return null;
    };
    const coastCandidateRows16653=candidates.map((c16653,i16653)=>({i:i16653,score:Number(c16653&&c16653.score||0),x:Number(c16653&&c16653.x),y:Number(c16653&&c16653.y),dist:coastDistCandidate16653(c16653),mid:(c16653&&c16653.segment||[])[Math.floor(((c16653&&c16653.segment||[]).length-1)/2)]||null}));
    candidates.sort((a,b)=>b.score-a.score);`);
  apply('afterChosen',
`    if(chosen.length<14){for(const c of candidates){if(chosen.length>=24)break;if(chosen.includes(c))continue;if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<4))continue;chosen.push(c);}}`,
`    if(chosen.length<14){for(const c of candidates){if(chosen.length>=24)break;if(chosen.includes(c))continue;if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<4))continue;chosen.push(c);}}
    const summarizeCoast16653=list16653=>{const ds16653=list16653.map(coastDistCandidate16653).filter(Number.isFinite).sort((a,b)=>a-b);return {n:list16653.length,finite:ds16653.length,min:ds16653[0]??null,le1:ds16653.filter(x=>x<=1).length,le2:ds16653.filter(x=>x<=2).length,le3:ds16653.filter(x=>x<=3).length,le4:ds16653.filter(x=>x<=4).length,le6:ds16653.filter(x=>x<=6).length,le9:ds16653.filter(x=>x<=9).length};};
    window.EARTHLINE_TX_COAST_RANK_16653={eligible:summarizeCoast16653(candidates),chosen:summarizeCoast16653(chosen),rows:coastCandidateRows16653.filter(r=>Number.isFinite(r.dist)).sort((a,b)=>(a.dist-b.dist)||(b.score-a.score)).slice(0,40)};`);
  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_coast_rank='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
const started=Date.now();
await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(400);
const state=await page.evaluate(()=>({coastRank:window.EARTHLINE_TX_COAST_RANK_16653||null,gen:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
console.log('EARTHLINE_TX_COAST_RANK '+JSON.stringify({patches,elapsedMs:Date.now()-started,timedOut,state}));
await browser.close();
if(timedOut||state.lastError||Object.values(patches).some(v=>v!==1))process.exitCode=1;
