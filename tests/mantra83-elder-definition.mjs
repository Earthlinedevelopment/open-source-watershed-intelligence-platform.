import {readFileSync} from 'node:fs';
const s=readFileSync('/tmp/elder-old.html','utf8');
for(const term of [
  'window.EARTHLINE_ELDER_TREES_V1_17097=',
  'EARTHLINE_ELDER_TREES_V1_17097 =',
  'startProperty',
  'prefetchPropertyTarget',
  '17097'
]){
 let from=0,n=0;
 while(true){const at=s.indexOf(term,from);if(at<0)break;
   console.log('M83_ELDER_DEF '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-8000),Math.min(s.length,at+18000))}));
   from=at+term.length;if(++n>=8)break;
 }
}
