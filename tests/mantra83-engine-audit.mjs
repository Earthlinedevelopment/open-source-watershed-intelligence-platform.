import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';

const html=readFileSync('index.html','utf8');
const lines=html.split(/\r?\n/);

function hits(re){
  const out=[];
  for(let i=0;i<lines.length;i++){
    const m=lines[i].match(re);
    if(m) out.push({line:i+1,text:lines[i].trim().slice(0,500)});
  }
  return out;
}
function count(re){ return hits(re).length; }
function names(re){
  const out=[];
  for(let i=0;i<lines.length;i++){
    let m;
    const r=new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g');
    while((m=r.exec(lines[i]))){
      out.push({line:i+1,name:m[1],text:lines[i].trim().slice(0,500)});
      if(m[0].length===0) r.lastIndex++;
    }
  }
  return out;
}

const report={
  bytes:Buffer.byteLength(html),
  lines:lines.length,
  inlineScripts:count(/<script(?:\s|>)/i),
  owners:{
    searchClick:hits(/searchOrb.*addEventListener\s*\(\s*["']click["']/i),
    searchEnter:hits(/searchInput.*addEventListener\s*\(\s*["']keydown["']/i),
    mapIdle:hits(/\.on\s*\(\s*["']idle["']/i),
    mapStyledata:hits(/\.on\s*\(\s*["']styledata["']/i),
    mapMoveend:hits(/\.on\s*\(\s*["']moveend["']/i),
    mapZoomend:hits(/\.on\s*\(\s*["']zoomend["']/i),
    mapLoad:hits(/\.on\s*\(\s*["']load["']/i)
  },
  functions:{
    declared:names(/function\s+([A-Za-z_$][\w$]*)\s*\(/g),
    windowAssigned:names(/window\.([A-Za-z_$][\w$]*)\s*=/g),
    constFns:names(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function|\()/g)
  },
  science:{
    property:hits(/property/i).slice(0,250),
    regional:hits(/regional/i).slice(0,250),
    aquifer:hits(/aquifer/i).slice(0,250),
    elder:hits(/elder/i).slice(0,250),
    swale:hits(/swale/i).slice(0,250),
    water:hits(/water path|waterpath|flow path|flowpath/i).slice(0,250),
    exclusion:hits(/exclusion|no-build|nobuild/i).slice(0,250),
    runIdentity:hits(/run.?id|authority|authoritative|owner|fingerprint|token/i).slice(0,400)
  },
  markers:hits(/EARTHLINE|BUILD-CHECK/i).slice(-500)
};

const duplicateFns={};
for(const x of report.functions.declared){
  (duplicateFns[x.name]??=[]).push(x.line);
}
report.duplicateFunctions=Object.fromEntries(Object.entries(duplicateFns).filter(([,v])=>v.length>1));

const listenerSummary={};
for(const [k,v] of Object.entries(report.owners)) listenerSummary[k]=v.length;
report.listenerSummary=listenerSummary;

mkdirSync('artifacts/mantra83-engine-audit',{recursive:true});
writeFileSync('artifacts/mantra83-engine-audit/engine-audit.json',JSON.stringify(report,null,2));
writeFileSync('artifacts/mantra83-engine-audit/ownership-summary.txt',[
  'bytes='+report.bytes,
  'lines='+report.lines,
  'inlineScripts='+report.inlineScripts,
  'listeners='+JSON.stringify(listenerSummary),
  'duplicateFunctions='+JSON.stringify(report.duplicateFunctions),
  'windowAssignments='+report.functions.windowAssigned.length,
  'markers='+report.markers.length
].join('\n')+'\n');

console.log('MANTRA83_DUPLICATES '+JSON.stringify(report.duplicateFunctions));
console.log('MANTRA83_LISTENERS '+JSON.stringify(report.owners));
console.log('MANTRA83_WINDOWS '+JSON.stringify(report.functions.windowAssigned.filter(x=>/run|prop|region|aqui|elder|water|swale|owner|author|publish|search|cross|frame|terrain|flow/i.test(x.name)).slice(0,250)));
console.log('MANTRA83_AUDIT '+JSON.stringify({
  bytes:report.bytes,
  lines:report.lines,
  inlineScripts:report.inlineScripts,
  listeners:listenerSummary,
  duplicateFunctions:Object.keys(report.duplicateFunctions).length,
  windowAssignments:report.functions.windowAssigned.length,
  markers:report.markers.length
}));
