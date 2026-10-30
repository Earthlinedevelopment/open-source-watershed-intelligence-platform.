import {execFileSync} from 'node:child_process';
const s=execFileSync('git',['show','b8b69f00d3e68e1b77fdee48d196fa58a622b809:index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});
for(const term of ['earthline-elder-trees-17097','ELDER_TREES_V1','primePropertyEvidence','elder-confidence']){
 let from=0,n=0;
 while(true){const at=s.indexOf(term,from);if(at<0)break;
  const st=s.lastIndexOf('<script',at),en=s.indexOf('</script>',at),op=st>=0?s.slice(st,s.indexOf('>',st)+1):'';
  console.log('M83EOWNER '+JSON.stringify({term,at,op,text:s.slice(Math.max(0,at-2500),Math.min(s.length,at+9000))}));
  from=at+term.length;if(++n>=20)break;
 }
}
