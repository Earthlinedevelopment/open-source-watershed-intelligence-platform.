import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');

function slice(label, needle, before=1400, after=3200, occurrence=1){
  let from=0,i=-1;
  for(let n=0;n<occurrence;n++){i=s.indexOf(needle,from);if(i<0)break;from=i+needle.length;}
  if(i<0){console.log(`\n===== ${label}: NOT FOUND =====`);return;}
  const a=Math.max(0,i-before),b=Math.min(s.length,i+after);
  console.log(`\n===== ${label} @${i} =====\n${s.slice(a,b)}\n===== END ${label} =====`);
}
function allPositions(label,needle,max=12){
  let from=0,arr=[];
  while(arr.length<max){const i=s.indexOf(needle,from);if(i<0)break;arr.push(i);from=i+needle.length;}
  console.log(`\n===== POSITIONS ${label} =====\n${JSON.stringify(arr)}\n===== END POSITIONS =====`);
}

allPositions('clip owner calls','earthlineClipRegionalProducts16539(');
allPositions('swale feature construction',"feature_type:'swale-opportunity'");
allPositions('swale feature construction doublequote','feature_type:"swale-opportunity"');
allPositions('swales assignment','swales=');

slice('CLIP OWNER DEFINITION','function earthlineClipRegionalProducts16539',2200,6500);
slice('CLIP OWNER FIRST CALL','earthlineClipRegionalProducts16539(',1800,3500,2);
slice('REGIONAL RUN START','async function runRegional',2200,7000);
slice('REGIONAL RUN START ALT','function runRegional',2200,7000);
slice('SWALE OPPORTUNITY CONSTRUCTION 1',"feature_type:'swale-opportunity'",3000,4500,1);
slice('SWALE OPPORTUNITY CONSTRUCTION 2',"feature_type:'swale-opportunity'",3000,4500,2);
slice('FINAL WATER GATE CALL','earthlineMappedWaterSwaleGate16609(m,swales',3500,3500);
slice('FINAL WATER GATE OWNER','async function earthlineMappedWaterSwaleGate16609',1800,4500);
slice('REGIONAL RENDER CALL','earthlineRenderRegionalOverlay16020(',3000,4000,2);
slice('VISUAL DATA ASSIGN','EARTHLINE_REGIONAL_VISUAL_DATA_16020=',2200,3800);

// 16621 trigger
