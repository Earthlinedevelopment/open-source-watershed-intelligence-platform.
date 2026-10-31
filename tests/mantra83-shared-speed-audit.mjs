import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of [
  'EARTHLINE 16841 — GROUPED STATEWIDE-DEM LOCAL PHASE',
  'EARTHLINE_TERRAIN_GAP_REFINEMENT_16730',
  'EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16780',
  'EARTHLINE_LATE_GAP_REFINEMENT_16741',
  'unresolved16731',
  'selected16780',
  'supplementalCandidates16702'
]){
  const at=s.indexOf(term);
  console.log('M83FAST '+JSON.stringify({term,at,text:at<0?'':s.slice(Math.max(0,at-3500),Math.min(s.length,at+12000))}));
}
