import {execFileSync} from 'node:child_process';
const sha='b8b69f00d3e68e1b77fdee48d196fa58a622b809';
const s=execFileSync('git',['show',sha+':index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});
let from=0,n=0;
while(true){
  const at=s.indexOf('17097',from);if(at<0)break;
  const st=s.lastIndexOf('<script',at),en=s.indexOf('</script>',at);
  const opener=st>=0?s.slice(st,s.indexOf('>',st)+1):'';
  console.log('M83E17097 '+JSON.stringify({at,opener,text:s.slice(Math.max(0,at-1200),Math.min(s.length,at+3600))}));
  from=at+5;if(++n>=40)break;
}
