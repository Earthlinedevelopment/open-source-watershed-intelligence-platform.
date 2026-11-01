import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of [
  'EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736',
  'refine up to 18 exact jurisdiction cells',
  'EARTHLINE_LATE_GAP_REFINEMENT_16741',
  'selected.slice(0,18)',
  'coverage-gap-',
  'late-gap',
  'unresolvedAfter'
]){
 let from=0,n=0;
 while(true){
  const at=s.indexOf(term,from);if(at<0)break;
  console.log('M83REFINE '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-2600),Math.min(s.length,at+8000))}));
  from=at+term.length;if(++n>=8)break;
 }
}
