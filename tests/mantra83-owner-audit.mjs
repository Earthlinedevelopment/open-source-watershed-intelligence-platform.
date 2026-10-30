import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['function applyOwnership','earthlineApplyRendererOwnership15805','el-live-swale-line-15970','el-live-contour-line-15970']){
  let from=0,n=0;
  while(true){
    const at=s.indexOf(term,from);if(at<0)break;
    console.log('M83OWNER '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-2200),Math.min(s.length,at+6000))}));
    from=at+term.length;if(++n>=8)break;
  }
}
