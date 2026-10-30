import {readFileSync} from 'node:fs';
const src=readFileSync('index.html','utf8');
function block(needle, before=1000, after=16000){
  const at=src.indexOf(needle);
  return {needle,at,text:at<0?'':src.slice(Math.max(0,at-before),Math.min(src.length,at+after))};
}
for(const n of [
  'function prescribeSwales15778',
  'function makeSwales',
  'function hydrology',
  'function makeFlows',
  'function makeContours',
  'function loadDEM',
  'function earthlineDefaultAnalysisPolygon',
  'function earthlineGetExclusionEvidence16516',
  'function loadAquifers',
  'function loadUSGSKarstAquifers',
  'function loadIGRACAquifers'
]) console.log('M83SCI '+JSON.stringify(block(n)));
for(const term of ['maxS=','maxSlope=','slope','forest','canopy','spacing','water','road','structure','driveway','aquifer']){
  const hits=[]; let from=0;
  while(true){const at=src.toLowerCase().indexOf(term.toLowerCase(),from);if(at<0)break;hits.push(src.slice(Math.max(0,at-220),Math.min(src.length,at+420)));from=at+term.length;if(hits.length>=40)break;}
  console.log('M83TERM '+JSON.stringify({term,count:hits.length,hits}));
}
