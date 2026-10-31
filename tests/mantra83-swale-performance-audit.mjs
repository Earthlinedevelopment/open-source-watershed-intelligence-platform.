import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
const at=s.indexOf('async function makeSwales');
if(at<0)throw new Error('makeSwales not found');
const text=s.slice(at,Math.min(s.length,at+52000));
for(const term of ['candidates.sort','chosen.some','selected.some','acceptedChosen','Math.hypot','for(const c of candidates','for(let i=0;i<candidates.length','slice(0,','maxCount','capacity']){
  let from=0,n=0;
  while(true){
    const i=text.indexOf(term,from);if(i<0)break;
    console.log('M83SWALEPERF '+JSON.stringify({term,offset:i,text:text.slice(Math.max(0,i-1400),Math.min(text.length,i+4200))}));
    from=i+term.length;if(++n>=12)break;
  }
}
