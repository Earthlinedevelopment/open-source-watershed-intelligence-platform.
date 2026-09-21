import { writeFileSync, mkdirSync } from 'node:fs';
const html=await (await fetch('https://earthlinedevelopment.org/?m46_atomic_src='+Date.now(),{headers:{'cache-control':'no-cache'}})).text();
const needles=['EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556','atomicStatePackage16556','identity:{','EARTHLINE_DISPLAYED_RUN_16151'];
mkdirSync('artifacts/mantra46-atomic-source',{recursive:true});
let out='';
for(const n of needles){let at=0,count=0;while((at=html.indexOf(n,at))>=0&&count<8){out+='\n===== '+n+' @ '+at+' =====\n'+html.slice(Math.max(0,at-12000),Math.min(html.length,at+22000));at+=n.length;count++;}}
writeFileSync('artifacts/mantra46-atomic-source/snippets.txt',out);
console.log(JSON.stringify({len:html.length,hits:Object.fromEntries(needles.map(n=>[n,html.indexOf(n)]))}));
