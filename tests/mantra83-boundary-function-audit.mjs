import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['function screenJurisdictionCandidate16539','function earthlineClipLine16539','function earthlinePointInJurisdiction16539']){
 const at=s.indexOf(term);
 console.log('M83BOUNDARYFUNC '+JSON.stringify({term,at,text:at<0?'':s.slice(at,Math.min(s.length,at+8000))}));
}
