import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src='tests/mantra46-16809-opportunity-gap-swap-ab.mjs';
let s=readFileSync(src,'utf8');
const out='artifacts/mantra46-16817-terrain-race-16809-gate';
mkdirSync(out,{recursive:true});

function replaceOne(oldv,newv,label){
  const n=s.split(oldv).length-1;
  if(n!==1)throw new Error(label+' replacement count='+n);
  s=s.replace(oldv,newv);
}
replaceOne("const OUT='artifacts/mantra46-16809-opportunity-gap-swap-ab';","const OUT='artifacts/mantra46-16817-terrain-race-16809-gate';",'out');
const variantAnchor="if(variant){\n   const capOld=";
if(s.split(variantAnchor).length-1!==1)throw new Error('variant anchor mismatch');
s=s.replace(variantAnchor,`if(variant){\n   const raceOld="stagger=setTimeout(startAlternate,1200);";\n   if(body.split(raceOld).length-1!==1)throw new Error('terrain race owner mismatch');\n   body=body.replace(raceOld,"stagger=setTimeout(startAlternate,250);");\n   const capOld=`);
replaceOne(
  "for(const q of STATES){await runOne(q,false);await runOne(q,true)}",
  "for(const q of STATES){await runOne(q,true)}",
  'variant-only loop'
);
s += `\nconst targets16817={\n Arkansas:{largest:90,minCoverage:.6268,maxTarget:5000},\n Maryland:{largest:360,minCoverage:.2888},\n Texas:{largest:107,minCoverage:.5077},\n Florida:{largest:8,minCoverage:.8415},\n Colorado:{largest:7,minCoverage:.8312}\n};\nconst gate16817=rows.map(r=>{const t=targets16817[r.query],a=r.audit||{},largest=a.gapClusters?.[0]??Infinity;const pass=!!t&&!r.loadError&&!r.timedOut&&!r.pageErrors.length&&Number(a.coreMs)<=15000&&Number(a.generated)===Number(a.visible)&&Number(a.unsafe)===0&&Number(a.outside?.swales||0)===0&&largest<=t.largest&&Number(a.coverageRatio)>=t.minCoverage&&(t.maxTarget==null||Number(a.targetNearest)<=t.maxTarget);return {query:r.query,pass,coreMs:a.coreMs,largest,coverage:a.coverageRatio,targetNearest:a.targetNearest,generated:a.generated,visible:a.visible,unsafe:a.unsafe,outside:a.outside,capacity:a.capacity,swaps:a.oppSwap?.swaps??null};});\nconsole.log('EARTHLINE_M46_16817_GATE '+JSON.stringify(gate16817));\nwriteFileSync('${out}/gate-summary.json',JSON.stringify(gate16817,null,2));\nif(gate16817.some(r=>!r.pass))process.exitCode=1;\n`;
const tmp='tests/.mantra46-16817-generated.mjs';
writeFileSync(tmp,s);
await import(new URL('./.mantra46-16817-generated.mjs?'+Date.now(), import.meta.url));
