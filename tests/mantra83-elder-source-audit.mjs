import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of [
  'ELDER TREE CONFIDENCE',
  'elderTree',
  'elder_tree',
  'elders',
  'Elder',
  'earthlineElder'
]){
 let from=0,n=0;
 while(true){
   const at=s.indexOf(term,from);if(at<0)break;
   console.log('M83ELDER '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-1500),Math.min(s.length,at+4500))}));
   from=at+term.length;if(++n>=12)break;
 }
}
