import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['function screenJurisdictionCandidate16539','const screenJurisdictionCandidate16539','function pointInGeometry','function pointInPolygon','lineWithinJurisdiction16539','earthlineClipLineToJurisdiction16539']){
 let from=0,n=0;
 while(true){const at=s.indexOf(term,from);if(at<0)break;
 console.log('M83_SAFARI_OWNER '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-1800),Math.min(s.length,at+6500))}));
 from=at+term.length;if(++n>=8)break;}
}
