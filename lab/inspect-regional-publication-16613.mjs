import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=[
 'async function runRegional',
 'EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584',
 'propertyResultLock15815',
 'EARTHLINE_PROPERTY_RUN_AUDIT_16173',
 'earthline-property-ready-16188',
 'analysisReady',
 'earthlineDeclareProperty16169',
 'earthlineSetPropertyTarget16201',
 'clearRegional',
 'clearProperty',
 'propertyActive',
 'runBusy',
 'cameraSettle16310',
 'earthlineMappedWaterSwaleGate16609'
];
for(const n of needles){
  let from=0,k=0;
  while(true){
    const i=s.indexOf(n,from); if(i<0)break; k++;
    const a=Math.max(0,i-4500),b=Math.min(s.length,i+9000);
    console.log(`\n### ${n} #${k} @${i}\n${s.slice(a,b)}\n### END ${n} #${k}`);
    from=i+n.length;
    if(k>=8)break;
  }
  if(!k)console.log(`\n### ${n}: NOT FOUND`);
}
