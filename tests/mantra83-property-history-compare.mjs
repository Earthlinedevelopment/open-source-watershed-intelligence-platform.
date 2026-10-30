import {execFileSync} from 'node:child_process';
for(const sha of ['b8f023db2ce334f2fe1dc094c08918805ad82c75','b8b69f00d3e68e1b77fdee48d196fa58a622b809']){
  const s=execFileSync('git',['show',sha+':index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});
  for(const term of ['function prescribeSwales15778','maxS=','earthlineFinalSafeSegments15771','earthlinePathPointUsable(gx,gy']){
    const at=s.indexOf(term);
    console.log('M83_PROP_HISTORY '+JSON.stringify({sha,term,at,text:at<0?'':s.slice(Math.max(0,at-1200),Math.min(s.length,at+6000))}));
  }
}
