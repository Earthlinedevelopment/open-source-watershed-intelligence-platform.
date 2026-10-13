import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const current=await readFile(new URL('../index.html',import.meta.url),'utf8');
const locked=execFileSync('git',['show','origin/production-lock-17137:index.html'],{
  encoding:'utf8',maxBuffer:32*1024*1024
});

const owners=[
  'pitFill',
  'flowRoute',
  'slopePct',
  'soilPercScore',
  'soilPercAt',
  'aquiferPermAt',
  'computeRecharge',
  'earthlineSelectRechargeTargets16409',
  'earthlineMinimumSwaleLengthM15768',
  'earthlineMergeCompatibleSwales',
  'earthlineSwaleGeometryAcceptable',
  'earthlineSwaleFromPts',
  'earthlineSegmentFlowEvidence15833',
  'prescribeSwales15778',
  'regionalOpportunitySwales15773',
  'auditCorridors15806',
  'filterCorridors15788',
  'runProperty15778',
  'earthlineRerankRegionalSwales16539',
  'regionalRechargeModel16492'
];

function extractFunction(src,name){
  const re=new RegExp('(?:async\\s+)?function\\s+'+name+'\\s*\\(');
  const m=re.exec(src);
  if(!m)throw new Error('Missing science owner '+name);
  const start=m.index;
  let brace=src.indexOf('{',m.index+m[0].length);
  if(brace<0)throw new Error('Missing body '+name);
  let depth=0,state='code',quote='',escaped=false;
  for(let i=brace;i<src.length;i++){
    const ch=src[i],n=src[i+1];
    if(state==='line'){if(ch==='\n')state='code';continue}
    if(state==='block'){if(ch==='*'&&n==='/'){state='code';i++}continue}
    if(state==='string'){
      if(escaped){escaped=false;continue}
      if(ch==='\\'){escaped=true;continue}
      if(ch===quote){state='code';quote=''}
      continue
    }
    if(state==='template'){
      if(escaped){escaped=false;continue}
      if(ch==='\\'){escaped=true;continue}
      if(ch==='\`'){state='code'}
      continue
    }
    if(ch==='/'&&n==='/'){state='line';i++;continue}
    if(ch==='/'&&n==='*'){state='block';i++;continue}
    if(ch==="'"||ch==='"'){state='string';quote=ch;continue}
    if(ch==='\`'){state='template';continue}
    if(ch==='{')depth++;
    else if(ch==='}'){
      depth--;
      if(depth===0)return src.slice(start,i+1);
    }
  }
  throw new Error('Unclosed science owner '+name);
}

const rows=[];
for(const name of owners){
  const a=extractFunction(locked,name);
  const b=extractFunction(current,name);
  const ah=createHash('sha256').update(a).digest('hex');
  const bh=createHash('sha256').update(b).digest('hex');
  rows.push({name,sha256:bh,bytes:b.length});
  assert.equal(bh,ah,name+' drifted from locked V1 science');
}
console.log('EARTHLINE_V2_CORE_SCIENCE_LOCK '+JSON.stringify({status:'PASS',base:'production-lock-17137',owners:rows}));
