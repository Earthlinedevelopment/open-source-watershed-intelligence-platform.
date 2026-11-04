#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const undo=[
["const show=false;/* MANTRA 100: permanently retire rejected natural/textured Property worm display. Authoritative safe-line geometry and safety gate remain unchanged. */","const show=centers.length>0&&footprints.length===centers.length&&directional.length+neutral.length===centers.length;"],
["}else{try{window.earthlineSetNaturalSwalePlantingVisible15806?.(false)}catch(_){}/* MANTRA 100: retire planting/worm presentation; keep the verified authoritative safe-line fallback. */","}else{/* If the natural renderer is unavailable, restore the verified authoritative safe-line fallback so Property output never disappears. */"],
["if(overlay)overlay.style.display='none';const w=applyWidth()","if(overlay)overlay.style.display=show?'none':'';const w=applyWidth()"],
["let plantingVisible=false; /* MANTRA 100: retired worm-like planting layer cannot initialize visible. */\n\n  const emptyFC=","let plantingVisible=true;\n\n  const emptyFC="],
["function setPlantingVisible15806(on){\n    plantingVisible=false; /* MANTRA 100: irreversible rejection of natural/worm planting presentation; not Elder Trees. */","function setPlantingVisible15806(on){\n    plantingVisible=!!on;"]
];
let parent=html;
for(const [replacement,orig] of undo){
  assert.equal(parent.split(replacement).length-1,1,'M100 patch anchor missing or duplicated');
  parent=parent.replace(replacement,orig);
}
const gitHash=s=>{const bytes=Buffer.from(s,'utf8');return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\\0','utf8')).update(bytes).digest('hex')};
assert.equal(gitHash(parent),'1c217d9486f0e234c08e1b6890e28d1db7dc03cf','Science/UI must match frozen production baseline after undoing worm-only edits');
assert.match(html,/const show=false;\/\* MANTRA 100/);
assert.match(html,/function setPlantingVisible15806\(on\)\{\s*plantingVisible=false/);
assert.match(html,/window\.earthlineSetNaturalSwalePlantingVisible15806\?\.\(false\)/);
assert.match(html,/earthline-property-safe-water-16221/);
assert.match(html,/function authoritativeSafePropertyFC16221\(/);
assert.match(html,/function syncSafePropertyFallback16221\(/);
let n=0;
const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
for(const match of html.matchAll(re)){
 const attr=match[1]||'',body=match[2]||'';
 if(/\bsrc\s*=/.test(attr)||/\btype\s*=\s*['"](?:application\/json|application\/ld\+json)/i.test(attr)||!body.trim())continue;
 new vm.Script(body,{filename:'index.html inline script '+(++n)});
}
assert.ok(n>=40,'Unexpectedly few JavaScript blocks parsed');
console.log('PASS Mantra 100: exact parent retained except five worm-retirement edits; '+n+' inline JavaScript blocks parse.');
console.log('candidate index sha256 '+crypto.createHash('sha256').update(html).digest('hex'));
console.log('NOTE: This is source/syntax acceptance ONLY, NOT a real-browser or live visual result.');
