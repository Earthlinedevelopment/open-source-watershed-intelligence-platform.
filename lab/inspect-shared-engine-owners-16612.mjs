import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const clip=(i,b=5000,a=12000)=>s.slice(Math.max(0,i-b),Math.min(s.length,i+a));
for(const needle of ['earthlineResolveJurisdictionBoundary16539','earthlineResolveAtomicUSStatePackage16556','State_County/MapServer/0/query','jurisdictionProfileId16556']){
  console.log('\n### '+needle);
  let from=0,n=0,i;
  while((i=s.indexOf(needle,from))>=0&&n<8){n++;console.log('\n#'+n+' @'+i+'\n'+clip(i));from=i+needle.length;}
  if(!n)console.log('NOT FOUND');
}
