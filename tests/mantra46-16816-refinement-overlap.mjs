import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src='tests/mantra46-16809-opportunity-gap-swap-ab.mjs';
let s=readFileSync(src,'utf8');
const out='artifacts/mantra46-16816-refinement-overlap';
mkdirSync(out,{recursive:true});

function replaceOne(oldv,newv,label){
  const n=s.split(oldv).length-1;
  if(n!==1)throw new Error(label+' replacement count='+n);
  s=s.replace(oldv,newv);
}

replaceOne("const OUT='artifacts/mantra46-16809-opportunity-gap-swap-ab';","const OUT='artifacts/mantra46-16816-refinement-overlap';",'out');
replaceOne(
  "oppSwap=window.EARTHLINE_OPPORTUNITY_GAP_SWAP_16809||null;",
  "oppSwap=window.EARTHLINE_OPPORTUNITY_GAP_SWAP_16809||null,fine16816=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,gap16816=window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null;",
  'audit refs'
);
replaceOne(
  "coreMs:perf?.totalMs??null,",
  "coreMs:perf?.totalMs??null,refinement16816:{fine:{elapsedMs:fine16816?.elapsedMs??0,selected:fine16816?.selected||[],unresolved:fine16816?.unresolvedAfter||[],added:fine16816?.added??0,failed:fine16816?.failedTiles||[]},gap:{elapsedMs:gap16816?.elapsedMs??0,selected:gap16816?.selected||[],highResCounts:gap16816?.highResCounts16735||[],confirmedNull:gap16816?.confirmedNull16735||[],added:gap16816?.added??0,failed:gap16816?.failedTiles16738||[]}},",
  'audit return'
);
replaceOne(
  "for(const q of STATES){await runOne(q,false);await runOne(q,true)}",
  "for(const q of ['Texas']){await runOne(q,true)}",
  'texas-only loop'
);

s += `\nconst r16816=rows[0]||null;\nif(r16816?.audit?.refinement16816){\n const f=r16816.audit.refinement16816.fine,g=r16816.audit.refinement16816.gap;\n const fineParents=new Map();\n for(const x of f.selected||[]){const k=Math.floor(Number(x.bx)/2)+','+Math.floor(Number(x.by)/2);fineParents.set(k,(fineParents.get(k)||0)+1)}\n const unresolvedParents=new Map();\n for(const x of f.unresolved||[]){const k=Math.floor(Number(x.bx)/2)+','+Math.floor(Number(x.by)/2);unresolvedParents.set(k,(unresolvedParents.get(k)||0)+1)}\n const rows16816=(g.selected||[]).map(x=>{const k=String(x.bx)+','+String(x.by);return {gap:k,fineSelectedChildren:fineParents.get(k)||0,fineUnresolvedChildren:unresolvedParents.get(k)||0,highRes:(g.highResCounts||[]).find(h=>String(h.bx)+','+String(h.by)===k)||null}});\n const summary={coreMs:r16816.audit.coreMs,fineMs:f.elapsedMs,gapMs:g.elapsedMs,fineAdded:f.added,gapAdded:g.added,confirmedNull:g.confirmedNull,rows:rows16816};\n console.log('EARTHLINE_M46_16816_OVERLAP '+JSON.stringify(summary));\n writeFileSync('${out}/overlap-summary.json',JSON.stringify(summary,null,2));\n}\n`;

const tmp='tests/.mantra46-16816-generated.mjs';
writeFileSync(tmp,s);
await import(new URL('./.mantra46-16816-generated.mjs?'+Date.now(), import.meta.url));
