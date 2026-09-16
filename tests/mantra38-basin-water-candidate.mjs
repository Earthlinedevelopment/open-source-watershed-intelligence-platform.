import { chromium } from 'playwright';

const URL='http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
let pass=false,last=null;
for(let attempt=1;attempt<=3&&!pass;attempt++){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
    await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329?.passed===true||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:55000,polling:150});
    await page.waitForTimeout(3500);
    last=await page.evaluate(()=>{
      const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),lv=window.EARTHLINE_LAND_VALIDITY_16584||null;
      const parts=Array.isArray(lv?.waterParts)?lv.waterParts:[];
      const finite=p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);
      const onSeg=(p,a,b)=>{const x=+p[0],y=+p[1],x1=+a[0],y1=+a[1],x2=+b[0],y2=+b[1],dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy;if(l<1e-20)return Math.hypot(x-x1,y-y1)<1e-10;const c=(x-x1)*dy-(y-y1)*dx;if(Math.abs(c)>1e-10)return false;const d=(x-x1)*dx+(y-y1)*dy;return d>=0&&d<=l;};
      const inRing=(p,r)=>{if(!finite(p)||!Array.isArray(r)||r.length<3)return false;const x=+p[0],y=+p[1];let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[j],b=r[i];if(!finite(a)||!finite(b))continue;if(onSeg(p,a,b))return true;const xi=+b[0],yi=+b[1],xj=+a[0],yj=+a[1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside;}return inside;};
      const inPart=(p,part)=>{if(!part?.rings?.length)return false;const b=part.bbox;if(b&&(p[0]<b[0]||p[0]>b[2]||p[1]<b[1]||p[1]>b[3]))return false;if(!inRing(p,part.rings[0]))return false;for(let i=1;i<part.rings.length;i++)if(inRing(p,part.rings[i]))return false;return true;};
      const src=mp?.getSource?.('el-live-basin-15970');const fc=src?._data||src?._options?.data||{type:'FeatureCollection',features:[]};
      let lineFeatures=0,samples=0,waterHits=0;
      const lines=[];for(const f of (fc.features||[])){const g=f?.geometry;if(!g)continue;if(g.type==='LineString')lines.push(g.coordinates||[]);else if(g.type==='MultiLineString')lines.push(...(g.coordinates||[]));}
      lineFeatures=lines.length;
      for(const line of lines)for(const p of line){if(!finite(p))continue;samples++;for(const part of parts){if(inPart(p,part)){waterHits++;break;}}}
      const flow=mp?.getSource?.('el-live-flows-15970');const flowfc=flow?._data||flow?._options?.data||{features:[]};
      const audit=window.EARTHLINE_BASIN_WATER_DISPLAY_AUDIT_MANTRA38||null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim();
      return {audit,lineFeatures,samples,waterHits,flowFeatures:(flowfc.features||[]).length,status,preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,errors:[]};
    });
    last.errors=errors.slice(0,20);
    pass=!!last.audit&&last.lineFeatures>0&&last.samples>0&&last.waterHits===0&&last.flowFeatures>0&&last.preflight?.passed===true;
  }catch(e){last={attempt,error:String(e),errors};}
  await page.close();
}
console.log('MANTRA38_BASIN_CANDIDATE '+JSON.stringify({pass,last}));
await browser.close();
if(!pass)process.exitCode=1;
