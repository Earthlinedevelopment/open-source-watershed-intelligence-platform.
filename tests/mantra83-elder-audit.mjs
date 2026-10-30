import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
const re=/elder/ig;let m,n=0;
while((m=re.exec(s))&&n<60){
 const at=m.index;
 console.log('M83ELDER '+JSON.stringify({at,text:s.slice(Math.max(0,at-1000),Math.min(s.length,at+3500))}));
 n++;
}
console.log('M83ELDER_COUNT '+n);
