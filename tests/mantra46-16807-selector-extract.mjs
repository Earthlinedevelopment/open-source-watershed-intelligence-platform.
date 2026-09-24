const html=await (await fetch('https://earthlinedevelopment.org/?m46_selector_extract='+Date.now())).text();
for(const needle of ['const nx16783=12,ny16783=12;','regionalCapacity16755','EARTHLINE_FINAL_PUBLISHED_SPREAD_16783']){
  const i=html.indexOf(needle);console.log('\n=== '+needle+' @ '+i+' ===\n');
  if(i>=0)console.log(html.slice(Math.max(0,i-7000),Math.min(html.length,i+12000)));
}
