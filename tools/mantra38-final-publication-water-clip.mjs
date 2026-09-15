import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=[
  'earthlineRegionalVectorOverlay16020',
  'renderRegionalOverlay',
  'earthlineRenderRegional',
  'EARTHLINE_REGIONAL_VISUAL_DATA_16020',
  'earthline-modeled-flow-paths',
  'IDS.flows',
  "feature_type==='flow'",
  'feature_type:"flow"',
  'flow-arrow',
  'waterPaths',
  'stroke=',
  'stroke:',
  'createElementNS',
  'svg'
];
for(const needle of needles){
  let pos=0,count=0;
  while((pos=s.indexOf(needle,pos))!==-1){
    count++;
    const a=Math.max(0,pos-1200),b=Math.min(s.length,pos+2200);
    console.log('\n=== '+needle+' #'+count+' @ '+pos+' ===\n'+s.slice(a,b));
    pos+=needle.length;
    if(count>=8)break;
  }
  console.log('COUNT '+needle+' '+count);
}
throw new Error('diagnostic only: rendered Regional water-path owners inventoried; index.html unchanged');
