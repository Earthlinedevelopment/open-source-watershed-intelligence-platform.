import {readFileSync} from 'node:fs';
const s=readFileSync('/tmp/elder-old.html','utf8');
for(const term of ['EARTHLINE_ELDER_TREES_V1_17097','elder tree','Elder Tree','ELDER']){
 let from=0,n=0;
 while(true){const at=s.indexOf(term,from);if(at<0)break;
   console.log('M83_ELDER_SNIP '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-5000),Math.min(s.length,at+10000))}));
   from=at+term.length;if(++n>=12)break;
 }
}
