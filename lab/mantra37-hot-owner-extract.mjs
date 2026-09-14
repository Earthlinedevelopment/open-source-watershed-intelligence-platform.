import fs from 'node:fs';
import path from 'node:path';
const s=fs.readFileSync('index.html','utf8');
const names=[
  'earthlineFinitePoint16539','earthlinePointOnSegment16539','earthlinePointInRing16539',
  'earthlinePointInRing16584','earthlineRegionalSegmentValid16584','earthlineRegionalSmoothFlow16584',
  'earthlineMappedWaterSwaleGate16609','finite16609','ringInside16609','segmentHits16609'
];
function lineAt(i){return s.slice(0,i).split('\n').length;}
function extractFunction(name){
  const re=new RegExp('(?:async\\s+)?function\\s+'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*\\(');
  const m=re.exec(s);if(!m)return `### ${name}: FUNCTION NOT FOUND\n`;
  const start=m.index,open=s.indexOf('{',start);if(open<0)return `### ${name}: OPEN BRACE NOT FOUND\n`;
  let depth=0,quote=null,esc=false,lineComment=false,blockComment=false;
  for(let i=open;i<s.length;i++){
    const c=s[i],n=s[i+1];
    if(lineComment){if(c==='\n')lineComment=false;continue;}
    if(blockComment){if(c==='*'&&n==='/'){blockComment=false;i++;}continue;}
    if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote=null;continue;}
    if(c==='/'&&n==='/'){lineComment=true;i++;continue;}
    if(c==='/'&&n==='*'){blockComment=true;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='{')depth++;
    else if(c==='}'){depth--;if(depth===0)return `### ${name} @ line ${lineAt(start)}\n${s.slice(start,i+1)}\n### END ${name}\n`;}
  }
  return `### ${name}: UNTERMINATED\n`;
}
let out='';
for(const n of names)out+=extractFunction(n)+'\n';
for(const n of ['earthlineRegionalSmoothFlow16584(','earthlineMappedWaterSwaleGate16609(','earthlineClipRegionalProducts16539(','earthlineRegionalSegmentValid16584(']){
  out+=`\n### CALL CONTEXTS ${n}\n`;let from=0,k=0;
  while(true){const i=s.indexOf(n,from);if(i<0)break;from=i+n.length;k++;if(k>12)break;out+=`\n-- call ${k} @ line ${lineAt(i)} --\n${s.slice(Math.max(0,i-1800),Math.min(s.length,i+2800))}\n`;}
}
fs.mkdirSync('lab-results',{recursive:true});
fs.writeFileSync('lab-results/mantra37-hot-owner-extract.txt',out);
console.log('M37_HOT_OWNER_EXTRACT bytes='+out.length);
