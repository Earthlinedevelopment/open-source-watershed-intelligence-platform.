import {chromium} from 'playwright';import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);if(!chrome)throw new Error('chrome missing');

const wrapper=`
(function(){
  function hav(a,b){const R=6371008.8,p1=Number(a[1])*Math.PI/180,p2=Number(b[1])*Math.PI/180,dp=(Number(b[1])-Number(a[1]))*Math.PI/180,dl=(Number(b[0])-Number(a[0]))*Math.PI/180,x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(x)))}
  function local(coords){const a=Array.isArray(coords)?coords:[];if(a.length<3)return a;let c=Math.floor((a.length-1)/2),l=c,r=c,lm=0,rm=0;while(l>0){const d=hav(a[l],a[l-1]);if(lm+d>3500)break;l--;lm+=d}while(r<a.length-1){const d=hav(a[r],a[r+1]);if(rm+d>3500)break;r++;rm+=d}if(l===r){if(r<a.length-1)r++;else if(l>0)l--}return a.slice(l,r+1)}
  function install(){
    const orig=window.earthlineRenderRegionalOverlay16020;if(typeof orig!=='function'||orig.__m83LocalDisplay)return false;
    const wrapped=function(data){
      const features=data?.swales?.features||[];const isFocus=features.some(f=>String(f?.properties?.analysis_tier||'').toLowerCase()==='focus');
      if(isFocus||!features.length)return orig(data);
      const display=Object.assign({},data,{swales:{type:'FeatureCollection',features:data.swales.features.map(f=>f?.geometry?.type==='LineString'?Object.assign({},f,{geometry:Object.assign({},f.geometry,{coordinates:local(f.geometry.coordinates)})}):f)}});
      return orig(display);
    };
    wrapped.__m83LocalDisplay=true;wrapped.__earthlineOriginal=orig;window.earthlineRenderRegionalOverlay16020=wrapped;return true;
  }
  if(!install())setTimeout(install,0);
})();
`;

async function suite(modified){
 const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1600,height:900}});
 if(modified)await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();let body=await res.text();body=body.replace('</body>', '<script>'+wrapper+'</script></body>');await route.fulfill({response:res,body});});
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForTimeout(1000);
 const rows=[];
 for(const q of ['Arizona','Texas','California','Vermont']){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));await page.locator('#searchInput').fill(q);
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});await page.waitForTimeout(250);
  rows.push(await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    const g=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
    const cores=Array.from(g?.querySelectorAll('.earthline-swale-core-16168')||[]);
    const lengths=cores.map(p=>{try{return p.getTotalLength()}catch(_){return 0}}).sort((a,b)=>a-b);
    return {q:d?.query,swales:Number(d?.derived?.swaleOpportunityLines||0),cores:cores.length,p50Px:Math.round(lengths[Math.floor(lengths.length*.5)]||0),p95Px:Math.round(lengths[Math.floor(lengths.length*.95)]||0),maxPx:Math.round(lengths.at(-1)||0),sourceCount:(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).length};
  }));
 }
 await browser.close();return rows;
}
const baseline=await suite(false),candidate=await suite(true);
for(const r of candidate){if(r.swales<15||r.cores<15||r.sourceCount!==r.swales)throw new Error(r.q+' count regression '+JSON.stringify(r));}
for(const q of ['Arizona','Texas','California','Vermont']){
 const b=baseline.find(x=>x.q===q),c=candidate.find(x=>x.q===q);if(!(c.maxPx<b.maxPx*.8))throw new Error(q+' visible worms not materially shortened '+JSON.stringify({b,c}));
}
console.log('M83_DISPLAY_WORM_PASS '+JSON.stringify({baseline,candidate}));
