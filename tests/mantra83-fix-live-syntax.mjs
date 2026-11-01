import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');
const bad="+String(err&&err.stack||err&&err.message||err).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</pre>\n</body></html>');";
const good="+String(err&&err.stack||err&&err.message||err).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</pre></body></html>');";
if(s.includes(bad))s=s.replace(bad,good);
else if(!s.includes(good))throw new Error('live report syntax owner not found');
writeFileSync(p,s);
console.log('M83_LIVE_SYNTAX_FIXED');
