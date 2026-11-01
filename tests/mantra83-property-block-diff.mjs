import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
function show(ref){return execFileSync('git',['show',ref+':index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});}
function block(s){const marker='<script id="earthline-build-16172-js">',st=s.indexOf(marker),en=s.indexOf('</script>',st);return s.slice(st,en+9);}
writeFileSync('/tmp/old.js',block(show('274a7b63a3d1381a7010aa4fbccd320e156b9314')));
writeFileSync('/tmp/cur.js',block(show('HEAD')));
let out='';try{out=execFileSync('diff',['-u','/tmp/old.js','/tmp/cur.js'],{encoding:'utf8',maxBuffer:10*1024*1024});}catch(e){out=e.stdout||''}
console.log('M83_PROPERTY_BLOCK_DIFF\n'+out);
