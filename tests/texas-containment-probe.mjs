import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL='https://earthlinedevelopment.org/?earthline_tx_alignment_probe='+Date.now();
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:900}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const prev=await page.evaluate(()=>window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584?.runToken||null);
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
await page.waitForFunction(prev=>{const f=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return f?.runToken&&f.runToken!==prev&&/screening published\./i.test(s);},prev,{timeout:30000,polling:50});
await page.waitForTimeout(2500);
const result=await page.evaluate(()=>{
  const finite=p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);
  const onSeg=(p,a,b)=>{const x=+p[0],y=+p[1],x1=+a[0],y1=+a[1],x2=+b[0],y2=+b[1],dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy;if(len<1e-20)return Math.hypot(x-x1,y-y1)<1e-10;const cross=(x-x1)*dy-(y-y1)*dx;if(Math.abs(cross)>1e-10)return false;const dot=(x-x1)*dx+(y-y1)*dy;return dot>=0&&dot<=len;};
  const pinRing=(p,ring)=>{if(!finite(p)||!Array.isArray(ring))return false;const x=+p[0],y=+p[1];let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[j],b=ring[i];if(!finite(a)||!finite(b))continue;if(onSeg(p,a,b))return true;const xi=+b[0],yi=+b[1],xj=+a[0],yj=+a[1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside;
  }return inside;};
  const inside=(p,g)=>{if(!g||!finite(p))return false;const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?(g.coordinates||[]):[];for(const rings of polys){if(!rings?.length||!pinRing(p,rings[0]))continue;let hole=false;for(let i=1;i<rings.length;i++)if(pinRing(p,rings[i])){hole=true;break;}if(!hole)return true;}return false;};
  const walkCoords=(geom,fn)=>{if(!geom)return;const walk=v=>{if(finite(v)){fn(v);return;}if(Array.isArray(v))v.forEach(walk);};walk(geom.coordinates);};
  const auditFC=(fc,g)=>{let features=0,coords=0,outside=0;const samples=[];for(const f of fc?.features||[]){features++;walkCoords(f.geometry,p=>{coords++;if(!inside(p,g)){outside++;if(samples.length<10)samples.push([+p[0],+p[1],f.properties?.display_code||f.properties?.feature_type||null]);}});}return {features,coords,outside,samples};};
  const rect=o=>o?{left:o.left,top:o.top,right:o.right,bottom:o.bottom,width:o.width,height:o.height}:null;
  const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null,g=pkg?.boundary?.geometry||null,visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,m=window.earthlineMap||null;
  const mapEl=m?.getContainer?.()||document.getElementById('mapboxBase'),host=document.querySelector('.map-area')||document.getElementById('mapboxBase'),overlay=document.getElementById('earthlineRegionalVectorOverlay16020');
  const mapRect=mapEl?.getBoundingClientRect?.(),hostRect=host?.getBoundingClientRect?.(),overlayRect=overlay?.getBoundingClientRect?.();
  const vb=overlay?.viewBox?.baseVal?{x:overlay.viewBox.baseVal.x,y:overlay.viewBox.baseVal.y,width:overlay.viewBox.baseVal.width,height:overlay.viewBox.baseVal.height}:null;
  const sampleCoord=visual?.swales?.features?.[0]?.geometry?.coordinates?.[0]||null;
  let projection=null;
  if(sampleCoord&&m&&mapRect&&overlayRect&&vb){const p=m.project(sampleCoord),sx=overlayRect.width/Math.max(1,vb.width),sy=overlayRect.height/Math.max(1,vb.height);projection={coord:sampleCoord,mapProject:{x:p.x,y:p.y},mapPage:{x:mapRect.left+p.x,y:mapRect.top+p.y},svgPage:{x:overlayRect.left+(p.x-vb.x)*sx,y:overlayRect.top+(p.y-vb.y)*sy},pageDelta:{x:overlayRect.left+(p.x-vb.x)*sx-(mapRect.left+p.x),y:overlayRect.top+(p.y-vb.y)*sy-(mapRect.top+p.y)},scale:{x:sx,y:sy}};}
  return {packageId:pkg?.profileId||null,boundaryAudit:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,containment:{swales:auditFC(visual?.swales,g),flows:auditFC(visual?.flows,g),contours:auditFC(visual?.contours,g)},geometry:{mapRect:rect(mapRect),hostRect:rect(hostRect),overlayRect:rect(overlayRect),viewBox:vb,projection},displayAudit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')};
});
result.errors=errors;
console.log('EARTHLINE_TX_ALIGNMENT_PROBE '+JSON.stringify(result));
writeFileSync('texas-containment-probe.json',JSON.stringify(result,null,2));
await page.screenshot({path:'texas-containment-probe.png',fullPage:true});
await browser.close();
const d=result.geometry?.projection?.pageDelta||{};
if(result.packageId!=='us-tx'||result.containment.swales.outside||result.containment.flows.outside||result.containment.contours.outside||Math.abs(Number(d.x||0))>1||Math.abs(Number(d.y||0))>1)process.exitCode=1;
