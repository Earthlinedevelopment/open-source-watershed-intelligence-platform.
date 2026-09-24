const html=await (await fetch('https://earthlinedevelopment.org/?m47_16825='+Date.now(),{cache:'no-store'})).text();
for(const needle of ['EARTHLINE_FINE_DISPERSION_REBALANCE_16778','candidateCells16778','targetCells16778','chosenCellCount16778','nx16778','18x18 cells']){
  console.log('\n===== '+needle+' =====');
  let from=0,n=0;
  while(true){const i=html.indexOf(needle,from);if(i<0)break;n++;console.log('\n-- '+n+' @ '+i+' --\n'+html.slice(Math.max(0,i-2600),Math.min(html.length,i+5200)));from=i+needle.length;if(n>=4)break;}
  if(!n)console.log('NOT FOUND');
}
