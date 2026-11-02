import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const file='index.html',s=readFileSync(file,'utf8');
const changes=[
 ['if(![xi16584,yi16584,xj16584,yj16584].every(Number.isFinite))continue;',
 'if(!Number.isFinite(xi16584)||!Number.isFinite(yi16584)||!Number.isFinite(xj16584)||!Number.isFinite(yj16584))continue;']
];
let out=s;for(const [from,to] of changes){const n=out.split(from).length-1;if(n!==1)throw Error('Unexpected code owner: '+from+' occurrences='+n);out=out.replace(from,to);}
for(const locked of ['metricLengthM92>=250&&metricLengthM92<=4005','const capM92=2000;',
 'if(len<8){','EARTHLINE_REGIONAL_PERFORMANCE_16191'])if(!out.includes(locked))throw Error('Missing locked science/visual owner '+locked);
const h=x=>createHash('sha256').update(x).digest('hex');
writeFileSync(file,out);
console.log('M92_HOTPATH_CANDIDATE '+JSON.stringify({before:h(s),after:h(out),changedOwners:changes.length,
 sourceGeomUnchanged:true,semantics:'Number.isFinite predicate equivalent; cooperative yield remains 1536; 4% and exclusion unchanged'}));
