import {chromium} from 'playwright';
import fs from 'fs';
const target=[-92.12943,34.77042];
const hav=(a,b)=>{const R=6371,rad=x=>x*Math.PI/180,dlat=rad(b[1]-a[1]),dlon=rad(b[0]-a[0]),q=Math.sin(dlat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dlon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));};
const browser=await chromium.launch({headless:true});
let final=null,lastError=null;
for(let attempt=1;attempt<=8;attempt++){
  const page=await browser.newPage({viewport:{width:1800,height:900}});
  try{
    await page.goto('https://earthlinedevelopment.org/?live16841='+Date.now()+'-'+attempt,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const raw=await page.content();
    const marker=raw.includes('EARTHLINE 16841 — GROUPED STATEWIDE-DEM LOCAL PHASE');
    if(!marker){await page.close();await new Promise(r=>setTimeout(r,8000));continue;}
    await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
    await page.waitForFunction(()=>{const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020;return window.EARTHLINE_STATEWIDE_SUPERTILE_16839?.build==='EARTHLINE 16841'&&window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0&&Number(d?.swaleLines||0)>0;},null,{timeout:110000,polling:100});
    await page.waitForTimeout(500);
    const snap=await page.evaluate(()=>{const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{},perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{},land=window.EARTHLINE_LAND_VALIDITY_16584||{},loc=window.EARTHLINE_STATEWIDE_SUPERTILE_16839||{};return {build:loc.build||null,generated:+p.generated||0,visible:+d.swaleLines||0,unsafe:+flow.unsafeSegments||0,outside:+(p.outsideJurisdiction||p.outside||p.outsideCount||0),waterReady:Array.isArray(land.waterParts),coreMs:+perf.totalMs||NaN,localMs:+loc.elapsedMs||0,gaps:+loc.gaps||0,groups:+loc.groups||0,added:+loc.added||0,failed:+loc.failed||0,targetCandidates:loc.targetCandidates||[]};});
    const geo=await page.evaluate(()=>{try{const style=window.map?.getStyle();if(!style?.sources)return null;let best=null;for(const id of Object.keys(style.sources)){const src=window.map.getSource(id),d=src?._data;if(!d?.features||!Array.isArray(d.features))continue;const lines=d.features.filter(f=>f?.geometry?.type==='LineString');if(!lines.length)continue;const score=lines.filter(f=>{const p=f.properties||{};return p.slope_pct!=null||String(p.feature_type||'').toLowerCase().includes('swale')||String(p.kind||'').toLowerCase().includes('swale');}).length*10000+lines.length;if(!best||score>best.score)best={id,score,data:{type:'FeatureCollection',features:lines}};}return best;}catch(_){return null}});
    const counts={r5:0,r10:0,r20:0,r30:0,north30:0};
    if(geo?.data?.features)for(const f of geo.data.features){const c=f.geometry.coordinates||[];if(!c.length)continue;const m=c[Math.floor((c.length-1)/2)],km=hav(target,m);if(km<=5)counts.r5++;if(km<=10)counts.r10++;if(km<=20)counts.r20++;if(km<=30)counts.r30++;if(km<=30&&m[1]>=target[1])counts.north30++;}
    fs.mkdirSync('out',{recursive:true});await page.screenshot({path:'out/16841-live-arkansas.png',fullPage:false});
    final={attempt,marker:true,...snap,counts,sourceId:geo?.id||null,sourceLines:geo?.data?.features?.length||0};
    await page.close();break;
  }catch(e){lastError=String(e?.message||e);await page.close();if(attempt<8)await new Promise(r=>setTimeout(r,8000));}
}
await browser.close();
fs.mkdirSync('out',{recursive:true});fs.writeFileSync('out/16841-live-verify.json',JSON.stringify({at:new Date().toISOString(),final,lastError},null,2));
console.log(JSON.stringify({final,lastError}));
if(!final||final.build!=='EARTHLINE 16841'||final.generated<=0||final.generated!==final.visible||final.unsafe!==0||final.outside!==0||!final.waterReady||!Number.isFinite(final.coreMs)||final.coreMs>15000||final.failed!==0||final.targetCandidates.length===0)process.exit(2);
