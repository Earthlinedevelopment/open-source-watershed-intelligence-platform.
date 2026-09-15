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
const live=await page.evaluate(()=>{const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),src=mp?.getSource?.('el-live-flows-15970'),fc=src?._data||src?._options?.data||{features:[]};return {status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim(),flows:(fc.features||[]).filter(f=>f?.properties?.feature_type==='flow').map(f=>f.geometry?.coordinates||[]),pre:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null};});
if(!live.pre?.passed||!/published/i.test(live.status)){console.log('MANTRA38_NE10_AB '+JSON.stringify({pass:false,reason:'no-published-run',live}));process.exitCode=1;await page.close();await browser.close();process.exit();}
const t0=Date.now();const res=await fetch(NE10);const text=await res.text();const fetchMs=Date.now()-t0;if(!res.ok)throw new Error('NE10 HTTP '+res.status);const gj=JSON.parse(text);
const finite=p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);
function bboxRing(r){let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;for(const p of r||[]){if(!finite(p))continue;a=Math.min(a,+p[0]);c=Math.max(c,+p[0]);b=Math.min(b,+p[1]);d=Math.max(d,+p[1]);}return [a,b,c,d];}
function onSeg(p,a,b){const x=+p[0],y=+p[1],x1=+a[0],y1=+a[1],x2=+b[0],y2=+b[1],dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy;if(len<1e-20)return Math.hypot(x-x1,y-y1)<1e-10;const cross=(x-x1)*dy-(y-y1)*dx;if(Math.abs(cross)>1e-10)return false;const dot=(x-x1)*dx+(y-y1)*dy;return dot>=0&&dot<=len;}
function inRing(p,r){if(!finite(p)||!Array.isArray(r)||r.length<3)return false;const x=+p[0],y=+p[1];let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[j],b=r[i];if(!finite(a)||!finite(b))continue;if(onSeg(p,a,b))return true;const xi=+b[0],yi=+b[1],xj=+a[0],yj=+a[1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside;}return inside;}
const parts=[];const add=rings=>{if(!rings?.[0]?.length)return;const bb=bboxRing(rings[0]);if(!bb.every(Number.isFinite))return;if(bb[2]<-80||bb[0]>-71||bb[3]<40||bb[1]>46)return;parts.push({rings,bb});};
for(const f of gj.features||[]){const g=f?.geometry;if(!g)continue;if(g.type==='Polygon')add(g.coordinates);else if(g.type==='MultiPolygon')for(const p of g.coordinates||[])add(p);}
function inPart(p,part){const b=part.bb;if(p[0]<b[0]||p[0]>b[2]||p[1]<b[1]||p[1]>b[3])return false;if(!inRing(p,part.rings[0]))return false;for(let i=1;i<part.rings.length;i++)if(inRing(p,part.rings[i]))return false;return true;}
function waterHit(p){for(let i=0;i<parts.length;i++)if(inPart(p,parts[i]))return i;return -1;}
let hitLines=0,hitSamples=0;const examples=[];
for(let li=0;li<live.flows.length;li++){const pts=(live.flows[li]||[]).filter(finite);let lineHit=false;for(let i=0;i<pts.length;i++){if(waterHit(pts[i])>=0){lineHit=true;hitSamples++;if(examples.length<20)examples.push({kind:'vertex',line:li,i,coord:pts[i]});break;}if(i===0)continue;const a=pts[i-1],b=pts[i],span=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1])),steps=Math.max(1,Math.ceil(span/.001));for(let k=1;k<steps;k++){const p=[a[0]+(b[0]-a[0])*k/steps,a[1]+(b[1]-a[1])*k/steps];if(waterHit(p)>=0){lineHit=true;hitSamples++;if(examples.length<20)examples.push({kind:'segment',line:li,i,coord:p});break;}}if(lineHit)break;}if(lineHit)hitLines++;}
const ontario=(gj.features||[]).filter(f=>/ontario/i.test(String(f?.properties?.name||f?.properties?.name_en||''))).map(f=>({name:f.properties?.name||f.properties?.name_en,geom:f.geometry?.type}));
const result={pass:hitLines>0,fetchMs,bytes:text.length,features:(gj.features||[]).length,regionalParts:parts.length,flowCount:live.flows.length,hitLines,hitSamples,examples,ontario:ontario.slice(0,10)};
console.log('MANTRA38_NE10_AB '+JSON.stringify(result));
if(!result.pass)process.exitCode=1;
await page.close();await browser.close();
