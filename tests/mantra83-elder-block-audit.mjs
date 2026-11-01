import {execFileSync} from 'node:child_process';
const sha='274a7b63a3d1381a7010aa4fbccd320e156b9314';
const html=execFileSync('git',['show',sha+':index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});
const term='EARTHLINE_ELDER_TREES_V1_17097';
let from=0,n=0;
while(true){
 const at=html.indexOf(term,from);if(at<0)break;
 console.log('M83ELDERFULL '+JSON.stringify({n,at,text:html.slice(Math.max(0,at-7000),Math.min(html.length,at+12000))}));
 from=at+term.length;if(++n>=20)break;
}
