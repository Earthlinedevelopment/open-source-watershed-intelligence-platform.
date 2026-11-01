import {execFileSync} from 'node:child_process';
function show(ref){return execFileSync('git',['show',ref+':index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});}
function block(s){const marker='<script id="earthline-build-16172-js">',st=s.indexOf(marker),en=s.indexOf('</script>',st);if(st<0||en<0)throw new Error('block missing '+st);return s.slice(st,en+9);}
const old=block(show('274a7b63a3d1381a7010aa4fbccd320e156b9314'));
const cur=block(show('HEAD'));
function contexts(s,term){
 const out=[];let from=0,n=0;
 while(true){const at=s.indexOf(term,from);if(at<0)break;out.push(s.slice(Math.max(0,at-1200),Math.min(s.length,at+2600)));from=at+term.length;if(++n>=20)break;}
 return out;
}
for(const term of [
 'EARTHLINE_ELDER_TREES_V1_17097',
 'EARTHLINE_PROPERTY_DECLARATION_16169',
 'scientific terminal',
 'frameDeclaredProperty(site);',
 'settleCurrentPropertyPresentation16521',
 'window.earthlineDeclarePropertyAtCrosshair16173=terminalPropertyRun'
]){
 console.log('M83_OLDCONTEXT '+JSON.stringify({term,arr:contexts(old,term)}));
 console.log('M83_CURCONTEXT '+JSON.stringify({term,arr:contexts(cur,term)}));
}
