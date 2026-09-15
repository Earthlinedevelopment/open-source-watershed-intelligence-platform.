import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const pats=[/ne_50m_[^'"`\s)]+/gi,/ne_10m_[^'"`\s)]+/gi,/naturalearth[^'"`\s)]+/gi,/earthlineLandValidity16584/gi,/landValidityPromise16584/gi,/waterParts16584/gi];
for(const re of pats){const seen=new Set();let m;while((m=re.exec(s))){if(seen.has(m[0]))continue;seen.add(m[0]);const a=Math.max(0,m.index-700),b=Math.min(s.length,m.index+1400);console.log('\n=== '+m[0]+' @ '+m.index+' ===\n'+s.slice(a,b));if(seen.size>=12)break;}}
