import {execFileSync} from 'node:child_process';
for(const term of ['ELDER TREE CONFIDENCE','MODELED_ELDER_TREE_CANDIDATE','elder']){
  let out='';
  try{out=execFileSync('git',['log','--all','--date=iso-strict','--pretty=format:%H|%ad|%s','-S',term,'--','index.html'],{encoding:'utf8',maxBuffer:20*1024*1024});}catch(e){out=String(e.stdout||'');}
  console.log('M83ELDERHIST '+JSON.stringify({term,lines:out.split(/\r?\n/).filter(Boolean).slice(0,40)}));
}
