const html=await (await fetch('https://earthlinedevelopment.org/?m46_refinement_extract='+Date.now())).text();
for(const needle of ['EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781','loadDEM(tile16731.b','loadDEM(tile16781','selected16781','tileBudget','EARTHLINE_COVERAGE_GAP_REFINEMENT_16731']){
  const i=html.indexOf(needle);console.log('\n=== '+needle+' @ '+i+' ===\n');
  if(i>=0)console.log(html.slice(Math.max(0,i-10000),Math.min(html.length,i+18000)));
}
