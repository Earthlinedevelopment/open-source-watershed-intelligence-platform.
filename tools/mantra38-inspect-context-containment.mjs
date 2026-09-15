import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
for(const term of ['async function loadWatersheds','async function loadUSGSKarstAquifers','loadWatersheds(b','loadUSGSKarstAquifers(b','jurisdictionBoundaryPromise16539','earthlineClipRegionalProducts16539']){
  let from=0,n=0;
  while(true){const i=s.indexOf(term,from);if(i<0)break;n++;console.log(`\n===== ${term} #${n} @ ${i} =====\n`+s.slice(Math.max(0,i-1800),Math.min(s.length,i+4200)));from=i+term.length;}
  if(!n)console.log(`\n===== ${term}: NOT FOUND =====`);
}
