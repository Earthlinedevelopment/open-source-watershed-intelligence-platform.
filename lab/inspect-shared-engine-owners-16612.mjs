import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const one=x=>String(x).replace(/\s+/g,' ').trim();
function all(needle,max=20,b=1200,a=2200){let from=0,n=0;console.log(`\n## ${needle}`);while(n<max){const i=s.indexOf(needle,from);if(i<0)break;n++;console.log(`\n#${n} @${i}\n${one(s.slice(Math.max(0,i-b),Math.min(s.length,i+a)))}`);from=i+needle.length}if(!n)console.log('NOT FOUND')}
all("setGeo(m,IDS.flows",12,1800,3500);
all("IDS.flows",20,1000,2000);
all("EARTHLINE_REGIONAL_VISUAL_DATA_16020",12,1500,3000);
all("el-live-flows-15970",20,1200,2500);
all("flowFC",20,1000,2200);
all("makeFlows",12,1600,3400);
all("EARTHLINE_DISPLAYED_RUN_16151",12,1200,2400);
