import {readFileSync} from 'node:fs';
const src=readFileSync('index.html','utf8');
const re=/elder/ig; let m,n=0;
while((m=re.exec(src))&&n<80){
 const at=m.index;
 console.log('M83ELDER2 '+JSON.stringify({at,text:src.slice(Math.max(0,at-900),Math.min(src.length,at+2400))}));
 n++;
}
console.log('M83ELDER2_COUNT '+JSON.stringify({shown:n,total:(src.match(/elder/ig)||[]).length}));
