import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');

function show(label,needle,before=3500,after=6500,max=6){
  let from=0,k=0;
  while(k<max){
    const i=s.indexOf(needle,from); if(i<0)break; k++;
    const a=Math.max(0,i-before),b=Math.min(s.length,i+after);
    console.log(`\n===== ${label} #${k} @${i} =====\n${s.slice(a,b)}\n===== END ${label} #${k} =====`);
    from=i+needle.length;
  }
  if(!k)console.log(`\n===== ${label}: NOT FOUND =====`);
}

show('CORRIDOR LABEL THROW','Regional corridor-label publication incomplete',5000,9000,4);
show('DISPLAY AUDIT','EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040',5000,9000,8);
show('REGIONAL RENDERER','earthlineRenderRegionalOverlay16020',5000,10000,8);
show('REGIONAL VISUAL DATA','EARTHLINE_REGIONAL_VISUAL_DATA_16020',5000,10000,8);
show('WATER PATHS SYMBOL','waterPaths',5000,10000,8);
show('DIRECTION ARROWS SYMBOL','directionArrows',5000,10000,8);
show('FLOW FEATURES SYMBOL','flowFeatures',5000,10000,8);
show('SETDATA WATER','setData(water',5000,10000,8);
show('SETDATA FLOW','setData(flow',5000,10000,8);
show('FEATURE WATER PATH','water-path',5000,10000,8);
show('FILTER POINTALLOWED','.filter(pointAllowed',5000,10000,8);
show('FILTER VALID','.filter(valid',5000,10000,8);
show('CLIP REGIONAL','earthlineClipRegionalProducts16539',5000,10000,8);
show('MAKE SWALES','function makeSwales',5000,10000,4);
show('LINESTRING','LineString',1500,2500,30);
