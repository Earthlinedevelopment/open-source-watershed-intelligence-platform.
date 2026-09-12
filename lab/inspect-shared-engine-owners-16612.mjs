import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=[
  'function earthlineClipRegionalProducts16539',
  'earthlineClipRegionalProducts16539(',
  'swale-opportunity',
  "feature_type:'swale-opportunity'",
  'function runRegional',
  'regionalRecharge16492',
  'earthlineRenderRegionalOverlay16020',
  'EARTHLINE_REGIONAL_VISUAL_DATA_16020',
  'jurisdictionBoundaryPromise16539',
  'function earthlineMappedWaterSwaleGate16609'
];
for(const n of needles){
  let from=0,found=0;
  while(true){
    const i=s.indexOf(n,from); if(i<0)break;
    found++;
    const a=Math.max(0,i-5000),b=Math.min(s.length,i+9000);
    console.log(`\n===== ${n} #${found} @${i} =====\n${s.slice(a,b)}\n===== END =====`);
    from=i+n.length;
    if(found>=5)break;
  }
  if(!found)console.log(`\n===== ${n}: NOT FOUND =====`);
}
