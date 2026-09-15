import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const marker='function earthlineFinalWaterClip16584';
const p=s.indexOf(marker);if(p<0)throw new Error('missing');
let i=s.indexOf('{',p),d=0,e=-1;for(;i<s.length;i++){if(s[i]==='{')d++;else if(s[i]==='}'){d--;if(d===0){e=i+1;break;}}}
console.log('FINAL_WATER_OWNER_START\n'+s.slice(p,e)+'\nFINAL_WATER_OWNER_END');
