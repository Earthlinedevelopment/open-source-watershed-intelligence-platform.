import fs from 'node:fs';

const checks=[
  ['index.html',4_000_000,['id="searchInput"','id="runBtn"','earthline-launch-16872.js']],
  ['earthline-launch-16872.js',10_000,['EARTHLINE','17097']],
  ['earthline-elder-worker-17129.js',5_000,['postMessage','Elder']]
];
const rows=[];
for(const [path,min,needles] of checks){
  const s=fs.statSync(path),text=fs.readFileSync(path,'utf8');
  const row={path,size:s.size,min,needles:Object.fromEntries(needles.map(n=>[n,text.includes(n)]))};
  row.pass=s.size>=min&&Object.values(row.needles).every(Boolean);
  rows.push(row);
  console.log('M82_ARTIFACT '+JSON.stringify(row));
}
if(rows.some(r=>!r.pass))throw new Error('artifact integrity failure '+JSON.stringify(rows.filter(r=>!r.pass)));
