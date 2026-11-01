import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const a=s.indexOf('async function makeSwales');const b=s.indexOf('function makeFlows',a);const t=s.slice(a,b>0?b:a+70000);
for(const term of ['jurisdictionEligibleCount16539(','screenJurisdictionCandidate16539(','earthlineCooperativeYield16661()','candidates.push','chosen.push','acceptedChosen','for(const candidate','for(let i=0;i<candidates.length']){
 let n=0,from=0;while(true){const at=t.indexOf(term,from);if(at<0)break;console.log('PERF '+JSON.stringify({term,at,text:t.slice(Math.max(0,at-900),Math.min(t.length,at+2600))}));from=at+term.length;if(++n>=20)break;}
}
