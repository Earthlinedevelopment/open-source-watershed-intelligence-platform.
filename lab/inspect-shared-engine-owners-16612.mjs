import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const clip=(i,b=1800,a=4200)=>s.slice(Math.max(0,i-b),Math.min(s.length,i+a));
for(const needle of ['function makeSwales(','regionalRecharge16492','validityMask16584','EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609','earthlineMappedWaterSwaleGate16609','rechZones','recharge:regionalRecharge16492']){
  console.log('\n### '+needle);
  let from=0,n=0,i;
  while((i=s.indexOf(needle,from))>=0&&n<8){n++;console.log('\n#'+n+' @'+i+'\n'+clip(i));from=i+needle.length;}
  if(!n)console.log('NOT FOUND');
}
