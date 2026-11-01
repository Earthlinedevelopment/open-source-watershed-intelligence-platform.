import {execFileSync} from 'node:child_process';
function htmlAt(ref){return execFileSync('git',['show',ref+':index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});}
function block(s,id){const marker='<script id="'+id+'">',st=s.indexOf(marker),en=s.indexOf('</script>',st);return st>=0&&en>=0?s.slice(st,en+9):'';}
const old=block(htmlAt('274a7b63a3d1381a7010aa4fbccd320e156b9314'),'earthline-build-16172-js');
const cur=block(htmlAt('HEAD'),'earthline-build-16172-js');
console.log('M83ELDERCOMPARE '+JSON.stringify({oldChars:old.length,curChars:cur.length,oldElder:(old.match(/elder/ig)||[]).length,curElder:(cur.match(/elder/ig)||[]).length}));
for(const term of ['EARTHLINE_ELDER_TREES_V1_17097','primePropertyEvidence','startProperty']){
 let from=0,n=0;
 while(true){const at=old.indexOf(term,from);if(at<0)break;console.log('M83ELDERSNIP '+JSON.stringify({term,n,at,text:old.slice(Math.max(0,at-5000),Math.min(old.length,at+9000))}));from=at+term.length;if(++n>=5)break;}
}
