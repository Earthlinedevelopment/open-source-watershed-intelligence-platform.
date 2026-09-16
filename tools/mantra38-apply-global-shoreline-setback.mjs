import fs from 'node:fs';
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const reps=[
  ["Shared global shoreline uncertainty: half of this run's local DEM-cell diagonal.","Shared global shoreline uncertainty: one full local DEM-cell diagonal."],
  ['return .5*Math.hypot(dx16584,dy16584);','return Math.hypot(dx16584,dy16584);'],
  ["shoreBufferRule:'half-local-DEM-cell-diagonal'","shoreBufferRule:'one-local-DEM-cell-diagonal'"]
];
for(const [a,b] of reps){const n=s.split(a).length-1;if(n!==1)throw new Error('expected one product anchor for '+a+'; found '+n);s=s.replace(a,b);}
fs.writeFileSync(path,s);
console.log('MANTRA38_GLOBAL_SHORELINE_PATCH '+JSON.stringify({patched:true,jurisdictionSpecific:false,owner:'earthlineFinalWaterClip16584',bufferRule:'one-local-DEM-cell-diagonal'}));
