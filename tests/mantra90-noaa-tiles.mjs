const root='https://www.ncei.noaa.gov/pub/data/nidis/tile/nasa-gws-0.25d/';
const urls=[
  'tilemapresource.xml','info.json','1/0/0.png','1/0/1.png',
  '2/1/1.png','2/1/2.png','2/2/1.png','2/2/2.png',
  '2/0/3.png','2/1/3.png','2/2/3.png','2/3/3.png',
  '3/1/3.png','3/2/3.png','3/2/4.png','3/3/4.png'
];
for(const u of urls){
  try{
    const resp=await fetch(root+u,{signal:AbortSignal.timeout(12000)});
    const ct=resp.headers.get('content-type')||'';
    const txt=/xml|json|html|text/.test(ct)?(await resp.text()).slice(0,3000):'';
    console.log('M90_NOAA '+JSON.stringify({path:u,status:resp.status,contentType:ct,bytes:resp.headers.get('content-length'),body:txt}));
  }catch(e){console.log('M90_NOAA '+JSON.stringify({path:u,error:String(e)}));}
}
