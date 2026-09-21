import { writeFileSync, mkdirSync } from 'node:fs';
const html=await (await fetch('https://earthlinedevelopment.org/?m46_src='+Date.now(),{headers:{'cache-control':'no-cache'}})).text();
const needles=['gapsBefore16780','refinementTileBudget16782','EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781','makeSwales','minLinePx16632','opportunityCells'];
mkdirSync('artifacts/mantra46-ia-ar-source',{recursive:true});
let out='';
for(const n of needles){
  const at=html.indexOf(n);
  out+='\n===== '+n+' @ '+at+' =====\n';
  if(at>=0)out+=html.slice(Math.max(0,at-14000),Math.min(html.length,at+26000));
}
writeFileSync('artifacts/mantra46-ia-ar-source/snippets.txt',out);
console.log(JSON.stringify({len:html.length,hits:Object.fromEntries(needles.map(n=>[n,html.indexOf(n)]))}));
