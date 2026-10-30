import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

function metrics(s){
  const lines=s.split(/\r?\n/);
  const count=re=>(s.match(re)||[]).length;
  const fn={};
  for(let i=0;i<lines.length;i++){
    for(const m of lines[i].matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)){
      (fn[m[1]]??=[]).push(i+1);
    }
  }
  return {
    bytes:Buffer.byteLength(s),
    lines:lines.length,
    inlineScripts:count(/<script(?:\s|>)/gi),
    windowAssignments:count(/window\.[A-Za-z_$][\w$]*\s*=/g),
    listeners:{
      idle:count(/\.on\s*\(\s*["']idle["']/g),
      styledata:count(/\.on\s*\(\s*["']styledata["']/g),
      moveend:count(/\.on\s*\(\s*["']moveend["']/g),
      zoomend:count(/\.on\s*\(\s*["']zoomend["']/g),
      load:count(/\.on\s*\(\s*["']load["']/g)
    },
    duplicateFunctions:Object.entries(fn).filter(([,v])=>v.length>1).length,
    earthlineMarkers:count(/EARTHLINE\s+\d+/g),
    buildCheckMarkers:count(/BUILD-CHECK-\d+/g),
    runAnalysisAssignments:count(/earthlineRunAnalysis\s*=/g),
    liveRegionalAssignments:count(/earthlineLiveRegionalRun15970\s*=/g),
    rendererOwnershipCalls:count(/earthlineApplyRendererOwnership15805/g),
    propertyPublicationMentions:count(/propertyPublication|PROPERTY_PUBLICATION|publishDisplayedRun/g)
  };
}
function gitShow(ref){
  return execFileSync('git',['show',ref+':index.html'],{encoding:'utf8',maxBuffer:20*1024*1024});
}
const accepted=gitShow('74343a24f90fed7d7abbe9267ef11a2836220de7');
const current=readFileSync('index.html','utf8');
const a=metrics(accepted),c=metrics(current);
const delta={};
for(const k of ['bytes','lines','inlineScripts','windowAssignments','duplicateFunctions','earthlineMarkers','buildCheckMarkers','runAnalysisAssignments','liveRegionalAssignments','rendererOwnershipCalls','propertyPublicationMentions'])delta[k]=c[k]-a[k];
delta.listeners={};
for(const k of Object.keys(a.listeners))delta.listeners[k]=c.listeners[k]-a.listeners[k];
console.log('MANTRA83_ACCEPTED '+JSON.stringify(a));
console.log('MANTRA83_CURRENT '+JSON.stringify(c));
console.log('MANTRA83_DELTA '+JSON.stringify(delta));

const markerAccepted=(accepted.match(/EARTHLINE\s+\d+/g)||[]);
const markerCurrent=(current.match(/EARTHLINE\s+\d+/g)||[]);
const uniq=x=>[...new Set(x)];
const newer=uniq(markerCurrent).filter(x=>!new Set(markerAccepted).has(x));
console.log('MANTRA83_NEW_MARKERS '+JSON.stringify({count:newer.length,first:newer.slice(0,30),last:newer.slice(-30)}));


function history(term){
  try{
    return execFileSync('git',['log','--all','--date=iso-strict','--pretty=format:%H|%ad|%s','-S',term,'--','index.html'],{encoding:'utf8',maxBuffer:10*1024*1024}).trim().split(/\r?\n/).filter(Boolean).slice(0,25);
  }catch(e){return ['ERROR '+String(e.message||e)];}
}
for(const term of [
  'maxS=33',
  'maxSlope=relaxed?(focusMode?18:4):13.5',
  'window.earthlineRunAnalysis=',
  'earthlineApplyRendererOwnership15805',
  'publishDisplayedRun16151',
  'function prescribeSwales15778',
  'function makeSwales'
]){
  console.log('MANTRA83_HISTORY '+JSON.stringify({term,commits:history(term)}));
}
