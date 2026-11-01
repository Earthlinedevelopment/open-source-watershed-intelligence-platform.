import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');
const old="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}";
const neu="async function earthlineCooperativeYield16661(){return new Promise(resolve=>{const ch=new MessageChannel();ch.port1.onmessage=()=>{try{ch.port1.close();ch.port2.close()}catch(_){}resolve()};ch.port2.postMessage(0)});}";
if(s.includes(old))s=s.replace(old,neu);
else if(!s.includes(neu))throw new Error('cooperative yield owner not found');
writeFileSync(p,s);
console.log('M83_SHARED_YIELD_FIXED');
