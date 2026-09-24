const html=await (await fetch('https://earthlinedevelopment.org/?m47_16823b='+Date.now(),{cache:'no-store'})).text();
const needles=['const point16783','targetCells16783','parentCount16783','candidateCountByCell16783','EARTHLINE_FINAL_PUBLISHED_SPREAD_16783'];
for(const needle of needles){
  console.log('\n===== '+needle+' =====');
  let from=0,n=0;
  while(true){
    const i=html.indexOf(needle,from);if(i<0)break;n++;
    console.log('\n-- occurrence '+n+' @ '+i+' --\n'+html.slice(Math.max(0,i-1800),Math.min(html.length,i+3500)));
    from=i+needle.length;if(n>=5)break;
  }
  if(!n)console.log('NOT FOUND');
}
console.log('\nHTML_BYTES '+html.length);
