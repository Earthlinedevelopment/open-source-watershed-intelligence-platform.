import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=[
  'function earthlineMappedWaterSwaleGate16609',
  'const verified16609=',
  'earthlineRerankRegionalSwales16539',
  'EARTHLINE_REGIONAL_VISUAL_DATA_16020',
  'setData(swales)',
  'setData(waterPaths)',
  'Property detail published',
  'runProperty',
  'same-query',
  'same query',
  'EARTHLINE_PROPERTY',
  'regionalBoundary16539',
  'state boundary',
  'containment'
];
for(const n of needles){
  let from=0,found=0;
  while(true){
    const i=s.indexOf(n,from); if(i<0)break;
    found++;
    const a=Math.max(0,i-1800),b=Math.min(s.length,i+3600);
    console.log(`\n===== ${n} #${found} @${i} =====\n${s.slice(a,b)}\n===== END =====`);
    from=i+n.length;
    if(found>=6)break;
  }
  if(!found)console.log(`\n===== ${n}: NOT FOUND =====`);
}
