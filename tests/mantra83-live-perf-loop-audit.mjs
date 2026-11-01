import fs from 'node:fs';const s=fs.readFileSync('index.html','utf8');const a=s.indexOf('async function makeSwales');const b=s.indexOf('function makeFlows',a);const t=s.slice(a,b>0?b:a+80000);
for(const term of ['jurisdictionEligibleCount16539(','screenJurisdictionCandidate16539(','earthlineCooperativeYield16661()','for(const candidate16539','for(const c of candidates','chosen.some','selected.some','acceptedChosen','candidates.sort','candidates.push']){
 let from=0,n=0;while(true){const at=t.indexOf(term,from);if(at<0)break;console.log('PERF '+JSON.stringify({term,at,text:t.slice(Math.max(0,at-1000),Math.min(t.length,at+3200))}));from=at+term.length;if(++n>=20)break;}
}
