import {execFileSync} from 'node:child_process';
function show(ref){return execFileSync('git',['show',ref+':index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});}
function srcs(s){return [...s.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);}
const old=srcs(show('274a7b63a3d1381a7010aa4fbccd320e156b9314'));
const cur=srcs(show('HEAD'));
console.log('M83_SCRIPT_SRCS '+JSON.stringify({old,cur,removed:old.filter(x=>!cur.includes(x)),added:cur.filter(x=>!old.includes(x))}));
