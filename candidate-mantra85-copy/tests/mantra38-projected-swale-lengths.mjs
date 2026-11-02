import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

async function run(query){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{
    const base=window.earthlineRenderRegionalOverlay16020;
    if(typeof base!=='function') throw new Error('regional renderer unavailable');
    if(base.__m38Lengths)return;
    const wrapped=function(data){
      try{
        const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
        const host=document.querySelector('.map-area')||document.getElementById('mapboxBase');
        const w=Math.max(1,host?.clientWidth||window.innerWidth),h=Math.max(1,host?.clientHeight||window.innerHeight);
        const rows=[];
        for(const [idx,f] of (data?.swales?.features||[]).entries()){
          if(!f?.geometry||f.geometry.type!=='LineString')continue;
          const pts=[];
          for(const ll of (f.geometry.coordinates||[])){
            try{
              const p=map.project({lng:Number(ll[0]),lat:Number(ll[1])});
              if(Number.isFinite(p.x)&&Number.isFinite(p.y)){
                const q=pts.at(-1); if(!q||Math.hypot(q.x-p.x,q.y-p.y)>.35)pts.push({x:p.x,y:p.y});
              }
            }catch(_){}
          }
          let len=0; for(let i=1;i<pts.length;i++)len+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);
          const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
          const bbox=pts.length?{minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)}:null;
          const anyOnscreen=pts.some(p=>p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h);
          const bboxIntersects=!!bbox&&bbox.maxX>=0&&bbox.minX<=w&&bbox.maxY>=0&&bbox.minY<=h;
          rows.push({idx,grade:String(f.properties?.grade||''),rank:Number(f.properties?.rank||0),pointCount:pts.length,len:Number(len.toFixed(3)),anyOnscreen,bboxIntersects,bbox});
        }
        const lengths=rows.map(r=>r.len).filter(Number.isFinite).sort((a,b)=>a-b);
        const mapCenter=map?.getCenter?.();
        window.MANTRA38_LENGTH_PROBE={
          count:rows.length,
          lt22:rows.filter(r=>r.len<22).length,
          ge22:rows.filter(r=>r.len>=22).length,
          onScreen:rows.filter(r=>r.anyOnscreen).length,
          bboxIntersects:rows.filter(r=>r.bboxIntersects).length,
          min:lengths[0]??null,
          median:lengths.length?lengths[Math.floor(lengths.length/2)]:null,
          max:lengths.at(-1)??null,
          zoom:Number(map?.getZoom?.()||0),
          center:mapCenter?{lng:Number(mapCenter.lng),lat:Number(mapCenter.lat)}:null,
          host:{w,h},
          dataBounds:data?.bounds||null,
          rows
        };
      }catch(e){window.MANTRA38_LENGTH_PROBE={error:String(e)}}
      return base.apply(this,arguments);
    };
    wrapped.__m38Lengths=true; wrapped.__base=base;
    window.earthlineRenderRegionalOverlay16020=wrapped;
  });
  await page.evaluate(q=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); b.click();
  },query);
  await page.waitForTimeout(14000);
  const result=await page.evaluate(()=>({
    probe:window.MANTRA38_LENGTH_PROBE||null,
    audit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    visualCount:Number(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features?.length||0),
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().replace(/\s+/g,' ').slice(0,1000),
    runError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    mapZoom:Number((window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null))?.getZoom?.()||0)
  }));
  await page.close();
  return {query,result,errors:errors.slice(0,20)};
}

const vt=await run('Vermont');
const ny=await run('New York');
console.log('MANTRA38_LENGTHS '+JSON.stringify({vt,ny}));
await browser.close();
