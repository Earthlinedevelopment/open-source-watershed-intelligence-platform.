import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['deviceMemory','hardwareConcurrency','innerWidth','maxTouchPoints','mobile','regionalStarted16198','chooseTileZoom','loadDEM']){
 let from=0,n=0;
 while(true){
  const at=s.indexOf(term,from); if(at<0)break;
  console.log('M83MOBILEAUDIT '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-1600),Math.min(s.length,at+3800))}));
  from=at+term.length;if(++n>=10)break;
 }
}
