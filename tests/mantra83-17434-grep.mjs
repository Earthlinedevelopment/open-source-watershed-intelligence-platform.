import {execFileSync} from 'node:child_process';
const sha='b8b69f00d3e68e1b77fdee48d196fa58a622b809';
let out='';
try{out=execFileSync('git',['grep','-n','17434',sha],{encoding:'utf8',maxBuffer:20*1024*1024});}catch(e){out=String(e.stdout||'');}
console.log('M83_17434_GREP '+JSON.stringify(out.split(/\r?\n/).filter(Boolean)));
