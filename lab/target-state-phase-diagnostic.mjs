import fs from 'node:fs';

const s=fs.readFileSync('index.html','utf8');
const needles=[
  'EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040',
  'waterOwner',
  'native-mapbox',
  'svgWaterRendered',
  'waterPaths',
  'directionArrows',
  'EARTHLINE_REGIONAL_VISUAL_DATA_16020',
  'earthlineRenderRegionalOverlay16020',
  "feature_type:'water'",
  'feature_type:"water"',
  'feature_type===\'water\'',
  'flowFeatures',
  'flow.features',
  'water.features',
  'IDS.water',
  'IDS.flow',
  'guardedSetGeo',
  '.filter(pointAllowed)',
  '.filter(earthlineCellLandValid',
  'coordinates.filter('
];

const report=[];
for(const needle of needles){
  let from=0,count=0;
  while(count<10){
    const i=s.indexOf(needle,from);
    if(i<0)break;
    count++;
    const a=Math.max(0,i-3500),b=Math.min(s.length,i+7000);
    report.push({needle,occurrence:count,index:i,snippet:s.slice(a,b)});
    from=i+needle.length;
  }
  if(count===0)report.push({needle,occurrence:0,index:-1,snippet:'NOT FOUND'});
}

fs.mkdirSync('lab-results',{recursive:true});
fs.writeFileSync('lab-results/target-state-phase-diagnostic.json',JSON.stringify({generatedAt:new Date().toISOString(),report},null,2));
for(const r of report){
  console.log(`\n===== ${r.needle} #${r.occurrence} @${r.index} =====\n${r.snippet}\n===== END =====`);
}
