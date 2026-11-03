#!/usr/bin/env node
// Mantra 99: fail-closed, read-only static regression gate for recovery candidates.
// This intentionally does NOT claim browser, map-science, or production acceptance.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const html = read('index.html');
const elderPath = 'earthline-elder-restored-17097.js';
const elder = exists(elderPath) ? read(elderPath) : '';
const manifestPath = 'data/elder-trees/v2/manifest.json';
let manifest = null;
try { if (exists(manifestPath)) manifest = JSON.parse(read(manifestPath)); } catch (_) {}
// Prove that the massive production science/UI file differs by only the single
// approved Elder script tag; the remaining bytes must retain the exact prior Git blob.
const gitBlobSha = value => {
  const bytes = Buffer.from(value, 'utf8');
  return crypto.createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\\0')).update(bytes).digest('hex');
};
const elderTag = '\\n<script src="earthline-elder-restored-17097.js?v=mantra99-recovery"></script>';
const unmodifiedBaselineSha = '1c217d9486f0e234c08e1b6890e28d1db7dc03cf';
const wiredScripts = (html.match(/<script\b[^>]*\bsrc=["']earthline-elder-restored-17097\.js(?:\?[^"']*)?["'][^>]*><\/script>/g) || []).length;
const checks = [
  ['Approved tagline exists', html.includes('Slow it. Sink it. Spread it.')],
  ['Property safe-swale authority exists', html.includes('authoritativeSafeSwales15815')],
  ['Exclusion verification blocks output', html.includes('EXCLUSIONS UNVERIFIED')],
  ['Production engine and approved UI byte-for-byte preserved', gitBlobSha(html.replace(elderTag, '')) === unmodifiedBaselineSha],
  ['Approved Elder implementation wired once', wiredScripts === 1],
  ['Elder implementation file present', exists(elderPath) && elder.includes('EARTHLINE_ELDER_TREES_V1_17097')],
  ['Elder evidence starts from terminal analysis event', elder.includes("document.addEventListener('earthline:analysis-complete'")],
  ['No prepublication Elder pointerdown trigger', !/document\.addEventListener\(\s*['"]pointerdown['"]/.test(elder)],
  ['Elder data manifest valid', !!manifest && Array.isArray(manifest.datasets) && manifest.datasets.length > 0],
  ['Elder dataset files present', !!manifest && manifest.datasets.every(d => typeof d.path === 'string' && exists(d.path))],
  ['Elder evidence worker and detector present', exists('earthline-elder-worker-17129.js') && exists('tools/elder_trees/chmv2_array_detector_17129.py')],
  ['No retired Explore Water label', !/>\s*Explore Water\s*</i.test(html)],
  ['No retired Water story label', !/>\s*Water story\s*</i.test(html)],
  ['No retired Visual Scientific label', !/>\s*Visual Scientific\s*</i.test(html)]
];
console.log('index.html SHA256: ' + crypto.createHash('sha256').update(html).digest('hex'));
console.log('Elder asset references: ' + wiredScripts + '; manifest datasets: ' + (manifest?.datasets?.length ?? 0));
for (const [label, pass] of checks) console.log((pass ? 'PASS' : 'FAIL') + ' ' + label);
const failures = checks.filter(c => !c[1]);
console.log('Source gate: ' + (failures.length ? 'FAILED' : 'PASSED') + ' (' + failures.length + ' failing checks)');
if (failures.length) process.exitCode = 1;
console.log('NOTE: Static source checks are NOT browser, scientific, safety, performance, or production acceptance.');
