import {execFileSync} from 'node:child_process';
const s=execFileSync('git',['show','b8b69f00d3e68e1b77fdee48d196fa58a622b809:index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});
const re=/<script\b[^>]*>[\s\S]*?<\/script>/gi;let m,n=0;
while((m=re.exec(s))){
  const block=m[0],low=block.toLowerCase();
  if(!low.includes('elder'))continue;
  const opener=block.slice(0,block.indexOf('>')+1);
  console.log('M83ESCRIPT '+JSON.stringify({index:n++,at:m.index,bytes:block.length,opener,start:block.slice(0,1800)}));
}
