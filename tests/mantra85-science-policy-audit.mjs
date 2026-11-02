import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const html=readFileSync('index.html','utf8');

function balancedFunction(text,name){
  const re=new RegExp('(?:async\\s+)?function\\s+'+name+'\\s*\\(');
  const m=re.exec(text); if(!m)return null;
  const open=text.indexOf('{',m.index); if(open<0)return null;
  let depth=0,quote=null,esc=false,lineComment=false,blockComment=false;
  for(let i=open;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(lineComment){if(ch==='\n')lineComment=false;continue;}
    if(blockComment){if(ch==='*'&&next==='/'){blockComment=false;i++;}continue;}
    if(quote){if(esc){esc=false;continue;}if(ch==='\\'){esc=true;continue;}if(ch===quote)quote=null;continue;}
    if(ch==='/'&&next==='/'){lineComment=true;i++;continue;}
    if(ch==='/'&&next==='*'){blockComment=true;i++;continue;}
    if(ch==="'"||ch==='"'||ch.charCodeAt(0)===96){quote=ch;continue;}
    if(ch==='{')depth++;
    else if(ch==='}'&&--depth===0)return text.slice(m.index,i+1);
  }
  return null;
}
function contexts(re,radius=500,limit=40){
  const out=[];const rx=new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g');let m;
  while((m=rx.exec(html))&&out.length<limit){
    out.push(html.slice(Math.max(0,m.index-radius),Math.min(html.length,m.index+m[0].length+radius)).replace(/\\s+/g,' '));
    if(!m[0].length)rx.lastIndex++;
  }
  return out;
}
function ids(re){
  const s=new Set();let m;const rx=new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g');
  while((m=rx.exec(html)))s.add(m[1]||m[0]);
  return [...s].sort();
}
const makeSwales=balancedFunction(html,'makeSwales');
const report={
  at:new Date().toISOString(),
  makeSwales:{
    found:!!makeSwales,
    bytes:makeSwales?.length||0,
    sha256:makeSwales?createHash('sha256').update(makeSwales).digest('hex'):null,
    source:makeSwales
  },
  modelScienceKeys:{
    recharge:ids(/\\bM\\.([A-Za-z0-9_$]*(?:rech|recharge)[A-Za-z0-9_$]*)/gi),
    forestCanopy:ids(/\\bM\\.([A-Za-z0-9_$]*(?:forest|canopy|tree|veg)[A-Za-z0-9_$]*)/gi),
    masks:ids(/\\bM\\.([A-Za-z0-9_$]*Mask[A-Za-z0-9_$]*)/g)
  },
  contexts:{
    recharge:contexts(/recharge|\\brech\\b/gi,420,30),
    forestCanopy:contexts(/forest|canopy/gi,420,30),
    ranking:contexts(/candidate[^;]{0,120}(?:score|sort)|(?:score|sort)[^;]{0,120}candidate/gi,500,30),
    swaleSelection:contexts(/chosen|targetSwaleSpacingM|swCount|spacing/gi,420,30)
  }
};
mkdirSync('artifacts/mantra85',{recursive:true});
writeFileSync('artifacts/mantra85/science-policy-audit.json',JSON.stringify(report,null,2));
console.log('MANTRA85_SCIENCE_POLICY_SUMMARY '+JSON.stringify({
  makeSwales:{found:report.makeSwales.found,bytes:report.makeSwales.bytes,sha256:report.makeSwales.sha256},
  modelScienceKeys:report.modelScienceKeys,
  contextCounts:Object.fromEntries(Object.entries(report.contexts).map(([k,v])=>[k,v.length]))
}));
