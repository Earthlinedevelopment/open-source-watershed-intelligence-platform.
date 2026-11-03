#!/usr/bin/env node
// Mantra 98: read-only source regression gate. Run: node tests/mantra98-source-gate.cjs
// No network, third-party dependencies, or changes to production state.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const checks = [
  ['Approved tagline exists', src.includes('Slow it. Sink it. Spread it.')],
  ['Property safe-swale authority exists', src.includes('authoritativeSafeSwales15815')],
  ['Exclusion verification blocks output', src.includes('EXCLUSIONS UNVERIFIED')],
  ['Elder layer implementation present (approved later feature)', /elder[\s_-]*(trees?|layer|source|marker|evidence)/i.test(src)],
  ['No retired Explore Water label', !/>\s*Explore Water\s*</i.test(src)],
  ['No retired Water story label', !/>\s*Water story\s*</i.test(src)],
  ['No retired Visual Scientific label', !/>\s*Visual Scientific\s*</i.test(src)]
];
const sha = crypto.createHash('sha256').update(src).digest('hex');
console.log('index.html SHA256: ' + sha);
for (const [label, pass] of checks) console.log((pass ? 'PASS' : 'FAIL') + ' ' + label);
const failures = checks.filter(c => !c[1]);
console.log('Source gate: ' + (failures.length ? 'FAILED' : 'PASSED') + ' (' + failures.length + ' failing checks)');
if (failures.length) process.exitCode = 1;
console.log('NOTE: Static source checks are NOT browser, science, safety, or production acceptance.');
