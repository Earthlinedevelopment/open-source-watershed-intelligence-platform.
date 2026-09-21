import { writeFileSync, mkdirSync } from 'node:fs';
const html=await (await fetch('https://earthlinedevelopment.org/?m46_selection_source='+Date.now(),{headers:{'cache-control':'no-cache'}})).text();
const at=html.indexOf('targetCells16783');
if(at<0)throw new Error('targetCells16783 not found');
mkdirSync('artifacts/mantra46-selection-source',{recursive:true});
const start=Math.max(0,at-12000),end=Math.min(html.length,at+18000);
writeFileSync('artifacts/mantra46-selection-source/final-spread-snippet.txt',html.slice(start,end));
console.log('EARTHLINE_M46_SELECTION_SOURCE '+JSON.stringify({at,start,end,length:end-start,has16788:html.includes('EARTHLINE 16788 — PRIORITIZED EFFICIENT TERRAIN-GAP RECOVERY')}));
