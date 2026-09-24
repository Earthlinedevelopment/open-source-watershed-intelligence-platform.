import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src='tests/mantra46-16809-opportunity-gap-swap-ab.mjs';
let s=readFileSync(src,'utf8');
const out='artifacts/mantra46-16813-refinement-timing';
mkdirSync(out,{recursive:true});

function replaceOne(oldv,newv,label){
  const n=s.split(oldv).length-1;
  if(n!==1)throw new Error(label+' replacement count='+n);
  s=s.replace(oldv,newv);
}

replaceOne("const STATES=['Arkansas','Maryland','Texas','Florida','Colorado'];","const STATES=['Texas','Texas','Texas','Texas','Texas'];",'states');
replaceOne("const OUT='artifacts/mantra46-16809-opportunity-gap-swap-ab';","const OUT='artifacts/mantra46-16813-refinement-timing';",'out');
replaceOne(
  "oppSwap=window.EARTHLINE_OPPORTUNITY_GAP_SWAP_16809||null;",
  "oppSwap=window.EARTHLINE_OPPORTUNITY_GAP_SWAP_16809||null,fine16813=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,gap16813=window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,late16813=window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null;",
  'audit refs'
);
replaceOne(
  "coreMs:perf?.totalMs??null,",
  "coreMs:perf?.totalMs??null,phaseTotalsMs:perf?.phaseTotalsMs||null,fine16813:{elapsedMs:fine16813?.elapsedMs??0,selected:fine16813?.selected?.length??0,added:fine16813?.added??0,failed:fine16813?.failedTiles?.length??0,unresolved:fine16813?.unresolvedAfter?.length??0},gap16813:{elapsedMs:gap16813?.elapsedMs??0,selected:gap16813?.selected?.length??0,added:gap16813?.added??0,failed:gap16813?.failedTiles16738?.length??gap16813?.failedTiles?.length??0,confirmedNull:gap16813?.confirmedNull16735?.length??0},late16813:{elapsedMs:late16813?.elapsedMs??0,selected:late16813?.selected?.length??0,added:late16813?.added??0,failed:late16813?.failedTiles?.length??0,unresolved:late16813?.unresolvedAfter?.length??0},",
  'audit return'
);

const loopRe=/for\s*\(const\s+q\s+of\s+STATES\)\s*\{\s*await\s+runOne\(q,false\);\s*await\s+runOne\(q,true\);\s*\}/;
if(!loopRe.test(s))throw new Error('variant loop not found');
s=s.replace(loopRe,"for(const q of STATES){await runOne(q,true);}");

s += `\nconst timingRows16813=rows.map((r,i)=>({repeat:i+1,query:r.query,variant:r.variant,coreMs:r.audit?.coreMs??null,phaseTotalsMs:r.audit?.phaseTotalsMs||null,fine:r.audit?.fine16813||null,gap:r.audit?.gap16813||null,late:r.audit?.late16813||null,largest:r.audit?.gapClusters?.[0]??null,coverage:r.audit?.coverageRatio??null,generated:r.audit?.generated??null,visible:r.audit?.visible??null,unsafe:r.audit?.unsafe??null,outside:r.audit?.outside??null}));\nconsole.log('EARTHLINE_M46_16813_TIMING '+JSON.stringify(timingRows16813));\nwriteFileSync('${out}/timing-summary.json',JSON.stringify(timingRows16813,null,2));\n`;

const tmp='/tmp/mantra46-16813-generated.mjs';
writeFileSync(tmp,s);
await import('file://'+tmp+'?v='+Date.now());
