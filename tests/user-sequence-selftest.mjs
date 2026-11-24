// Self-test for the click-path audit. Runs the REAL audit script (not a copy) against a small stand-in page served from this machine.
// It proves the plumbing and the verdict logic: the map is found the way the live page exposes it (a top-level `let`, not a window property),
// a healthy page passes, and each of four page bugs (stale layer, lost search, computed-but-not-drawn, no map at all) makes the audit fail the right way.
// It does NOT prove anything about the live site or real terrain: the stand-in has no real services.  Needs Playwright (npm install --no-save playwright).
import http from 'node:http';
import {spawn} from 'node:child_process';
import {readFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.join(HERE,'..');
let passed=0,failed=0;
async function test(name,fn){try{await fn();passed++;console.log('PASS  '+name);}catch(e){failed++;console.log('FAIL  '+name+'\n      '+String(e&&e.message||e).split('\n').slice(0,6).join('\n      '));}}
const eq=(a,b,m)=>{if(a!==b)throw new Error((m||'')+' expected '+JSON.stringify(b)+', got '+JSON.stringify(a));};
const ok=(c,m)=>{if(!c)throw new Error(m||'assertion failed');};

import {pageHtml} from './lib/stand-in-page.mjs';
const server=http.createServer((req,res)=>{const seg=req.url.split('?')[0].split('/').filter(Boolean),[mapMode,runMode]=seg.length?seg[0].split('-'):['let','ok'];
  res.writeHead(200,{'content-type':'text/html'});res.end(pageHtml(mapMode||'let',runMode||'ok'));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const PORT=server.address().port;

function audit(page,env){return new Promise(resolve=>{const work=mkdtempSync(path.join(tmpdir(),'audit-'));
  /* asynchronous on purpose: this process also serves the stand-in page, so it must not block while the audit runs */
  const c=spawn(process.execPath,[path.join(ROOT,'tests/earthline-user-sequence-audit.mjs')],{cwd:work,
    env:Object.assign({},process.env,{EARTHLINE_URL:'http://127.0.0.1:'+PORT+'/'+page+'/',EARTHLINE_PACE:'0.02',EARTHLINE_SETTLE_MS:'100',EARTHLINE_MAP_WAIT_MS:'2500'},env||{})});
  let out='';c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>out+=d);
  const timer=setTimeout(()=>{c.kill('SIGKILL');},180000);
  c.on('close',code=>{clearTimeout(timer);resolve({work,code,out});});});}
const done=r=>{try{rmSync(r.work,{recursive:true,force:true});}catch(_){}};
const SEQ='-75.76995,42.78781;-75.77639,42.78824;-75.76995,42.78781;-75.77639,42.78824;-75.76995,42.78781';

await test('preflight finds a map declared with a top-level let (the live page\'s way) and moves it',async()=>{
  const r=await audit('let-ok',{EARTHLINE_PREFLIGHT_ONLY:'1'});done(r);eq(r.code,0,r.out);
  const m=/EARTHLINE_PREFLIGHT (\{.*\})/.exec(r.out);ok(m,r.out);const j=JSON.parse(m[1]);ok(j.movedToCrosshair,'the map did not move to the crosshair: '+m[1]);eq(j.before.lat,40);});
await test('preflight also works when a page puts its map on window',async()=>{const r=await audit('window-ok',{EARTHLINE_PREFLIGHT_ONLY:'1'});done(r);eq(r.code,0,r.out);ok(/movedToCrosshair":true/.test(r.out),r.out);});
await test('a page with no map stops at once, goes red with exit 3 and says it is a test-infrastructure failure, not a science result',async()=>{
  const t0=Date.now();const r=await audit('none-ok',{EARTHLINE_ONLY:'S0'});done(r);eq(r.code,3,r.out);ok(/TEST INFRASTRUCTURE FAILURE/.test(r.out),r.out);ok(Date.now()-t0<60000,'it should stop at the first scenario, not wait through all of them');});
await test('five consecutive searches on a healthy page pass (A,B,A,B,A each at its own place, repeats identical)',async()=>{
  const r=await audit('let-ok',{EARTHLINE_ONLY:'S5',EARTHLINE_SEQUENCE:SEQ});eq(r.code,0,r.out+(function(){try{return readdirSync(r.work).join(',')}catch(_){return ''}})());done(r);ok(/PASS: swales drawn in every scenario/.test(r.out),r.out);});
await test('a stale layer (later search reuses the first search\'s swales) is caught',async()=>{
  const r=await audit('let-stale',{EARTHLINE_ONLY:'S5',EARTHLINE_SEQUENCE:SEQ});done(r);eq(r.code,1,r.out);ok(/different places but published identical swales/.test(r.out),r.out);});
await test('a lost search (the second search never finishes) is caught',async()=>{
  const r=await audit('let-drop',{EARTHLINE_ONLY:'S5',EARTHLINE_SEQUENCE:SEQ});done(r);eq(r.code,1,r.out);ok(/never finished/.test(r.out),r.out);});
await test('swales computed but not drawn are caught',async()=>{
  const r=await audit('let-undrawn',{EARTHLINE_ONLY:'S5',EARTHLINE_SEQUENCE:SEQ});done(r);eq(r.code,1,r.out);ok(/computed \d+ swales but drew none/.test(r.out),r.out);});
await test('the same place giving a different answer each time is caught (repeatability)',async()=>{
  const r=await audit('let-drift',{EARTHLINE_ONLY:'S5',EARTHLINE_SEQUENCE:SEQ});done(r);eq(r.code,1,r.out);ok(/same place but gave different results/.test(r.out),r.out);});
await test('swales published at the previous search\'s place are caught',async()=>{
  const r=await audit('let-wrongplace',{EARTHLINE_ONLY:'S5',EARTHLINE_SEQUENCE:SEQ});done(r);eq(r.code,1,r.out);ok(/from its own crosshair/.test(r.out),r.out);});
await test('a search that publishes nothing and gives no verified reason is caught',async()=>{
  const r=await audit('let-silent',{EARTHLINE_ONLY:'S5',EARTHLINE_SEQUENCE:SEQ});done(r);eq(r.code,1,r.out);ok(/no verified reason/.test(r.out),r.out);});
await test('the single-search control (S0) and the same-page repeat (S0b) pass on a healthy page',async()=>{
  const r=await audit('let-ok',{EARTHLINE_ONLY:'S0'});done(r);eq(r.code,0,r.out);ok(/SWALES DRAWN/.test(r.out),r.out);});

await test('no test script reads window.earthlineMap alone (the Nov 22 mistake): every use must also try the page\'s own name',()=>{
  const bad=[];
  for(const f of readdirSync(HERE).filter(n=>n.endsWith('.mjs')&&n!=='user-sequence-selftest.mjs')){
    const src=readFileSync(path.join(HERE,f),'utf8').split('\n');
    src.forEach((l,i)=>{if(/^\s*\/\//.test(l))return;if(/window\.earthlineMap/.test(l)&&!/typeof earthlineMap/.test(l))bad.push(f+':'+(i+1)+': '+l.trim().slice(0,100));});}
  const lib=readFileSync(path.join(HERE,'lib/page-access.mjs'),'utf8');ok(/typeof earthlineMap/.test(lib),'page-access.mjs must try the bare name');
  eq(bad.length,0,'window-only map access: '+bad.join(' | '));});

server.close();
console.log('\n'+passed+' passed, '+failed+' failed, '+(passed+failed)+' total');
process.exit(failed?1:0);
