import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
const names=[...s.matchAll(/function\s+([A-Za-z0-9_$]*elder[A-Za-z0-9_$]*)\s*\(/ig)].map(m=>({name:m[1],at:m.index}));
const assigns=[...s.matchAll(/window\.([A-Za-z0-9_$]*elder[A-Za-z0-9_$]*)/ig)].map(m=>({name:m[1],at:m.index}));
console.log('M83ELDERNAMES '+JSON.stringify({functions:names.slice(0,120),window:[...new Map(assigns.map(x=>[x.name,x])).values()].slice(0,120)}));
for(const term of ['elderCandidates','elderEvidence','ELDER TREE CONFIDENCE','maxS=33','authoritativeSafeSwales15815','prescribeSwales15778']){
 let from=0,n=0;
 while(true){const at=s.indexOf(term,from);if(at<0)break;
  console.log('M83PROP '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-1800),Math.min(s.length,at+5200))}));
  from=at+term.length;if(++n>=12)break;
 }
}
