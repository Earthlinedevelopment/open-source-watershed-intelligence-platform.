import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=[
  'EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040',
  'waterPaths',
  'directionArrows',
  'waterOwner',
  'native-mapbox',
  'svgWaterRendered',
  'earthlineRenderRegionalOverlay16020',
  'EARTHLINE_REGIONAL_VISUAL_DATA_16020',
  'feature_type===\'water\'',
  'feature_type==="water"',
  "feature_type:'water'",
  'water-path',
  'water path',
  'flowFeatures',
  'flow.features',
  'water.features'
];
for(const n of needles){
  let from=0,k=0;
  while(k<8){
    const i=s.indexOf(n,from); if(i<0)break; k++;
    const a=Math.max(0,i-5000),b=Math.min(s.length,i+10000);
    console.log(`\n===== ${n} #${k} @${i} =====\n${s.slice(a,b)}\n===== END =====`);
    from=i+n.length;
  }
  if(!k)console.log(`\n===== ${n}: NOT FOUND =====`);
}
