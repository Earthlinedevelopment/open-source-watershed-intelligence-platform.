import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const NE10='https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ace5fed0eaf3c6c03c951e75b439ba8fffbc218e/geojson/ne_10m_lakes.geojson';
const browser=await chromium.launch({headless:true});
let final=null;
for(let attempt=1;attempt<=4&&!final;attempt++){
 const page=await browser.newPage({viewport:{width:1800,height:1000}});
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});
 await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 try{await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329?.passed===true||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:50000,polling:150});}catch(_){}
 await page.waitForTimeout(1600);
 const live=await page.evaluate(()=>{const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),src=mp?.getSource?.('el-live-flows-15970'),fc=src?._data||src?._options?.data||{features:[]},vd=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{};return {status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim(),flows:(fc.features||[]).filter(f=>f?.properties?.feature_type==='flow').map(f=>f.geometry?.coordinates||[]),pre:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,bounds:vd.bounds||null,styleIndex:window.EARTHLINE_STYLE_WATER_INDEX_16584||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null};});
 if(live.pre?.passed&&/published/i.test(live.status)&&live.flows.length&&Array.isArray(live.bounds)){final={page,live,attempt};break;} await page.close();
}
if(!final){console.error('MANTRA38_DEPLOYED_SHORE '+JSON.stringify({pass:false,reason:'no-published-run'}));process.exitCode=1;await browser.close();process.exit();}
const {page,live,attempt}=final;const gj=await (await fetch(NE10)).json();const [w,s,e,n]=live.bounds,R=6371.0088,rad=x=>x*Math.PI/180,mid=(s+n)/2,gridW=96,gridH=96;
const hav=(a,b)=>{const p1=rad(a[1]),p2=rad(b[1]),dp=rad(b[1]-a[1]),dl=rad(b[0]-a[0]),q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));};
const buffer=.5*Math.hypot(hav([w,mid],[w+(e-w)/(gridW-1),mid]),hav([w,mid],[w,mid+(n-s)/(gridH-1)]));
const finite=p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);
const xy=p=>[R*rad(p[0])*Math.cos(rad(p[1])),R*rad(p[1])];
const dist=(p,a,b)=>{const P=xy(p),A=xy(a),B=xy(b),dx=B[0]-A[0],dy=B[1]-A[1],l2=dx*dx+dy*dy;if(l2<1e-20)return Math.hypot(P[0]-A[0],P[1]-A[1]);let t=((P[0]-A[0])*dx+(P[1]-A[1])*dy)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(P[0]-(A[0]+t*dx),P[1]-(A[1]+t*dy));};
const bb=r=>{let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const p of r||[]){if(!finite(p))continue;x0=Math.min(x0,+p[0]);x1=Math.max(x1,+p[0]);y0=Math.min(y0,+p[1]);y1=Math.max(y1,+p[1]);}return [x0,y0,x1,y1];};
const parts=[];const add=rings=>{if(!rings?.[0]?.length)return;const b=bb(rings[0]);if(b[2]<w-.25||b[0]>e+.25||b[3]<s-.25||b[1]>n+.25)return;parts.push({rings,b});};for(const f of gj.features||[]){const g=f?.geometry;if(!g)continue;if(g.type==='Polygon')add(g.coordinates);else if(g.type==='MultiPolygon')for(const p of g.coordinates||[])add(p);}
const shore=p=>{let best=Infinity;const latPad=buffer/111,lonPad=buffer/(111*Math.max(.15,Math.cos(rad(p[1]))));for(const part of parts){const b=part.b;if(p[0]<b[0]-lonPad||p[0]>b[2]+lonPad||p[1]<b[1]-latPad||p[1]>b[3]+latPad)continue;for(const ring of part.rings||[])for(let j=1;j<ring.length;j++)best=Math.min(best,dist(p,ring[j-1],ring[j]));}return best;};
let violations=0;const examples=[];for(let li=0;li<live.flows.length;li++){const pts=(live.flows[li]||[]).filter(finite);for(let i=0;i<pts.length;i++){if(shore(pts[i])<=buffer){violations++;if(examples.length<12)examples.push({kind:'vertex',line:li,i,coord:pts[i],km:shore(pts[i])});break;}if(i===0)continue;const a=pts[i-1],b=pts[i],len=hav(a,b),steps=Math.max(2,Math.ceil(len/Math.max(.5,buffer/2)));let hit=false;for(let k=1;k<steps;k++){const p=[a[0]+(b[0]-a[0])*k/steps,a[1]+(b[1]-a[1])*k/steps];const d=shore(p);if(d<=buffer){violations++;hit=true;if(examples.length<12)examples.push({kind:'segment',line:li,i,coord:p,km:d});break;}}if(hit)break;}}
const pass=violations===0&&live.styleIndex?.shoreBufferRule==='half-local-DEM-cell-diagonal'&&live.styleIndex?.shorelineEvidence==='Natural Earth 1:10m lakes';
console.log('MANTRA38_DEPLOYED_SHORE '+JSON.stringify({pass,attempt,flowCount:live.flows.length,bufferKm:Number(buffer.toFixed(3)),violations,examples,styleIndex:live.styleIndex,totalMs:live.perf?.totalMs??null}));
if(!pass)process.exitCode=1;await page.close();await browser.close();
