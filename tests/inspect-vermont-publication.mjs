import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const terms=[
  'EARTHLINE_SWALE_GENERATION_AUDIT_16167',
  'earthlineClipRegionalProducts16539',
  'const swaleCount=swales.features.length',
  'EARTHLINE_REGIONAL_VISUAL_DATA_16020',
  'jurisdictionSelectionOrder',
  'Vermont',
  'vermont'
];
for(const term of terms){
  let from=0,count=0;
  while(true){
    const i=s.indexOf(term,from);if(i<0)break;
    count++;
    const a=Math.max(0,i-1800),b=Math.min(s.length,i+3200);
    console.log('EARTHLINE_SOURCE_TERM '+JSON.stringify({term,count,index:i,snippet:s.slice(a,b)}));
    from=i+term.length;
    if(count>=8)break;
  }
}
