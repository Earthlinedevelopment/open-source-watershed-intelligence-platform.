import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of [
  'earthline:analysis-complete',
  'EARTHLINE_DISPLAYED_RUN_16151',
  'EARTHLINE_DISPLAYED_RUN_16147',
  'window.M',
  'globalThis.M',
  'EARTHLINE_PROPERTY_TARGET_16201',
  'window.earthlineRegional15778',
  'publishDisplayedRun16151'
]){
  let from=0,n=0;
  while(true){
    const at=s.indexOf(term,from); if(at<0)break;
    console.log('M83BRIDGE '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-900),Math.min(s.length,at+2200))}));
    from=at+term.length;
    if(++n>=12)break;
  }
}
