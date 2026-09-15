import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=['function earthlineRegionalSegmentValid16584','earthlineRegionalSegmentValid16584','async function earthlineResolveLandValidity16584','earthlineResolveLandValidity16584','EARTHLINE_NE50_LAKES_16584','validityGrid16584','earthlineRasterize','inlandWater','invalid cells'];
for(const needle of needles){
 let from=0,n=0;
 while(true){const i=s.indexOf(needle,from);if(i<0)break;n++;console.log(`\n===== ${needle} #${n} @ ${i} =====\n`+s.slice(Math.max(0,i-2500),Math.min(s.length,i+6500)));from=i+needle.length;if(n>=5)break;}
 if(!n) console.log(`\n===== ${needle}: NOT FOUND =====`);
}
