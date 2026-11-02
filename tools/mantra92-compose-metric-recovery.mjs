import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const file='index.html';
let source=readFileSync(file,'utf8');
const before=createHash('sha256').update(source).digest('hex');
function exactlyOne(text,label){
  const n=source.split(text).length-1;
  if(n!==1)throw Error(label+' expected once, found '+n);
}
const head='let left=rawCenter,right=rawCenter,leftM=0,rightM=0;';
const tail='const segment=raw.slice(left,right+1);if(segment.length<2)return null;';
const rawGate='let minLinePx16632=focusMode?10:2;';
const candidateTag="confidence:relaxed?'screening':'preferred',minLinePx16632};";
const screenPrefix='const minimumScreenPx16737=';
const afterScreen='const mid16539=';
for(const [s,label] of [[head,'locality-start'],[tail,'locality-end'],
  [rawGate,'pixel gate'],[candidateTag,'candidate identity'],[screenPrefix,'jurisdiction gate'],
  ['(++yieldCount16661%12)===0','preliminary screening yield'],
  ['(++finalScreenYield16661%12)===0','full screening yield']]){
  exactlyOne(s,label);
}
const start=source.indexOf(head),end=source.indexOf(tail,start)+tail.length;
if(end<start)throw Error('Missing locality segment');
const metricClip=[
  'const capM92=2000;',
  'function sectionM92(dir){',
  '  let cursorM92=rawCenter,totalM92=0;',
  '  const ptsM92=[raw[rawCenter]];',
  '  while(cursorM92+dir>=0&&cursorM92+dir<raw.length&&totalM92<capM92){',
  '    const aM92=raw[cursorM92],bM92=raw[cursorM92+dir],dM92=distM(aM92,bM92);',
  '    if(!Number.isFinite(dM92)||dM92<=0){cursorM92+=dir;continue;}',
  '    const remainingM92=capM92-totalM92;',
  '    if(dM92<=remainingM92){ptsM92.push(bM92);totalM92+=dM92;cursorM92+=dir;continue;}',
  '    const tM92=remainingM92/dM92;',
  '    ptsM92.push([Number(aM92[0])+(Number(bM92[0])-Number(aM92[0]))*tM92,',
  '      Number(aM92[1])+(Number(bM92[1])-Number(aM92[1]))*tM92]);',
  '    break;',
  '  }',
  '  return ptsM92;',
  '}',
  'const leftM92=sectionM92(-1),rightM92=sectionM92(1);',
  'const segment=leftM92.reverse().slice(0,-1).concat(rightM92);',
  'if(segment.length<2)return null;'
].join('\n');
source=source.slice(0,start)+metricClip+source.slice(end);
source=source.replace(rawGate,'let minLinePx16632=focusMode?10:0;');
source=source.replace(candidateTag,
  "confidence:relaxed?'screening':'preferred',minLinePx16632,m92MetricValidated:!focusMode};");
const screenStart=source.indexOf(screenPrefix),screenEnd=source.indexOf(afterScreen,screenStart);
if(screenStart<0||screenEnd<screenStart||!source.slice(screenStart,screenEnd)
  .includes('lineLengthPixels(hy,segment16539)<minimumScreenPx16737'))throw Error('Jurisdiction screen changed');
const screen=[
  'const minimumScreenPx16737=candidate16539&&candidate16539.coverageGap16731',
  '  ?0.75',
  '  :Math.max(4,Math.min(10,Number(candidate16539&&candidate16539.minLinePx16632)||10));',
  'const metricLocalM92=!focusMode&&candidate16539?.m92MetricValidated===true;',
  'let metricLengthM92=0;',
  'if(metricLocalM92&&Array.isArray(segment16539))for(let iM92=1;iM92<segment16539.length;iM92++){',
  '  const aM92=segment16539[iM92-1],bM92=segment16539[iM92],R=6371008.8,rad=Math.PI/180;',
  '  const p1M92=Number(aM92[1])*rad,p2M92=Number(bM92[1])*rad;',
  '  const dpM92=(Number(bM92[1])-Number(aM92[1]))*rad,dlM92=(Number(bM92[0])-Number(aM92[0]))*rad;',
  '  const hM92=Math.sin(dpM92/2)**2+Math.cos(p1M92)*Math.cos(p2M92)*Math.sin(dlM92/2)**2;',
  '  metricLengthM92+=2*R*Math.asin(Math.min(1,Math.sqrt(hM92)));',
  '}',
  'if(!segment16539||segment16539.length<2||',
  '  (metricLocalM92?!(metricLengthM92>=250&&metricLengthM92<=4005)',
  '    :lineLengthPixels(hy,segment16539)<minimumScreenPx16737)){',
  '  if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);',
  '  return null;',
  '}'
].join('\n');
source=source.slice(0,screenStart)+screen+source.slice(screenEnd);
source=source.replace('(++yieldCount16661%12)===0','(++yieldCount16661%384)===0')
  .replace('(++finalScreenYield16661%12)===0','(++finalScreenYield16661%384)===0');
const after=createHash('sha256').update(source).digest('hex');
if(after===before)throw Error('No change');
if(!source.includes('const capM92=2000;')||!source.includes('metricLengthM92>=250&&metricLengthM92<=4005')||
   !source.includes('slope>maxSlope')||
   !source.includes("if(focusMode||preferredEligibleCount16539<36)"))
  throw Error('Expected science owner/safety check missing');
writeFileSync(file,source);
console.log('M92_METRIC_BUILD '+JSON.stringify({before,after,length:source.length,
  owner:'makeSwales and canonical jurisdiction screen',maxPerSideM:2000,
  maxSlopePct:4,screenRangeM:[250,4005],cooperativeYield:384}));
