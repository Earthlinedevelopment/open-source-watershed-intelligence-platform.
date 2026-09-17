const html=await (await fetch('https://earthlinedevelopment.org/',{cache:'no-store'})).text();
const needles=['primarySpacing','chosen.some','chosen.length>=80','candidates.sort'];
for(const needle of needles){
  const i=html.indexOf(needle);
  console.log('\nEARTHLINE_SELECTOR_SOURCE '+needle+' index='+i+'\n'+(i>=0?html.slice(Math.max(0,i-2500),Math.min(html.length,i+4500)):'NOT FOUND'));
}
