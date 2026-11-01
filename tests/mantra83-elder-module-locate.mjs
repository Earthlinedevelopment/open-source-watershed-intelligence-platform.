import {execFileSync} from 'node:child_process';
const html=execFileSync('git',['show','274a7b63a3d1381a7010aa4fbccd320e156b9314:index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});
const marker='<script id="earthline-build-16178-state-identity-boundary-timeout">',st=html.indexOf(marker),en=html.indexOf('</script>',st);
const b=html.slice(st,en+9);
for(const term of ['17097','elder','ELDER','primePropertyEvidence','startProperty','refresh']){
 let from=0,n=0;
 while(true){const at=b.indexOf(term,from);if(at<0)break;console.log('M83_E2 '+JSON.stringify({term,n,at,text:b.slice(Math.max(0,at-2200),Math.min(b.length,at+6200))}));from=at+term.length;if(++n>=20)break;}
}
