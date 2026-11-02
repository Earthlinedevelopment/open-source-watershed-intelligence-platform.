import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const rate=Number(process.env.EARTHLINE_M92_YIELD_RATE||'');
if(![768,1024,1536,2048,3072,4096].includes(rate))throw Error('Unapproved yield value');
const s=readFileSync('index.html','utf8');
const anchors=['(++yieldCount16661%384)===0','(++finalScreenYield16661%384)===0'];
for(const a of anchors)if(s.split(a).length!==2)throw Error('Source code owner mismatch: '+a);
if(!s.includes('metricLengthM92>=250&&metricLengthM92<=4005')||
  !s.includes('const capM92=2000;')||
  !s.includes('slope>maxSlope'))throw Error('Science safety owner changed');
const next=s.replace(anchors[0],'(++yieldCount16661%'+rate+')===0')
  .replace(anchors[1],'(++finalScreenYield16661%'+rate+')===0');
const digest=v=>createHash('sha256').update(v).digest('hex');
if(digest(s)===digest(next))throw Error('No change');
writeFileSync('index.html',next);
console.log('M92_YIELD_CANDIDATE '+JSON.stringify({rate,before:digest(s),after:digest(next),onlyChanged:'cooperative screening cadence'}));
