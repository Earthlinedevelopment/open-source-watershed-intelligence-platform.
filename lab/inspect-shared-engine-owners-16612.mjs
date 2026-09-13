import fs from 'node:fs';
const s = fs.readFileSync('index.html','utf8');

const one = x => String(x).replace(/\s+/g,' ').trim();
const around = (i,n=260) => one(s.slice(Math.max(0,i-n), Math.min(s.length,i+n)));

function collect(label,re,max=8){
  re.lastIndex=0;
  const a=[]; let m;
  while((m=re.exec(s)) && a.length<max){
    a.push({at:m.index,hit:one(m[0]).slice(0,180),ctx:around(m.index)});
    if(!m[0].length) re.lastIndex++;
  }
  console.log(label+'='+JSON.stringify(a));
}

const ids=[...new Set([...s.matchAll(/\b[$A-Za-z_][$\w]*(?:water|Water|WATER)[$\w]*\b/g)].map(m=>m[0]))].sort();
console.log('WATER_IDS='+JSON.stringify(ids.slice(0,100)));

collect('MAPPED_WATER',/mapped[\s_-]*water|water[\s_-]*mask|water[^\n]{0,80}(?:exclusion|validity)|(?:exclusion|validity)[^\n]{0,80}water/gi,12);
collect('WATER_AUDIT',/water[^\n]{0,100}audit|audit[^\n]{0,100}water/gi,10);
collect('REGIONAL_WATER',/regional[^\n]{0,140}water|water[^\n]{0,140}regional/gi,12);
collect('MAP_ADD',/(?:addSource|addLayer)\s*\([^;\n]{0,260}water|water[^;\n]{0,260}(?:addSource|addLayer)\s*\(/gi,12);
collect('MAP_SET',/setData\s*\([^;\n]{0,260}water|water[^;\n]{0,260}setData\s*\(/gi,12);
collect('FILTER_WATER',/filter\s*\([^;\n]{0,220}water|water[^;\n]{0,220}filter\s*\(/gi,10);

for(const needle of ['getSource(','addSource(','addLayer(','setData(','removeLayer(','removeSource(']){
  const hits=[]; let from=0;
  while(hits.length<12){
    const i=s.indexOf(needle,from); if(i<0) break;
    const c=around(i,420);
    if(/water/i.test(c)) hits.push({at:i,ctx:c});
    from=i+needle.length;
  }
  console.log('CALL_'+needle.replace(/\W/g,'_')+'='+JSON.stringify(hits));
}

const interesting=ids.filter(x=>/(regional|mapped|mask|audit|layer|source|flow|path|hydro|water)/i.test(x)).slice(0,50);
for(const id of interesting){
  const i=s.indexOf(id);
  console.log('IDCTX '+id+' @'+i+' '+(i>=0?around(i,340):''));
}
