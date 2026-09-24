import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src='tests/mantra46-16809-opportunity-gap-swap-ab.mjs';
let s=readFileSync(src,'utf8');
const out='artifacts/mantra46-16814-fine24-16809-gate';
mkdirSync(out,{recursive:true});

function replaceOne(oldv,newv,label){
  const n=s.split(oldv).length-1;
  if(n!==1)throw new Error(label+' replacement count='+n);
  s=s.replace(oldv,newv);
}

replaceOne("const OUT='artifacts/mantra46-16809-opportunity-gap-swap-ab';","const OUT='artifacts/mantra46-16814-fine24-16809-gate';",'out');

const variantAnchor="if(variant){\n   const capOld=";
if(s.split(variantAnchor).length-1!==1)throw new Error('variant anchor mismatch');
s=s.replace(variantAnchor,`if(variant){\n   const fineDemOld="loadDEM(tile16781.b,32,32,5500,'fine opportunity refinement '+tile16781.id)";\n   if(body.split(fineDemOld).length-1!==1)throw new Error('fine DEM owner mismatch');\n   body=body.replace(fineDemOld,"loadDEM(tile16781.b,24,24,4500,'fine opportunity refinement '+tile16781.id)");\n   const capOld=`);

replaceOne(
  "oppSwap=window.EARTHLINE_OPPORTUNITY_GAP_SWAP_16809||null;",
  "oppSwap=window.EARTHLINE_OPPORTUNITY_GAP_SWAP_16809||null,fine16814=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null;",
  'audit refs'
);
replaceOne(
  "coreMs:perf?.totalMs??null,",
  "coreMs:perf?.totalMs??null,fine16814:{elapsedMs:fine16814?.elapsedMs??0,selected:fine16814?.selected?.length??0,added:fine16814?.added??0,failed:fine16814?.failedTiles?.length??0,unresolved:fine16814?.unresolvedAfter?.length??0},",
  'audit return'
);
replaceOne(
  "for(const q of STATES){await runOne(q,false);await runOne(q,true)}",
  "for(const q of STATES){await runOne(q,true)}",
  'variant-only loop'
);

s += `\nconst targets16814={\n Arkansas:{largest:90,minCoverage:.6268,maxTarget:5000},\n Maryland:{largest:360,minCoverage:.2888},\n Texas:{largest:107,minCoverage:.5077},\n Florida:{largest:8,minCoverage:.8415},\n Colorado:{largest:7,minCoverage:.8312}\n};\nconst gate16814=rows.map(r=>{const t=targets16814[r.query],a=r.audit||{},largest=a.gapClusters?.[0]??Infinity;const pass=!!t&&!r.loadError&&!r.timedOut&&!r.pageErrors.length&&Number(a.coreMs)<=15000&&Number(a.generated)===Number(a.visible)&&Number(a.unsafe)===0&&Number(a.outside?.swales||0)===0&&largest<=t.largest&&Number(a.coverageRatio)>=t.minCoverage&&(t.maxTarget==null||Number(a.targetNearest)<=t.maxTarget);return {query:r.query,pass,coreMs:a.coreMs,fine:a.fine16814,largest,coverage:a.coverageRatio,targetNearest:a.targetNearest,generated:a.generated,visible:a.visible,unsafe:a.unsafe,outside:a.outside};});\nconsole.log('EARTHLINE_M46_16814_GATE '+JSON.stringify(gate16814));\nwriteFileSync('${out}/gate-summary.json',JSON.stringify(gate16814,null,2));\nif(gate16814.some(r=>!r.pass))process.exitCode=1;\n`;

const tmp='tests/.mantra46-16814-generated.mjs';
writeFileSync(tmp,s);
await import(new URL('./.mantra46-16814-generated.mjs?'+Date.now(), import.meta.url));
