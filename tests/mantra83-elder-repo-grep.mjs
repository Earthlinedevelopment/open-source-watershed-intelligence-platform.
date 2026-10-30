import {execFileSync} from 'node:child_process';
const sha='b8b69f00d3e68e1b77fdee48d196fa58a622b809';
let out='';
try{out=execFileSync('git',['grep','-n','EARTHLINE_ELDER_TREES_V1_17097',sha],{encoding:'utf8',maxBuffer:20*1024*1024});}catch(e){out=String(e.stdout||'');}
console.log('M83_ELDER_GREP '+JSON.stringify(out.split(/\r?\n/).filter(Boolean)));
let tree='';
try{tree=execFileSync('git',['ls-tree','-r','--name-only',sha],{encoding:'utf8'});}catch(e){}
console.log('M83_ELDER_FILES '+JSON.stringify(tree.split(/\r?\n/).filter(x=>/elder|tree/i.test(x)).slice(0,100)));
