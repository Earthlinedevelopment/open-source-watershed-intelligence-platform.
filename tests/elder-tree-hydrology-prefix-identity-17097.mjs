import fs from 'node:fs';

const marker='/* EARTHLINE_ELDER_TREES_V1_17097';
const local=fs.readFileSync('earthline-launch-16872.js','utf8');
const r=await fetch('https://earthlinedevelopment.org/earthline-launch-16872.js?elder_prefix_17097='+Date.now(),{cache:'no-store'});
if(!r.ok)throw new Error('production JS '+r.status);
const live=await r.text();
const li=live.indexOf(marker),ci=local.indexOf(marker);
if(li<0||ci<0)throw new Error('Elder owner marker missing');
const prefixExact=live.slice(0,li)===local.slice(0,ci);
console.log('EARTHLINE_ELDER_HYDROLOGY_PREFIX_17097 '+JSON.stringify({
  prefixExact,liveMarker:li,candidateMarker:ci,
  livePrefixLength:li,candidatePrefixLength:ci,
  rule:'All code before the Elder Tree owner, including Property/hydrology owners, must be byte-identical.'
}));
if(!prefixExact)process.exitCode=1;
