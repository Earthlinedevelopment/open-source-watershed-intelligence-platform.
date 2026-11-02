import { writeFileSync, mkdirSync } from 'node:fs';
const html=await (await fetch('https://earthlinedevelopment.org/?m46_root_source='+Date.now(),{headers:{'cache-control':'no-cache'}})).text();
const needles=['opportunityNoCandidate','cellLineage','candidateNoSelected'];
const hits=needles.map(n=>({n,at:html.indexOf(n)}));
mkdirSync('artifacts/mantra46-root-source',{recursive:true});
let out='';
for(const h of hits){
  if(h.at<0)continue;
  const s=Math.max(0,h.at-12000),e=Math.min(html.length,h.at+18000);
  out+='\n===== '+h.n+' @ '+h.at+' =====\n'+html.slice(s,e)+'\n';
}
writeFileSync('artifacts/mantra46-root-source/root-audit-snippet.txt',out);
console.log('EARTHLINE_M46_ROOT_SOURCE '+JSON.stringify({hits,has16789:html.includes('EARTHLINE 16789 — SAME-PARENT COUNT-NEUTRAL FINAL SPREAD')}));
