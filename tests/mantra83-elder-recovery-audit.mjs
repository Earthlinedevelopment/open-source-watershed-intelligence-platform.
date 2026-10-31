import {readFileSync} from 'node:fs';
const old=readFileSync('/tmp/elder-old.html','utf8');
const current=readFileSync('index.html','utf8');
function scripts(src){
 const out=[];const re=/<script([^>]*)>([\s\S]*?)<\/script>/gi;let m;
 while((m=re.exec(src))){
  if(/elder/i.test(m[1]+' '+m[2])){
   const id=(m[1].match(/id=["']([^"']+)/i)||[])[1]||'';
   out.push({id,at:m.index,len:m[0].length,head:m[2].slice(0,900),names:[...m[2].matchAll(/function\s+([A-Za-z0-9_$]+)/g)].map(x=>x[1]).filter(n=>/elder/i.test(n)).slice(0,80),globals:[...m[2].matchAll(/window\.([A-Za-z0-9_$]+)/g)].map(x=>x[1]).filter(n=>/elder/i.test(n)).slice(0,80)});
  }
 }
 return out;
}
console.log('M83_OLD_ELDER_SCRIPTS '+JSON.stringify(scripts(old)));
console.log('M83_CURRENT_ELDER_SCRIPTS '+JSON.stringify(scripts(current)));
