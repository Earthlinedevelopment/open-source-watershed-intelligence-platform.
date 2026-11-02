import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
let final=null;

async function attempt(n){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{ if(m.type()==='error') errors.push(m.text()); });
  try{
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value='New York';
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      b.click();
    });
    await page.waitForFunction(()=>{
      const p=window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329;
      const e=window.EARTHLINE_LAST_ERROR_15970||window.EARTHLINE_LAST_ERROR;
      return p?.passed===true || !!e;
    },null,{timeout:45000,polling:150});
    try{await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_CONTEXT_16198,null,{timeout:12000,polling:150});}catch(_){ }
    await page.waitForTimeout(1000);

    const result=await page.evaluate(()=>{
      const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const flowId='el-live-flows-15970';
      const source=mp?.getSource?.(flowId);
      const fc=source?._data||source?._options?.data||{type:'FeatureCollection',features:[]};
      const all=Array.isArray(fc?.features)?fc.features:[];
      const flowFeatures=all.filter(f=>f?.geometry&&(f.geometry.type==='LineString'||f.geometry.type==='MultiLineString')&&(!f.properties?.feature_type||f.properties.feature_type==='flow'));
      const lv=window.EARTHLINE_LAND_VALIDITY_16584||null;
      const waterParts=Array.isArray(lv?.waterParts)?lv.waterParts:[];

      function finite(p){return Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);}
      function onSeg(p,a,b){const x=+p[0],y=+p[1],x1=+a[0],y1=+a[1],x2=+b[0],y2=+b[1],dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy;if(len<1e-20)return Math.hypot(x-x1,y-y1)<1e-10;const cross=(x-x1)*dy-(y-y1)*dx;if(Math.abs(cross)>1e-10)return false;const dot=(x-x1)*dx+(y-y1)*dy;return dot>=0&&dot<=len;}
      function inRing(p,ring){if(!finite(p)||!Array.isArray(ring)||ring.length<3)return false;const x=+p[0],y=+p[1];let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i];if(!finite(a)||!finite(b))continue;if(onSeg(p,a,b))return true;const xi=+b[0],yi=+b[1],xj=+a[0],yj=+a[1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside;}return inside;}
      function inPart(p,part){const rings=part?.rings;if(!Array.isArray(rings)||!rings.length)return false;const b=part?.bbox;if(Array.isArray(b)&&b.length===4&&(p[0]<b[0]||p[0]>b[2]||p[1]<b[1]||p[1]>b[3]))return false;if(!inRing(p,rings[0]))return false;for(let i=1;i<rings.length;i++)if(inRing(p,rings[i]))return false;return true;}
      function inMappedWater(p){for(let wi=0;wi<waterParts.length;wi++)if(inPart(p,waterParts[wi]))return wi;return -1;}

      let vertices=0,segments=0,samples=0,waterHits=0;
      const examples=[];
      const lines=[];
      for(const f of flowFeatures){const g=f.geometry;if(g.type==='LineString')lines.push({coords:g.coordinates,props:f.properties||{}});else for(const c of (g.coordinates||[]))lines.push({coords:c,props:f.properties||{}});}
      for(let li=0;li<lines.length;li++){
        const pts=(lines[li].coords||[]).filter(finite);
        for(let pi=0;pi<pts.length;pi++){
          vertices++;
          const wi=inMappedWater(pts[pi]);
          if(wi>=0){waterHits++;if(examples.length<12)examples.push({kind:'vertex',line:li,point:pi,coord:pts[pi],waterPart:wi});}
          if(pi===0)continue;
          segments++;
          const a=pts[pi-1],b=pts[pi];
          const span=Math.max(Math.abs(+b[0]-+a[0]),Math.abs(+b[1]-+a[1]));
          const steps=Math.max(1,Math.ceil(span/.002));
          for(let k=1;k<steps;k++){
            samples++;
            const p=[+a[0]+(+b[0]-+a[0])*k/steps,+a[1]+(+b[1]-+a[1])*k/steps];
            const wi2=inMappedWater(p);
            if(wi2>=0){waterHits++;if(examples.length<12)examples.push({kind:'segment',line:li,segment:pi,coord:p,waterPart:wi2});break;}
          }
        }
      }
      let rendered=0;try{rendered=mp.queryRenderedFeatures(undefined,{layers:['el-live-flow-line-15970']}).length}catch(_){}
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().replace(/\s+/g,' ');
      const lastError=window.EARTHLINE_LAST_ERROR_15970||window.EARTHLINE_LAST_ERROR||null;
      return {
        flowId,
        featureCount:flowFeatures.length,
        lineCount:lines.length,
        vertices,segments,samples,waterHits,examples,
        waterParts:waterParts.length,
        rendered,
        status,
        lastError:lastError?String(lastError&&lastError.message||lastError):null,
        preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,
        builtin:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
        landValidity:lv?{landFeatures:lv.landFeatureCount,waterFeatures:lv.waterFeatureCount,invalidCells:lv.invalidCells}:null
      };
    });
    const failed=/ANALYSIS FAILED/i.test(result.status)||!!result.lastError;
    const corePublished=result.preflight?.passed===true&&result.featureCount>0&&result.lineCount>0;
    const pass=corePublished&&!failed&&result.waterParts>0&&result.waterHits===0;
    return {attempt:n,pass,corePublished,failed,result,errors:errors.slice(0,20)};
  }catch(error){return {attempt:n,pass:false,error:String(error&&error.stack||error),errors:errors.slice(0,20)};}
  finally{await page.close();}
}

const attempts=[];
for(let i=1;i<=3;i++){
  const r=await attempt(i);attempts.push(r);
  if(r.pass){final=r;break;}
}
const pass=!!final;
console.log('MANTRA38_NY_LAKE_FLOW '+JSON.stringify({pass,winner:final,attempts}));
if(!pass)process.exitCode=1;
await browser.close();
