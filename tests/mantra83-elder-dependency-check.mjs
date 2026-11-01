const urls=[
'https://cdn.jsdelivr.net/npm/geotiff@3.0.5/+esm',
'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/pyodide.mjs',
'https://earthlinedevelopment.org/earthline-elder-worker-17129.js'
];
for(const url of urls){
 try{
  const r=await fetch(url,{redirect:'follow'});
  const t=await r.text();
  console.log('M83_ELDER_DEP '+JSON.stringify({url,status:r.status,type:r.headers.get('content-type'),len:t.length,head:t.slice(0,160)}));
 }catch(e){console.log('M83_ELDER_DEP '+JSON.stringify({url,error:String(e)}));}
}
