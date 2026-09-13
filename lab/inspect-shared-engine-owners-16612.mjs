import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const one=x=>String(x).replace(/\s+/g,' ').trim();
const ctx=(needle,b=1200,a=2600)=>{const i=s.indexOf(needle);console.log(`\n### ${needle} @${i}\n${i<0?'NOT FOUND':one(s.slice(Math.max(0,i-b),Math.min(s.length,i+a)))}`)};

function extractFunction(name,max=14000){
  const call=s.indexOf(name);
  if(call<0){console.log(`\n### FUNCTION ${name}: NOT FOUND`);return;}
  let start=s.lastIndexOf('function ',call);
  if(start<0||call-start>5000) start=Math.max(0,call-2500);
  const brace=s.indexOf('{',start);
  if(brace<0){ctx(name);return;}
  let depth=0,q=null,esc=false,line=false,block=false;
  for(let i=brace;i<s.length&&i<brace+max;i++){
    const c=s[i],n=s[i+1];
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='`'){q=c;continue}
    if(c==='{')depth++;
    else if(c==='}'&&--depth===0){console.log(`\n### FUNCTION ${name} START ${start} END ${i}\n${one(s.slice(start,i+1))}`);return}
  }
  console.log(`\n### FUNCTION ${name} (TRUNCATED)\n${one(s.slice(start,Math.min(s.length,start+max)))}`);
}

extractFunction('nativeWater16350');
extractFunction('hideNative');
ctx('EARTHLINE_REGIONAL_WATER_OWNERSHIP_AUDIT_16350',3200,5200);
extractFunction('earthlineMappedWaterSwaleGate16609');
ctx('EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609',2400,3600);
ctx('native-mapbox',3000,5000);

// Find every hideNative call in the current product and show compact call-site ownership.
let from=0,n=0;while(n<20){const i=s.indexOf('hideNative()',from);if(i<0)break;n++;console.log(`\n### hideNative CALL ${n} @${i}\n${one(s.slice(Math.max(0,i-900),Math.min(s.length,i+1300)))}`);from=i+12}
