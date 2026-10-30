import {execFileSync} from 'node:child_process';
const commits=['b8f023db2ce334f2fe1dc094c08918805ad82c75','274a7b63a3d1381a7010aa4fbccd320e156b9314','b8b69f00d3e68e1b77fdee48d196fa58a622b809'];
for(const sha of commits){
  let s='';try{s=execFileSync('git',['show',sha+':index.html'],{encoding:'utf8',maxBuffer:50*1024*1024});}catch(e){console.log('M83ELDERDONORERR '+sha+' '+String(e.message));continue;}
  const low=s.toLowerCase();let from=0,n=0;
  while(true){
    const at=low.indexOf('elder',from);if(at<0)break;
    console.log('M83ELDERDONOR '+JSON.stringify({sha,at,text:s.slice(Math.max(0,at-2200),Math.min(s.length,at+7500))}));
    from=at+5;if(++n>=25)break;
  }
}
