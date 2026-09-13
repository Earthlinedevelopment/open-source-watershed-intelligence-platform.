import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');

function around(label, needle, before=1200, after=4200){
  const i=s.indexOf(needle);
  console.log(`\n===== ${label} @${i} =====`);
  if(i<0){ console.log('NOT FOUND'); return; }
  console.log(s.slice(Math.max(0,i-before), Math.min(s.length,i+after)));
}

function balancedFrom(label, needles){
  let hit=-1, needle='';
  for(const n of needles){ const i=s.indexOf(n); if(i>=0){hit=i; needle=n; break;} }
  console.log(`\n===== ${label} @${hit} via ${needle || 'NOT FOUND'} =====`);
  if(hit<0) return;
  const brace=s.indexOf('{',hit);
  if(brace<0){ console.log(s.slice(hit,hit+3000)); return; }
  let depth=0, quote=null, esc=false, lineComment=false, blockComment=false;
  for(let i=brace;i<s.length;i++){
    const c=s[i], n=s[i+1];
    if(lineComment){ if(c==='\n') lineComment=false; continue; }
    if(blockComment){ if(c==='*'&&n==='/'){blockComment=false;i++;} continue; }
    if(quote){ if(esc){esc=false;continue;} if(c==='\\'){esc=true;continue;} if(c===quote) quote=null; continue; }
    if(c==='/'&&n==='/'){lineComment=true;i++;continue;}
    if(c==='/'&&n==='*'){blockComment=true;i++;continue;}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
    if(c==='{') depth++;
    else if(c==='}'){
      depth--;
      if(depth===0){ console.log(s.slice(hit,i+1)); return; }
    }
  }
  console.log(s.slice(hit,hit+7000));
}

function markerBlock(marker){
  const i=s.indexOf(marker);
  console.log(`\n===== MARKER BLOCK ${marker} @${i} =====`);
  if(i<0) return;
  const next=s.slice(i+marker.length).search(/EARTHLINE\s+\d{4,5}/i);
  const end=next>=0 ? Math.min(s.length,i+marker.length+next) : Math.min(s.length,i+18000);
  console.log(s.slice(i,end));
}

markerBlock('EARTHLINE 16625');
balancedFrom('addWaterLayer', ['function addWaterLayer','const addWaterLayer','let addWaterLayer','addWaterLayer =','addWaterLayer=']);
balancedFrom('removeWaterLayer', ['function removeWaterLayer','const removeWaterLayer','let removeWaterLayer','removeWaterLayer =','removeWaterLayer=']);
around('first addWaterLayer call','addWaterLayer()',1800,3500);
around('first removeWaterLayer call','removeWaterLayer()',1800,3500);
around('water source/layer neighborhood','earthline-regional-water',2500,5000);
