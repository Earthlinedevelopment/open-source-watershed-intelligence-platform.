import { writeFileSync } from 'node:fs';
const html=await (await fetch('https://earthlinedevelopment.org/?property_prescriber_src='+Date.now(),{headers:{'cache-control':'no-cache'}})).text();
const needles=['prescriptionZeroReason15870','swaleDiagnostics','async function prescribe','function prescribe','earthlineLegitimateZeroReason15870','traceLevelContour'];
let out='';
for(const n of needles){
  let at=0,count=0;
  while((at=html.indexOf(n,at))>=0&&count<6){
    out+='\n===== '+n+' @ '+at+' =====\n'+html.slice(Math.max(0,at-9000),Math.min(html.length,at+22000));
    at+=n.length;count++;
  }
}
writeFileSync('property-prescriber-source.txt',out);
console.log('EARTHLINE_PROPERTY_PRESCRIBER_SOURCE '+JSON.stringify({len:html.length,hits:Object.fromEntries(needles.map(n=>[n,html.indexOf(n)]))}));
