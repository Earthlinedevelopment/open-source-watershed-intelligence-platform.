import { writeFileSync, mkdirSync } from 'node:fs';

const url='https://earthlinedevelopment.org/?m46_source_'+Date.now();
const html=await (await fetch(url,{headers:{'cache-control':'no-cache'}})).text();
const needles=['function makeSwales','async function makeSwales','const makeSwales','sampleSegment','linePx16632'];
let at=-1,needle='';
for(const n of needles){ const i=html.indexOf(n); if(i>=0 && (at<0||i<at)){at=i;needle=n;} }
if(at<0)throw new Error('makeSwales source not found');
mkdirSync('artifacts/mantra46-source',{recursive:true});
const start=Math.max(0,at-5000),end=Math.min(html.length,at+50000);
const snippet=html.slice(start,end);
writeFileSync('artifacts/mantra46-source/makeSwales-snippet.txt',snippet);
console.log('EARTHLINE_M46_SOURCE '+JSON.stringify({needle,at,start,end,length:snippet.length,has16785:html.includes('EARTHLINE 16785')}));

// trigger workflow
