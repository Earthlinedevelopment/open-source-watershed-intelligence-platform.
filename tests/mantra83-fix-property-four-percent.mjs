import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');
const reps=[
  ['const thr=streamThreshold(),chanThr=thr*3.2,maxS=33;','const thr=streamThreshold(),chanThr=thr*3.2,maxS=4;'],
  ['return earthlinePathPointUsable(gx,gy,33)?q:p;','return earthlinePathPointUsable(gx,gy,4)?q:p;'],
  ['function earthlineFinalSafeSegments15771(pts,maxS=33){','function earthlineFinalSafeSegments15771(pts,maxS=4){'],
  ['earthlineSplitUsableSegments(s.pts,33)','earthlineSplitUsableSegments(s.pts,4)'],
  ['earthlineFinalSafeSegments15771(displaySeg,33)','earthlineFinalSafeSegments15771(displaySeg,4)']
];
for(const [old,neu] of reps){
  if(s.includes(old))s=s.replaceAll(old,neu);
  else if(!s.includes(neu))throw new Error('Property slope owner missing: '+old);
}
writeFileSync(p,s);
console.log('M83_PROPERTY_FOUR_PERCENT_APPLIED');
