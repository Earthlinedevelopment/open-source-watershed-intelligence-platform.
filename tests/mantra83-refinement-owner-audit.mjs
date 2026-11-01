import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['const selected16731','EARTHLINE_LATE_GAP_REFINEMENT_16741','lateStart16741','unresolved16731.length']){
  let at=s.indexOf(term);
  console.log('M83REFINE_SHORT '+JSON.stringify({term,at,text:at<0?'':s.slice(Math.max(0,at-2200),Math.min(s.length,at+6500))}));
}
