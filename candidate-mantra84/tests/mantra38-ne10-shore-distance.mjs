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
const live=await page.evaluate(()=>{const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),src=mp?.getSource?.('el-live-flows-15970'),fc=src?._data||src?._options?.data||{features:[]};return {status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim(),flows:(fc.features||[]).filter(f=>f?.properties?.feature_type==='flow').map((f,i)=>({i,coords:f.geometry?.coordinates||[]})),pre:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null};});
if(!live.pre?.passed||!/published/i.test(live.status)){console.log('MANTRA38_NE10_DISTANCE '+JSON.stringify({pass:false,reason:'no-published-run',live}));process.exitCode=1;await browser.close();process.exit();}
const res=await fetch(NE10);const gj=await res.json();const ont=(gj.features||[]).find(f=>/lake ontario/i.test(String(f?.properties?.name||f?.properties?.name_en||'')));if(!ont)throw new Error('Lake Ontario missing');
const rings=ont.geometry.type==='Polygon'?ont.geometry.coordinates:(ont.geometry.coordinates||[]).flat();
const outer=ont.geometry.type==='Polygon'?ont.geometry.coordinates[0]:(ont.geometry.coordinates||[])[0]?.[0];
const R=6371.0088;
const rad=x=>x*Math.PI/180;
function xy(p,lat0=43.5){return [R*rad(p[0])*Math.cos(rad(lat0)),R*rad(p[1])];}
function distPointSegKm(p,a,b){const [px,py]=xy(p),[ax,ay]=xy(a),[bx,by]=xy(b);const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;if(l2===0)return Math.hypot(px-ax,py-ay);let t=((px-ax)*dx+(py-ay)*dy)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));}
const candidates=live.flows.filter(f=>(f.coords||[]).some(p=>p[1]>=43.1&&p[1]<=43.7&&p[0]>=-79.3&&p[0]<=-76.0));
const out=[];
for(const f of candidates){let best={km:Infinity,coord:null,shore:null};for(const p of f.coords||[]){if(p[1]<42.8||p[1]>44.2||p[0]<-80.2||p[0]>-75.0)continue;for(let j=1;j<outer.length;j++){const d=distPointSegKm(p,outer[j-1],outer[j]);if(d<best.km)best={km:d,coord:p,shore:[outer[j-1],outer[j]]};}}out.push({flowIndex:f.i,minKm:Number(best.km.toFixed(3)),coord:best.coord,shore:best.shore});}
out.sort((a,b)=>a.minKm-b.minKm);
console.log('MANTRA38_NE10_DISTANCE '+JSON.stringify({flowCount:live.flows.length,northCandidateCount:candidates.length,nearest:out.slice(0,20)}));
await page.close();await browser.close();
