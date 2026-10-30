import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['authoritativeSafeSwales15815','earthlineSafetyResult15815','safeSwales15815','earthlineCommitSafety']){
 let from=0,n=0;
 while(true){const at=s.indexOf(term,from);if(at<0)break;
   console.log('M83_SAFE_OWNER '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-2200),Math.min(s.length,at+7500))}));
   from=at+term.length;if(++n>=15)break;
 }
}
