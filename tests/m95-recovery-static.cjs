#!/usr/bin/env node
// M95 recovery candidate: source-integrity and renderer isolation gate.
// This is NOT a substitute for connected scientific or geography tests.
const fs=require('node:fs');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const html=fs.readFileSync('index.html');
const js=fs.readFileSync('earthline-launch-16872.js','utf8');
const repoBlob=execFileSync('git',['hash-object','index.html'],{encoding:'utf8'}).trim();
const marker=Buffer.from('<!-- EARTHLINE M95: restore approved Property safe-line presentation only.');
const idx=html.indexOf(marker);
const original=idx>=0?html.subarray(0,idx-1):Buffer.alloc(0);
const originalBlob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+original.length+'\\0'),original])).digest('hex');
const checks=[];
function check(name,fn){try{fn();checks.push({name,status:'PASS'});}catch(e){checks.push({name,status:'FAIL',message:String(e.message||e)});}}
check('accepted 16584 preserved as exact prefix',()=>assert.equal(originalBlob,'1c217d9486f0e234c08e1b6890e28d1db7dc03cf'));
check('homepage nonempty',()=>assert.ok(html.length>500000,'unexpectedly small index.html'));
check('approved tagline preserved',()=>assert.ok(html.toString('utf8').includes('Slow it. Sink it. Spread it.'),'exact approved tagline absent'));
check('auxiliary JavaScript syntax',()=>{new vm.Script(js,{filename:'earthline-launch-16872.js'});});
check('approved blue safe-line layer references',()=>{for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'])assert.ok(html.includes(id),'missing '+id);});
check('M95 candidate script preserves geometry and switches layer visibility',()=>{
 const m=html.toString('utf8').match(/<script id="earthline-m95-approved-blue-property-only">([\\s\\S]*?)<\\/script>/);
 assert.ok(m,'M95 script absent');
 new vm.Script(m[1],{filename:'m95-property-renderer.js'});
 assert.ok(m[1].includes("setLayoutProperty(id,'visibility','none')"));
 assert.ok(m[1].includes("setLayoutProperty(id,'visibility','visible')"));
 assert.ok(m[1].includes("setPaintProperty(id,'line-opacity',.98)"));
 assert.ok(!m[1].includes('authoritativeSafeSwales15815'),'presentation mutates scientific swale source');
});
check('dormant auxiliary JS unchanged from protected source',()=>assert.equal(crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+Buffer.byteLength(js)+'\\0'),Buffer.from(js)])).digest('hex'),'6dccecdf8a2ce1ae4cb1ef4b06c03491ba90a3a3'));
check('no new remote scripts in recovery patch',()=>{
 const section=html.toString('utf8').slice(idx);
 assert.ok(!/createElement\(['"]script/.test(section));
});
const status=checks.every(x=>x.status==='PASS')?'PASS':'FAIL';
console.log(JSON.stringify({contract:'M95 source-integrity / renderer-isolation',status,checks,baselineBlob:repoBlob,jsSHA256:crypto.createHash('sha256').update(js).digest('hex'),note:'does NOT verify runtime, swale geometry, Elder availability, map coverage, speed or international accuracy'},null,2));
if(status!=='PASS')process.exitCode=1;
