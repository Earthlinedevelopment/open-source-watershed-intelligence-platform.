const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');

function one(re, label) {
  const n = (s.match(re) || []).length;
  if (n !== 1) throw new Error(`${label}: expected 1 owner, found ${n}`);
}

one(/function earthlineRegionalSegmentValid16584\(/g, 'Regional validity');
one(/function makeFlows\(hy\)\{/g, 'makeFlows');
one(/async function makeContours\(hy\)\{/g, 'makeContours');
one(/function earthlinePointInJurisdiction16539\(/g, 'jurisdiction');
one(/async function earthlineMappedWaterSwaleGate16609\(/g, 'mapped-water gate');

if (!s.includes('EARTHLINE 16633 — EXACT PREFIX-PRUNED SAMPLE WALK.')) throw new Error('16633 marker missing');
if (!s.includes('EARTHLINE 16634 — EXACT REGIONAL HOT-PATH OPTIMIZATION.')) throw new Error('16634 marker missing');

let count = 0;
for (const [i, m] of [...s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries()) {
  const src = m[1];
  if (!src.trim()) continue;
  new Function(src);
  count++;
}
console.log(`verified ${count} script blocks; Earthline owners remain singular`);
