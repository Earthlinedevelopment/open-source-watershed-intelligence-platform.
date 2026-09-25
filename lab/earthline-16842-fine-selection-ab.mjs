import {chromium} from 'playwright';
import fs from 'fs';

const target=[-92.12943,34.77042];
const variants=[
  {name:'control',from:null,to:null},
  {name:'fine12',from:'const N16836=12,maxSwaps16836=6,minGain16836=.15;',to:'const N16836=24,maxSwaps16836=12,minGain16836=.10;'},
  {name:'fine18',from:'const N16836=12,maxSwaps16836=6,minGain16836=.15;',to:'const N16836=24,maxSwaps16836=18,minGain16836=.08;'}
];
const hav=(a,b)=>{const R=6371,rad=x=>x*Math.PI/180,dlat=rad(b[1]-a[1]),dlon=rad(b[0]-a[0]),q=Math.sin(dlat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dlon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));};

fs.mkdirSync('out',{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];
for(const v of variants){
  const page=await browser.newPage({viewport:{width:1800,height:900}});let error=null,injectError=null;
  if(v.from){
    await page.route('https://earthlinedevelopment.org/**',async route=>{
      const req=route.request();if(req.resourceType()!=='document'){await route.continue();return;}
      const u=new URL(req.url());if(u.pathname!=='/'&&u.pathname!=='/index.html'){await route.continue();return;}
      const resp=await route.fetch();let body=await resp.text();const n=body.split(v.from).length-1;
      if(n!==1){injectError=`16836 constant anchor count ${n}`;await route.fulfill({response:resp,body});return;}
      body=body.replace(v.from,v.to);await route.fulfill({response:resp,body});
    });
  }
  try{
    await page.goto('https://earthlinedevelopment.org/?ab16842='+v.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
    await page.waitForFunction(()=>{const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020;return window.EARTHLINE_STATEWIDE_SUPERTILE_16839?.build==='EARTHLINE 16841'&&window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0&&Number(d?.swaleLines||0)>0;},null,{timeout:110000,polling:100});
    await page.waitForTimeout(500);
  }catch(e){error=String(e?.message||e);}
  const snap=await page.evaluate(()=>{const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{},perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{},land=window.EARTHLINE_LAND_VALIDITY_16584||{},loc=window.EARTHLINE_STATEWIDE_SUPERTILE_16839||{},bal=window.EARTHLINE_OPPORTUNITY_BALANCE_16836||{};return {generated:+p.generated||0,visible:+d.swaleLines||0,unsafe:+flow.unsafeSegments||0,outside:+(p.outsideJurisdiction||p.outside||p.outsideCount||0),waterReady:Array.isArray(land.waterParts),coreMs:+perf.totalMs||NaN,localMs:+loc.elapsedMs||0,added:+loc.added||0,failed:+loc.failed||0,targetCandidates:loc.targetCandidates||[],balance:{swaps:+bal.swaps||0,rows:bal.rows||[]}};});
  const geo=await page.evaluate(()=>{try{const style=window.map?.getStyle();if(!style?.sources)return null;let best=null;for(const id of Object.keys(style.sources)){const src=window.map.getSource(id),d=src?._data;if(!d?.features||!Array.isArray(d.features))continue;const lines=d.features.filter(f=>f?.geometry?.type==='LineString');if(!lines.length)continue;const score=lines.filter(f=>{const p=f.properties||{};return p.slope_pct!=null||String(p.feature_type||'').toLowerCase().includes('swale')||String(p.kind||'').toLowerCase().includes('swale');}).length*10000+lines.length;if(!best||score>best.score)best={id,score,data:{type:'FeatureCollection',features:lines}};}return best;}catch(_){return null}});
  const counts={r5:0,r10:0,r20:0,r30:0,north10:0,north20:0,north30:0};
  if(geo?.data?.features)for(const f of geo.data.features){const c=f.geometry.coordinates||[];if(!c.length)continue;const m=c[Math.floor((c.length-1)/2)],km=hav(target,m),north=m[1]>=target[1];if(km<=5)counts.r5++;if(km<=10)counts.r10++;if(km<=20)counts.r20++;if(km<=30)counts.r30++;if(north&&km<=10)counts.north10++;if(north&&km<=20)counts.north20++;if(north&&km<=30)counts.north30++;}
  await page.screenshot({path:`out/16842-${v.name}-arkansas.png`,fullPage:false});
  rows.push({variant:v.name,error,injectError,...snap,counts,sourceId:geo?.id||null,sourceLines:geo?.data?.features?.length||0});
  console.log(JSON.stringify(rows.at(-1)));
  await page.close();
}
await browser.close();
const control=rows.find(r=>r.variant==='control');
const candidates=rows.filter(r=>r.variant!=='control'&&!r.error&&!r.injectError&&r.generated===r.visible&&r.generated>0&&r.unsafe===0&&r.outside===0&&r.waterReady&&Number.isFinite(r.coreMs)&&r.coreMs<=15000&&r.failed===0);
const best=candidates.sort((a,b)=>(b.counts.r20-a.counts.r20)||(b.counts.north20-a.counts.north20)||(b.counts.r10-a.counts.r10)||(a.coreMs-b.coreMs))[0]||null;
const pass=!!(control&&best&&(best.counts.r20>control.counts.r20||best.counts.north20>control.counts.north20));
fs.writeFileSync('out/16842-fine-selection-ab.json',JSON.stringify({at:new Date().toISOString(),pass,control,best,rows},null,2));
console.log(JSON.stringify({pass,control:control&&{counts:control.counts,coreMs:control.coreMs,swaps:control.balance.swaps},best:best&&{variant:best.variant,counts:best.counts,coreMs:best.coreMs,swaps:best.balance.swaps}}));
if(!pass)process.exit(2);
// trigger 16842 registered workflow
