import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=[
 'async function analyzeTile',
 'function analyzeTile',
 'async function applyLocation',
 'function applyLocation',
 'async function runRegional15780',
 'M.analysisReady',
 'propertyResultLock15815',
 'authoritativePropertySwales15800',
 'authoritativeSafeSwales15815',
 'propertyPublication15816',
 'propertyMode',
 'regionalMode',
 'earthline-property-ready-16188',
 'earthlinePropertyRunState',
 'EARTHLINE_PROPERTY_RUN_AUDIT_16173',
 'EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584',
 'earthlineIsStale'
];
for(const n of needles){
  let from=0,k=0;
  while(true){
    const i=s.indexOf(n,from); if(i<0)break; k++;
    const a=Math.max(0,i-6000),b=Math.min(s.length,i+12000);
    console.log(`\n### ${n} #${k} @${i}\n${s.slice(a,b)}\n### END ${n} #${k}`);
    from=i+n.length;
    if(k>=10)break;
  }
  if(!k)console.log(`\n### ${n}: NOT FOUND`);
}
