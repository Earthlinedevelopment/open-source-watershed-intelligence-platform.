const html=await (await fetch('https://earthlinedevelopment.org/?m47_16823='+Date.now(),{cache:'no-store'})).text();
const needles=['preferred16767','binsX16731','parentN16783','selectionStopReason','attainableTargetCells','candidateCoverageCells','donorParent16789','pk16783','used16780>=3'];
for(const needle of needles){
  console.log('\n===== '+needle+' =====');
  let from=0,n=0;
  while(true){
    const i=html.indexOf(needle,from);if(i<0)break;n++;
    console.log('\n-- occurrence '+n+' @ '+i+' --\n'+html.slice(Math.max(0,i-1200),Math.min(html.length,i+2200)));
    from=i+needle.length;
    if(n>=8)break;
  }
  if(!n)console.log('NOT FOUND');
}
console.log('\nHTML_BYTES '+html.length);
