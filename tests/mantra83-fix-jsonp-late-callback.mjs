import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');
const old='function cleanup(){try{script.remove()}catch(_){}try{delete window[cb]}catch(_){window[cb]=undefined}}';
const neu='function cleanup(){try{script.remove()}catch(_){}try{window[cb]=()=>{};setTimeout(()=>{try{delete window[cb]}catch(_){window[cb]=undefined}},30000)}catch(_){}}';
if(s.includes(old))s=s.replace(old,neu);
else if(!s.includes(neu))throw new Error('JSONP cleanup owner not found');
writeFileSync(p,s);
console.log('M83_JSONP_LATE_CALLBACK_GUARD_APPLIED');
