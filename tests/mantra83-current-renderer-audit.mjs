import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['function activeTier16168','function render(data){lastData=data||lastData','corridorGeometryVisible17434']){
 const at=s.indexOf(term);
 console.log('M83_CURRENT_RENDER '+JSON.stringify({term,at,text:at<0?'':s.slice(Math.max(0,at-1800),Math.min(s.length,at+9000))}));
}
