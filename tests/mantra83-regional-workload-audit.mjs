import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of [
  'const dem=await loadDEM',
  'dem=await loadDEM',
  'loadDEM(b,',
  'scale refinement ',
  'terrain-gap refinement ',
  'fine opportunity refinement ',
  'late-gap',
  'performance.now()-regionalStarted16198'
]){
  let from=0,n=0;
  while(true){
    const at=s.indexOf(term,from);if(at<0)break;
    console.log('M83REGWORK '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-900),Math.min(s.length,at+2600))}));
    from=at+term.length;if(++n>=15)break;
  }
}
