import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
const terms=['maxS=33','earthlinePathPointUsable(','earthlineSplitUsableSegments(','earthlineFinalSafeSegments15771(','slopePct(x,y)>maxS','authoritativeSafeSwales15815'];
for(const term of terms){
 let from=0,n=0;
 while(true){
  const at=s.indexOf(term,from);if(at<0)break;
  console.log('M83P4 '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-1200),Math.min(s.length,at+3200))}));
  from=at+term.length;if(++n>=30)break;
 }
}
