// Stability baseline for the October production lineage.
// This file intentionally tests structure only; terrain acceptance requires browser runs.
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sha256=createHash('sha256').update(html).digest('hex');

test('baseline is a nonempty standalone HTML document',()=>{
  assert.ok(html.length>100_000, 'unexpectedly small index.html');
  assert.match(html,/<html\b/i);
  assert.match(html,/<\/html>/i);
});

test('every executable inline classic script parses',()=>{
  const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  let checked=0;
  for(const [,attrs,body] of scripts){
    if(/\bsrc\s*=/.test(attrs)||/\btype\s*=\s*['"](?:application\/json|importmap|module)/i.test(attrs)||!body.trim())continue;
    assert.doesNotThrow(()=>new vm.Script(body), 'invalid inline script '+(checked+1));
    checked++;
  }
  assert.ok(checked>0,'no inline executable scripts found');
});

test('critical existing application entry points remain present',()=>{
  for(const name of ['earthlineSwaleFromPts','earthlineDeclarePropertyAtCrosshair16169','earthlineSetPropertyTarget16201']){
    assert.ok(html.includes(name),'missing existing entry point: '+name);
  }
});

console.log('EARTHLINE_STAGING_SHA256 '+sha256);
console.log('Structural checks do NOT prove slope, exclusions, aquifers, or safe publication.');
