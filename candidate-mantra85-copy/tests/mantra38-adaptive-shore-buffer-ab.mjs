import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const NE10='https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ace5fed0eaf3c6c03c951e75b439ba8fffbc218e/geojson/ne_10m_lakes.geojson';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329?.passed===true||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:50000,polling:150});
await page.waitForTimeout(1800);
const live=await page.evaluate(()=>{const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),src=mp?.getSource?.('el-live-flows-15970'),fc=src?._data||src?._options?.data||{features:[]},vd=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{};return {status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim(),flows:(fc.features||[]).filter(f=>f?.properties?.feature_type==='flow').map((f,i)=>({i,feature:f})),pre:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,bounds:vd.bounds||null};});
if(!live.pre?.passed||!/published/i.test(live.status)||!Array.isArray(live.bounds)){console.log('MANTRA38_ADAPTIVE_BUFFER '+JSON.stringify({pass:false,reason:'no-published-run',live}));process.exitCode=1;await browser.close();process.exit();}
const res=await fetch(NE10);const gj=await res.json();
const finite=p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);
const R=6371.0088,rad=x=>x*Math.PI/180,hav=(a,b)=>{const p1=rad(a[1]),p2=rad(b[1]),dp=rad(b[1]-a[1]),dl=rad(b[0]-a[0]),q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));};
const [w,s,e,n]=live.bounds;const gridW=96,gridH=96;const midLat=(s+n)/2;const cellX=hav([w,midLat],[w+(e-w)/(gridW-1),midLat]);const cellY=hav([w,midLat],[w,midLat+(n-s)/(gridH-1)]);const bufferKm=0.5*Math.hypot(cellX,cellY);
function xy(p,lat0=midLat){return [R*rad(p[0])*Math.cos(rad(lat0)),R*rad(p[1])];}
function distSeg(p,a,b){const [px,py]=xy(p),[ax,ay]=xy(a),[bx,by]=xy(b),dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;if(l2<1e-20)return Math.hypot(px-ax,py-ay);let t=((px-ax)*dx+(py-ay)*dy)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));}
function ringBBox(r){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const p of r||[]){if(!finite(p))continue;x0=Math.min(x0,+p[0]);x1=Math.max(x1,+p[0]);y0=Math.min(y0,+p[1]);y1=Math.max(y1,+p[1]);}return [x0,y0,x1,y1];}
const parts=[];const add=rings=>{if(!rings?.[0]?.length)return;const bb=ringBBox(rings[0]);if(bb[2]<w-.25||bb[0]>e+.25||bb[3]<s-.25||bb[1]>n+.25)return;parts.push({rings,bb});};for(const f of gj.features||[]){const g=f?.geometry;if(!g)continue;if(g.type==='Polygon')add(g.coordinates);else if(g.type==='MultiPolygon')for(const p of g.coordinates||[])add(p);}
function shoreDist(p){let best=Infinity;for(const part of parts){const b=part.bb;const latPad=bufferKm/111,lonPad=bufferKm/(111*Math.max(.2,Math.cos(rad(p[1]))));if(p[0]<b[0]-lonPad||p[0]>b[2]+lonPad||p[1]<b[1]-latPad||p[1]>b[3]+latPad)continue;for(const ring of part.rings||[])for(let j=1;j<ring.length;j++){const d=distSeg(p,ring[j-1],ring[j]);if(d<best)best=d;}}return best;}
let dropped=0,clipped=0,unchanged=0;const outputs=[];
for(const {i,feature} of live.flows){const src=feature.geometry?.coordinates||[],out=[];let touched=false;for(const p of src){if(!finite(p))break;const d=shoreDist(p);if(d<=bufferKm){touched=true;break;}out.push(p);}if(out.length<8){dropped++;outputs.push({i,status:'dropped',input:src.length,output:out.length});continue;}if(touched||out.length<src.length){clipped++;outputs.push({i,status:'clipped',input:src.length,output:out.length,minEndShoreKm:Number(shoreDist(out.at(-1)).toFixed(3))});}else{unchanged++;outputs.push({i,status:'unchanged',input:src.length,output:out.length});}}
console.log('MANTRA38_ADAPTIVE_BUFFER '+JSON.stringify({pass:true,bounds:live.bounds,grid:{w:gridW,h:gridH,cellXKm:Number(cellX.toFixed(3)),cellYKm:Number(cellY.toFixed(3)),halfDiagonalBufferKm:Number(bufferKm.toFixed(3))},inputFlows:live.flows.length,unchanged,clipped,dropped,affected:outputs.filter(x=>x.status!=='unchanged')}));
await page.close();await browser.close();
