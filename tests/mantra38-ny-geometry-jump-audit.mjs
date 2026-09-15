import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
await page.waitForFunction(()=>{const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020,a=window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329;return !!(v&&a&&a.passed===true&&v.swales?.features?.length);},null,{timeout:30000,polling:200});
const out=await page.evaluate(()=>{
  const data=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{};
  const hav=(a,b)=>{const r=Math.PI/180,lat1=Number(a[1])*r,lat2=Number(b[1])*r,dlat=(Number(b[1])-Number(a[1]))*r,dlon=(Number(b[0])-Number(a[0]))*r,q=Math.sin(dlat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dlon/2)**2;return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));};
  function audit(fc){
    const rows=[];let totalFeatures=0,totalSegments=0,maxSeg=0,maxLine=0;
    for(const [fi,f] of (fc?.features||[]).entries()){
      if(!f?.geometry)continue;const parts=f.geometry.type==='LineString'?[f.geometry.coordinates]:(f.geometry.type==='MultiLineString'?f.geometry.coordinates:[]);if(!parts.length)continue;totalFeatures++;
      for(const [pi,line] of parts.entries()){
        let len=0,localMax=0,localIdx=-1;
        for(let i=1;i<(line||[]).length;i++){const d=hav(line[i-1],line[i]);if(!Number.isFinite(d))continue;totalSegments++;len+=d;if(d>localMax){localMax=d;localIdx=i;}if(d>maxSeg)maxSeg=d;}
        maxLine=Math.max(maxLine,len);
        if(localMax>20||len>150){rows.push({fi,pi,type:String(f.properties?.feature_type||''),grade:String(f.properties?.grade||''),rank:Number(f.properties?.rank||0),points:line.length,maxSegmentKm:Number(localMax.toFixed(3)),maxSegmentIndex:localIdx,lineKm:Number(len.toFixed(3)),first:line[0],last:line.at(-1)});}
      }
    }
    rows.sort((a,b)=>b.maxSegmentKm-a.maxSegmentKm||b.lineKm-a.lineKm);
    return {totalFeatures,totalSegments,maxSegmentKm:Number(maxSeg.toFixed(3)),maxLineKm:Number(maxLine.toFixed(3)),suspectCount:rows.length,suspects:rows.slice(0,40)};
  }
  return {query:data.query,bounds:data.bounds,contours:audit(data.contours),flows:audit(data.flows),swales:audit(data.swales),boundaryAudit:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null};
});
console.log('MANTRA38_NY_GEOMETRY_JUMP_AUDIT '+JSON.stringify(out));
await browser.close();
