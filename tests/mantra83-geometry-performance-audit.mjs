import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['function lineLengthPixels','const lineLengthPixels','lineLengthPixels=','function llGrid','function gridLL','function sampleSegment']){
 let from=0,n=0;
 while(true){
  const at=s.indexOf(term,from);if(at<0)break;
  console.log('M83GEOMPERF '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-1000),Math.min(s.length,at+4500))}));
  from=at+term.length;if(++n>=8)break;
 }
}
