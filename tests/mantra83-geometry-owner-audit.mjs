import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
const start=s.indexOf('async function makeSwales');
if(start<0)throw new Error('makeSwales missing');
const end=s.indexOf('function makeFlows',start);
const text=s.slice(start,end>start?end:start+70000);
for(const term of [
  'function sampleSegment',
  'const half=Math.max',
  'chaikin(raw,2,false)',
  'segment:segment',
  'geometry:{type:',
  'acceptedChosen',
  'relaxed',
  'lineLengthPixels',
  'sampleSegment(coords'
]){
  let from=0,n=0;
  while(true){
    const at=text.indexOf(term,from); if(at<0)break;
    console.log('M83_GEOM '+JSON.stringify({term,offset:at,text:text.slice(Math.max(0,at-1500),Math.min(text.length,at+4200))}));
    from=at+term.length;if(++n>=12)break;
  }
}
