const r=await fetch('https://earthlinedevelopment.org/?selection_extract='+Date.now());
const body=await r.text();
for(const term of ['preferredEligibleCount16539','const chosen','chosen.length','Fail visibly rather than silently','minSlope=relaxed?.05:.20']){
  const i=body.indexOf(term);
  console.log('\n=== '+term+' @ '+i+' ===');
  if(i>=0) console.log(body.slice(Math.max(0,i-3500),Math.min(body.length,i+7000)));
}
