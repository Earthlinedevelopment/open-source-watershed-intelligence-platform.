import {execFileSync} from 'node:child_process';
const commits=[
'06cb7179ccf7661dc76d11df44eacecb696dd147',
'e9b8ea4384ae2249f1e340004a026e59a390d581',
'11ed41266147aa6ad5bb0cf9455522d9a96fd784',
'759045a74bdefe2339e396fede06933ce25af5b1',
'274a7b63a3d1381a7010aa4fbccd320e156b9314',
'b8b69f00d3e68e1b77fdee48d196fa58a622b809'
];
for(const sha of commits){
  let diff='';
  try{diff=execFileSync('git',['show','--format=','--unified=30',sha,'--','index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});}catch(e){console.log('M83ELDERDIFFERR '+sha+' '+e.message);continue;}
  const hunks=diff.split(/(?=^@@)/m).filter(h=>/elder/i.test(h));
  console.log('M83ELDERDIFF '+JSON.stringify({sha,hunks:hunks.slice(0,12)}));
}
