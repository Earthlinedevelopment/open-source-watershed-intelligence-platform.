import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL='https://earthlinedevelopment.org/?earthline_tx_containment_probe='+Date.now();
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
  const pinRing=(p,ring)=>{if(!finite(p)||!Array.isArray(ring))return false;const x=+p[0],y=+p[1];let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[j],b=ring[i];if(!finite(a)||!finite(b))continue;const xi=+b[0],yi=+b[1],xj=+a[0],yj=+a[1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside;
  }return inside;};
  const inside=(p,g)=>{if(!g||!finite(p))return false;const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?(g.coordinates||[]):[];for(const rings of polys){if(!rings?.length||!pinRing(p,rings[0]))continue;let hole=false;for(let i=1;i<rings.length;i++)if(pinRing(p,rings[i])){hole=true;break;}if(!hole)return true;}return false;};
  const walkCoords=(geom,fn)=>{if(!geom)return;const walk=v=>{if(finite(v)){fn(v);return;}if(Array.isArray(v))v.forEach(walk);};walk(geom.coordinates);};
  const auditFC=(fc,g)=>{let features=0,coords=0,outside=0;const samples=[];let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const f of fc?.features||[]){features++;walkCoords(f.geometry,p=>{coords++;const x=+p[0],y=+p[1];minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);if(!inside(p,g)){outside++;if(samples.length<12)samples.push([x,y,f.properties?.display_code||f.properties?.label||f.properties?.feature_type||null]);}});}return {features,coords,outside,samples,bbox:Number.isFinite(minX)?[minX,minY,maxX,maxY]:null};};
  const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null,g=pkg?.boundary?.geometry||null,visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,m=window.earthlineMap||null;
  const sourceData=id=>{try{const s=m?.getSource?.(id);const d=s?._data||s?.serialize?.()?.data||null;return typeof d==='object'?d:null;}catch(_){return null;}};
  const labelFeatures=[...document.querySelectorAll('.earthline-swale-label-16149')].map(el=>el.__earthlineFeature).filter(Boolean);
  return {
    loc:(typeof M!=='undefined'&&M?.loc)?JSON.parse(JSON.stringify(M.loc)):null,
    package:pkg?{profileId:pkg.profileId,identity:pkg.identity,extent:pkg.regionalExtent,boundary:{label:pkg.boundary?.label,code:pkg.boundary?.code,source:pkg.boundary?.source}}:null,
    boundaryAudit:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    optionalAudit:window.EARTHLINE_OPTIONAL_CONTEXT_CONTAINMENT_16565||null,
    visual:{swales:auditFC(visual?.swales,g),flows:auditFC(visual?.flows,g),contours:auditFC(visual?.contours,g)},
    mapSources:{swales:auditFC(sourceData('el-live-swales-15970'),g),flows:auditFC(sourceData('el-live-flows-15970'),g),basin:auditFC(sourceData('el-live-basin-15970'),g)},
    svgLabels:auditFC({features:labelFeatures},g),
    displayAudit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')
  };
});
result.errors=errors;
console.log('EARTHLINE_TX_CONTAINMENT_PROBE '+JSON.stringify(result));
writeFileSync('texas-containment-probe.json',JSON.stringify(result,null,2));
await page.screenshot({path:'texas-containment-probe.png',fullPage:true});
await browser.close();
if(!result.package||result.package.profileId!=='us-tx'||result.visual.swales.outside||result.visual.flows.outside||result.mapSources.swales.outside||result.mapSources.flows.outside||result.svgLabels.outside)process.exitCode=1;
