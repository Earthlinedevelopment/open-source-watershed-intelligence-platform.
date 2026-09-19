import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
for(const term of ['jurisdictionCapability16539','jurisdictionBoundaryPromise16539','const vermontRequest','vermontRequest=','async function clipProducts','function clipProducts']){
 let from=0,count=0;
 while(true){const i=s.indexOf(term,from);if(i<0)break;count++;console.log('EARTHLINE_VT_SELECTION_SOURCE '+JSON.stringify({term,count,index:i,snippet:s.slice(Math.max(0,i-3000),Math.min(s.length,i+6000))}));from=i+term.length;if(count>=8)break;}
}
