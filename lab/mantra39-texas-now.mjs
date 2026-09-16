import fs from 'node:fs/promises';

const html=await fs.readFile('index.html','utf8');
const needles=[
  'regionalOverlayRenderOk16336',
  'swaleGradeLabels',
  'earthlineRegionalCorridorTabs16323',
  'earthlineRegionalVectorOverlay16020',
  'genericBoundaryAudit16539',
  'vermontRequest',
  'validateBoundary(',
  'EARTHLINE_VERMONT_BOUNDARY_SOURCE_16178'
];
const traces={};
for(const needle of needles){
  const hits=[];let from=0;
  while(hits.length<30){
    const i=html.indexOf(needle,from);if(i<0)break;
    hits.push({index:i,context:html.slice(Math.max(0,i-2200),Math.min(html.length,i+4200))});
    from=i+needle.length;
  }
  traces[needle]=hits;
  console.log(`SOURCE_TRACE ${needle} hits=${hits.length}`);
  hits.forEach((h,n)=>console.log(`SOURCE_TRACE_CONTEXT ${needle} #${n+1} @${h.index}\n${h.context}\nEND_SOURCE_TRACE_CONTEXT`));
}
await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/mantra39-texas-now.json',JSON.stringify({generatedAt:new Date().toISOString(),mode:'label-and-boundary-trace',needles,traces},null,2));
if(!traces['regionalOverlayRenderOk16336']?.length||!traces['swaleGradeLabels']?.length)process.exitCode=1;
