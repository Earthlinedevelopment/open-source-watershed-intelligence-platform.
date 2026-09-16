import fs from 'node:fs/promises';

const html=await fs.readFile('index.html','utf8');
const needles=[
  '__earthlineVtBoundary16178_',
  'earthlineVtBoundary16178',
  'corridor-label publication incomplete',
  'approved on-map corridor tabs/labels',
  'regionalBoundary16539'
];

const traces={};
for(const needle of needles){
  const hits=[];
  let from=0;
  while(hits.length<20){
    const i=html.indexOf(needle,from);
    if(i<0)break;
    hits.push({index:i,context:html.slice(Math.max(0,i-1800),Math.min(html.length,i+3200))});
    from=i+needle.length;
  }
  traces[needle]=hits;
  console.log(`SOURCE_TRACE ${needle} hits=${hits.length}`);
  hits.forEach((h,n)=>console.log(`SOURCE_TRACE_CONTEXT ${needle} #${n+1} @${h.index}\n${h.context}\nEND_SOURCE_TRACE_CONTEXT`));
}

const dynamic=[...html.matchAll(/__earthlineVtBoundary16178_[A-Za-z0-9_]+/g)].map(m=>m[0]);
console.log('SOURCE_TRACE_DYNAMIC '+JSON.stringify([...new Set(dynamic)]));

await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/mantra39-texas-now.json',JSON.stringify({generatedAt:new Date().toISOString(),mode:'source-trace',needles,traces,dynamic:[...new Set(dynamic)]},null,2));

if(!traces['corridor-label publication incomplete']?.length)process.exitCode=1;
