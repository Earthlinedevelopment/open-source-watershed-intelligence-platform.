import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

async function attempt(number){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  try{await page.waitForFunction(()=>{
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    return !!window.EARTHLINE_REGIONAL_CONTEXT_16198||/ANALYSIS FAILED/i.test(status)||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
  },null,{timeout:42000,polling:150});}catch(_){ }
  await page.waitForTimeout(600);
  const result=await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null;
    const boundary=pkg?.boundary?.geometry||null;
    function finite(p){return Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);}
    function onSeg(p,a,b){const x=+p[0],y=+p[1],x1=+a[0],y1=+a[1],x2=+b[0],y2=+b[1],dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy;if(len<1e-20)return Math.hypot(x-x1,y-y1)<1e-9;const cross=(x-x1)*dy-(y-y1)*dx;if(Math.abs(cross)>1e-8)return false;const dot=(x-x1)*dx+(y-y1)*dy;return dot>=0&&dot<=len;}
    function inRing(p,ring){if(!finite(p)||!Array.isArray(ring)||ring.length<3)return false;const x=+p[0],y=+p[1];let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i];if(!finite(a)||!finite(b))continue;if(onSeg(p,a,b))return true;const xi=+b[0],yi=+b[1],xj=+a[0],yj=+a[1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside;}return inside;}
    function inside(p,g){if(!g)return false;const polys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];for(const rings of polys){if(!rings?.length||!inRing(p,rings[0]))continue;let hole=false;for(let i=1;i<rings.length;i++){if(inRing(p,rings[i])){hole=true;break;}}if(!hole)return true;}return false;}
    function sourceData(id){const s=mp?.getSource?.(id);return s?._data||s?._options?.data||{type:'FeatureCollection',features:[]};}
    function audit(id){const fc=sourceData(id),features=Array.isArray(fc?.features)?fc.features:[];let vertices=0,outside=0,segments=0,outsideSamples=0;const examples=[];for(const [fi,f] of features.entries()){const g=f?.geometry;if(!g)continue;const polys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];for(const rings of polys)for(const ring of (rings||[])){const pts=(ring||[]).filter(finite);for(const p of pts){vertices++;if(!inside(p,boundary)){outside++;if(examples.length<8)examples.push({fi,p});}}for(let i=1;i<pts.length;i++){segments++;const a=pts[i-1],b=pts[i],steps=Math.max(1,Math.ceil(Math.max(Math.abs(+b[0]-+a[0]),Math.abs(+b[1]-+a[1]))/.02));for(let k=1;k<steps;k++){const p=[+a[0]+(+b[0]-+a[0])*k/steps,+a[1]+(+b[1]-+a[1])*k/steps];if(!inside(p,boundary)){outsideSamples++;if(examples.length<8)examples.push({fi,p,segment:i});break;}}}}}return {id,features:features.length,vertices,outsideVertices:outside,segments,outsideSegmentSamples:outsideSamples,contained:outside===0&&outsideSamples===0,examples};}
    const aquifer=audit('el-live-aquifer-15970'),basin=audit('el-live-basin-15970');
    const rendered={};for(const id of ['el-live-aquifer-fill-15970','el-live-basin-fill-15970']){try{rendered[id]=mp.queryRenderedFeatures(undefined,{layers:[id]}).length}catch(e){rendered[id]=String(e)}}
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().replace(/\s+/g,' ').slice(0,900);
    return {package:{profileId:pkg?.profileId||null,label:pkg?.boundary?.label||null,code:pkg?.boundary?.code||null,appliedAtomically:pkg?.appliedAtomically===true},aquifer,basin,builtin:window.EARTHLINE_OPTIONAL_CONTEXT_CONTAINMENT_16565||null,context:window.EARTHLINE_REGIONAL_CONTEXT_16198||null,preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,rendered,status,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  });
  const builtin=result.builtin||{};
  const hasBothAudits=!!builtin['hydrobasins-temporary-mirror']&&!!builtin['usgs-karst-regional-context'];
  const corePublished=!!result.preflight?.passed&&!/ANALYSIS FAILED/i.test(result.status)&&!result.lastError;
  const contextCompleted=!!result.context&&hasBothAudits;
  const pass=corePublished&&contextCompleted&&result.package.appliedAtomically&&result.aquifer.contained&&result.basin.contained;
  await page.close();
  return {attempt:number,pass,corePublished,contextCompleted,result,errors:errors.slice(0,20)};
}

const attempts=[];let winner=null;
for(let i=1;i<=3;i++){const r=await attempt(i);attempts.push(r);if(r.pass){winner=r;break;}}
console.log('MANTRA38_NY_CONTEXT_CONTAINMENT '+JSON.stringify({pass:!!winner,winner,attempts}));
if(!winner)process.exitCode=1;
await browser.close();
