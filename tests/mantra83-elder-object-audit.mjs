import {execFileSync} from 'node:child_process';
const sha='b8b69f00d3e68e1b77fdee48d196fa58a622b809';
const s=execFileSync('git',['show',sha+':index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});
for(const term of ['window.EARTHLINE_ELDER_TREES_V1_17097','EARTHLINE_ELDER_TREES_V1_17097=','startProperty','MODELED_ELDER','elderCandidates']){
  let from=0,n=0;
  while(true){const at=s.indexOf(term,from);if(at<0)break;
    console.log('M83ELDEROBJ '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-3000),Math.min(s.length,at+12000))}));
    from=at+term.length;if(++n>=12)break;
  }
}
