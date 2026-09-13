import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const clip=(i,b=2600,a=6000)=>s.slice(Math.max(0,i-b),Math.min(s.length,i+a));
for(const needle of ['unsafeSegments','EARTHLINE 16584','earthlineRegionalSegmentValid16584','validityMask16584','flowAudit','segments:','rasterizedInvalidWaterCellCount']){
  console.log('\n### '+needle);
  let from=0,n=0,i;
  while((i=s.indexOf(needle,from))>=0&&n<12){n++;console.log('\n#'+n+' @'+i+'\n'+clip(i));from=i+needle.length;}
  if(!n)console.log('NOT FOUND');
}
