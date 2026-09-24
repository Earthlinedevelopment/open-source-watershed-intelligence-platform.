const html=await (await fetch('https://earthlinedevelopment.org/?m46_vt_infra_extract='+Date.now(),{cache:'no-store'})).text();
for(const needle of ['__earthlineVtInfra16458','earthlineVtInfra16458','16458','vt-infra']){
 const i=html.indexOf(needle);
 console.log('\n=== '+needle+' @ '+i+' ===\n');
 if(i>=0)console.log(html.slice(Math.max(0,i-7000),Math.min(html.length,i+14000)));
}
