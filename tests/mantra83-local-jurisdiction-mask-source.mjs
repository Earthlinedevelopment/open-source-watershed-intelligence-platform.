import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
for(const needle of [
 'hy&&hy.earthlineLocalJurisdictionMask16539',
 'h16731.earthlineLocalJurisdictionMask16539=g16731.mask',
 'h16741.earthlineLocalJurisdictionMask16539=g16741.mask'
])if(!s.includes(needle))throw new Error('missing '+needle);
console.log('M83_LOCAL_JURISDICTION_MASK_SOURCE_PASS');
