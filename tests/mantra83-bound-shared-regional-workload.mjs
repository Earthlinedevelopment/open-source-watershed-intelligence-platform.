import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html'; let s=readFileSync(p,'utf8');
const reps=[
  ["const start16839=performance.now(),N16839=24,groupSize16839=6,channel16839=percentile(hy.acc,.972),rows16839=[];","const start16839=performance.now(),N16839=24,groupSize16839=12,channel16839=percentile(hy.acc,.972),rows16839=[];"],
  ["if(chosenBins16730.length>=4)break;","if(chosenBins16730.length>=3)break;"],
  ["const refinementTileBudget16782=Math.min(16,Math.max(8,Math.ceil(gapsBefore16780.length/3)));","const refinementTileBudget16782=Math.min(8,Math.max(4,Math.ceil(gapsBefore16780.length/3)));"],
  ["const lateBins16741=unresolved16731.slice(0,4),lateStart16741=performance.now();","const lateBins16741=unresolved16731.slice(0,2),lateStart16741=performance.now();"]
];
for(const [a,b] of reps){
  if(s.includes(a))s=s.replace(a,b);
  else if(!s.includes(b))throw new Error('shared Regional workload owner not found: '+a);
}
writeFileSync(p,s);
console.log('M83_SHARED_REGIONAL_WORKLOAD_BOUNDED');
