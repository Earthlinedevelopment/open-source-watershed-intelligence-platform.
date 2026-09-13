import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=[
  'earthlineResolveAtomicUSStatePackage16556',
  'jurisdictionProfileId16556',
  'earthlineMappedWaterSwaleGate16609',
  'usStateWaterRun16609',
  'useTiger16617',
  'TIGERweb/Hydro',
  'EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609',
  'EARTHLINE_REGIONAL_WATER_OWNERSHIP_AUDIT_16350',
  'earthlineRegionalSegmentValid16584',
  'makeFlows(hy)'
];
const clip=(i,b=2200,a=5200)=>s.slice(Math.max(0,i-b),Math.min(s.length,i+a));
for(const needle of needles){
  console.log('\n### '+needle);
  let from=0,n=0,i;
  while((i=s.indexOf(needle,from))>=0&&n<6){
    n++;
    console.log('\n#'+n+' @'+i+'\n'+clip(i));
    from=i+needle.length;
  }
  if(!n)console.log('NOT FOUND');
}
