const html=await (await fetch('https://earthlinedevelopment.org/',{cache:'no-store'})).text();
const needles=['function makeSwales','function screenJurisdictionCandidate16539','for(const f of lines){','clipLine','jurisdictionGeometry16539'];
for(const needle of needles){
  const i=html.indexOf(needle);
  console.log('\nEARTHLINE_SOURCE '+needle+' index='+i+'\n'+(i>=0?html.slice(Math.max(0,i-3500),Math.min(html.length,i+6500)):'NOT FOUND'));
}
