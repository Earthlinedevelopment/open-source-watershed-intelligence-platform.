const url='https://earthlinedevelopment.org/?terrain_owner_inspect='+Date.now();
const r=await fetch(url,{cache:'no-store'});
if(!r.ok)throw new Error('HTTP '+r.status);
const body=await r.text();
const terms=['async function loadDEM','function loadDEM','TERRARIUM','fetchImageData','Open Terrarium','terrain-rgb','elevation-tiles','primaryUrl','alternateUrl'];
for(const term of terms){
  let start=0,n=0;
  while(true){
    const i=body.indexOf(term,start); if(i<0)break;
    n++;
    console.log('EARTHLINE_TERRAIN_OWNER '+JSON.stringify({term,hit:n,index:i,snippet:body.slice(Math.max(0,i-1200),Math.min(body.length,i+4200))}));
    start=i+term.length;
    if(n>=5)break;
  }
}
console.log('EARTHLINE_TERRAIN_OWNER_SIZE '+body.length);
