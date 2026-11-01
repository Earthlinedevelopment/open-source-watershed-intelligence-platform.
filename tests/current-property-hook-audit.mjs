import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
for(const term of ['EARTHLINE_PROPERTY_TARGET_16201','earthline:analysis-complete','runDirectAddressProperty16291','terminalPropertyRun','propertyPublication15816']){
 let from=0,n=0;while(true){const at=s.indexOf(term,from);if(at<0)break;console.log('HOOK '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-1600),Math.min(s.length,at+5200))}));from=at+term.length;if(++n>=10)break;}
}
