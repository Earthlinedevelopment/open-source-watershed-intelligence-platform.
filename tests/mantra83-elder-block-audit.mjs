import {execFileSync} from 'node:child_process';
const sha='274a7b63a3d1381a7010aa4fbccd320e156b9314';
const s=execFileSync('git',['show',sha+':index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});
const term='EARTHLINE_ELDER_TREES_V1_17097';
let from=0,n=0;
while(true){
 const at=s.indexOf(term,from);if(at<0)break;
 const st=s.lastIndexOf('<script',at),open=s.indexOf('>',st),en=s.indexOf('</script>',at);
 const block=st>=0&&en>=0?s.slice(st,en+9):'';
 console.log('M83ELDERBLOCK '+JSON.stringify({n,at,scriptStart:st,scriptEnd:en,chars:block.length,head:block.slice(0,600),tail:block.slice(-600),termOffset:at-st}));
 from=at+term.length;if(++n>=40)break;
}
