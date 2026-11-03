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
const checks=[];
function check(name,fn){try{fn();checks.push({name,status:'PASS'});}catch(e){checks.push({name,status:'FAIL',message:String(e.message||e)});}}
check('accepted 16584 public homepage unchanged',()=>assert.equal(repoBlob,'1c217d9486f0e234c08e1b6890e28d1db7dc03cf'));
check('homepage nonempty',()=>assert.ok(html.length>500000,'unexpectedly small index.html'));
check('approved tagline preserved',()=>assert.ok(html.toString('utf8').includes('Slow it. Sink it. Spread it.'),'exact approved tagline absent'));
check('auxiliary JavaScript syntax',()=>{new vm.Script(js,{filename:'earthline-launch-16872.js'});});
check('approved blue safe-line layer references',()=>{for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'])assert.ok(js.includes(id),'missing '+id);});
check('rejected natural renderer not made visible by M95 recovery',()=>{
 const start=js.indexOf('/* EARTHLINE M95 — RESTORE');
 assert.ok(start>=0,'candidate patch absent');
 const section=js.slice(start);
 assert.ok(section.includes("setLayoutProperty(id,'visibility','none')"));
 assert.ok(section.includes("setLayoutProperty(id,'visibility','visible')"));
 assert.ok(!section.includes('authoritativeSafeSwales15815='),'candidate presentation mutates science');
});
check('approved Elder refresh is independent and optional',()=>assert.ok(js.includes('EARTHLINE_ELDER_TREES_V1_17097?.refresh?.()')));
check('no new remote scripts in recovery patch',()=>{
 const section=js.slice(js.indexOf('/* EARTHLINE M95 — RESTORE'));
 assert.ok(!/createElement\(['"]script/.test(section));
});
const status=checks.every(x=>x.status==='PASS')?'PASS':'FAIL';
console.log(JSON.stringify({contract:'M95 source-integrity / renderer-isolation',status,checks,baselineBlob:repoBlob,jsSHA256:crypto.createHash('sha256').update(js).digest('hex'),note:'does NOT verify runtime, swale geometry, Elder availability, map coverage, speed or international accuracy'},null,2));
if(status!=='PASS')process.exitCode=1;
