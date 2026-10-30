import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['ELDER TREE CONFIDENCE','elderEvidence','elderCandidates','earthlineElder','worm','swale texture','natural-texture','Regional timing','lastTiming','phase16198']){
 let from=0,n=0;
 while(true){
  const at=s.toLowerCase().indexOf(term.toLowerCase(),from); if(at<0)break;
  console.log('M83HEADS '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-1800),Math.min(s.length,at+5000))}));
  from=at+term.length;if(++n>=12)break;
 }
}
