const url='https://earthlinedevelopment.org/?terrain_phase_inspect='+Date.now();
const r=await fetch(url,{cache:'no-store'}); if(!r.ok)throw new Error('HTTP '+r.status);
const body=await r.text();
const terms=['const landValidityPromise16584','const terrainStarted16198','const openTerrain16198','landValidity16584=await landValidityPromise16584','async function hydrology','function earthlineResolveLandValidity16584','earthlineResolveLandValidity16584','phase16198'];
for(const term of terms){
 let start=0,n=0; while(true){const i=body.indexOf(term,start);if(i<0)break;n++;console.log('EARTHLINE_PHASE_OWNER '+JSON.stringify({term,hit:n,index:i,snippet:body.slice(Math.max(0,i-900),Math.min(body.length,i+5200))}));start=i+term.length;if(n>=4)break;}
}
