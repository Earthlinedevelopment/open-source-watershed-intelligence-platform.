import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=[
  'function earthlineMappedWaterSwaleGate16609',
  'async function earthlineMappedWaterSwaleGate16609',
  'EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609',
  'querySourceFeatures',
  "sourceLayer:'waterway'",
  'sourceLayer:"waterway"',
  'waterwayLines',
  'waterPolygonParts',
  'sourceQueries',
  'rawWaterFeatures',
  'earthlineClipRegionalProducts16539',
  'earthlineRegionalSegmentValid16584'
];
for(const n of needles){
  let from=0,k=0;
  while(true){
    const i=s.indexOf(n,from); if(i<0)break; k++;
    const a=Math.max(0,i-9000),b=Math.min(s.length,i+18000);
    console.log(`\n### ${n} #${k} @${i}\n${s.slice(a,b)}\n### END ${n} #${k}`);
    from=i+n.length;
    if(k>=8)break;
  }
  if(!k)console.log(`\n### ${n}: NOT FOUND`);
}
