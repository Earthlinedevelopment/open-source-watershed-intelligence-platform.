import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';

const html=readFileSync('index.html','utf8');
const elder=readFileSync('earthline-elder-restored-17097.js','utf8');

function count(text,re){return (text.match(re)||[]).length;}
function snippets(text,re,radius=240){
  const out=[]; let m; const rx=new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g');
  while((m=rx.exec(text))&&out.length<30){
    out.push(text.slice(Math.max(0,m.index-radius),Math.min(text.length,m.index+m[0].length+radius)).replace(/\s+/g,' '));
    if(!m[0].length)rx.lastIndex++;
  }
  return out;
}
const report={
  at:new Date().toISOString(),
  bytes:{index:Buffer.byteLength(html),elder:Buffer.byteLength(elder)},
  structuralDebt:{
    rendererGeometryMutation:{
      count:count(html,/earthlineRegionalLocalDisplay16020/g),
      evidence:snippets(html,/earthlineRegionalLocalDisplay16020/g)
    },
    propertyPublishOwners:{
      terminalPublisher:count(html,/publishPropertyDisplay16220/g),
      genericDisplayPublisher:count(html,/publishDisplayedRun16151\s*\(/g),
      evidence:snippets(html,/publishPropertyDisplay16220|publishDisplayedRun16151\s*\(/g)
    },
    elderDownstreamPublication:{
      explicitComment:count(elder,/Elder is downstream of Property publication/g),
      analysisCompleteListeners:count(elder,/earthline:analysis-complete/g),
      terminalStartCalls:count(html,/EARTHLINE_ELDER_TREES_V1_17097\?\.startProperty/g),
      evidence:[
        ...snippets(elder,/Elder is downstream of Property publication|earthline:analysis-complete/g),
        ...snippets(html,/EARTHLINE_ELDER_TREES_V1_17097\?\.startProperty/g)
      ]
    },
    lifecycleOwners:{
      styledata:count(html,/\.on\s*\(\s*['"]styledata['"]/g),
      idle:count(html,/\.on\s*\(\s*['"]idle['"]/g),
      moveend:count(html,/\.on\s*\(\s*['"]moveend['"]/g),
      render:count(html,/\.on\s*\(\s*['"]render['"]/g),
      timeouts:count(html,/setTimeout\s*\(/g),
      intervals:count(html,/setInterval\s*\(/g)
    },
    scienceOwners:{
      makeSwales:count(html,/\bmakeSwales\s*\(/g),
      authoritativeSafeSwales:count(html,/authoritativeSafeSwales15815/g),
      noBuildMask:count(html,/\bnoBuildMask\b/g),
      canopyTerms:count(html,/canopy/gi),
      forestTerms:count(html,/forest/gi)
    }
  }
};

report.blockers=[];
if(report.structuralDebt.rendererGeometryMutation.count)report.blockers.push('renderer geometry mutation exists');
if(report.structuralDebt.elderDownstreamPublication.explicitComment||report.structuralDebt.elderDownstreamPublication.terminalStartCalls)report.blockers.push('Elder lifecycle can occur downstream of Property publication');
if(report.structuralDebt.propertyPublishOwners.genericDisplayPublisher>1)report.blockers.push('multiple generic display publication call sites require ownership review');
if(report.structuralDebt.scienceOwners.makeSwales>1)report.blockers.push('multiple makeSwales call sites require authority review');

mkdirSync('artifacts/mantra85',{recursive:true});
writeFileSync('artifacts/mantra85/structural-debt.json',JSON.stringify(report,null,2));
console.log('MANTRA85_STRUCTURAL_DEBT '+JSON.stringify(report));
