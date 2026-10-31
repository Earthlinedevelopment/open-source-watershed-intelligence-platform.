import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['function earthlineCooperativeYield16661','earthlineCooperativeYield16661(','requestAnimationFrame(resolve)','await wait(0)','await wait(20)']){
 let from=0,n=0;
 while(true){
  const at=s.indexOf(term,from);if(at<0)break;
  console.log('M83YIELD '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-900),Math.min(s.length,at+1800))}));
  from=at+term.length;if(++n>=40)break;
 }
}
