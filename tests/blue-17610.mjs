import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { resolve,extname } from 'node:path';
const root=process.cwd(),origin='https://earthlinedevelopment.org';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.py':'text/plain; charset=utf-8'};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:900},serviceWorkers:'block'});
await context.route(origin+'/**',async route=>{const u=new URL(route.request().url()),p=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html',f=resolve(root,p);if(f.startsWith(root)&&existsSync(f))return route.fulfill({status:200,path:f,contentType:mime[extname(f)]||'application/octet-stream',headers:{'cache-control':'no-store'}});return route.continue();});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(origin+'/?blue17610='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Arizona');await page.waitForTimeout(650);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();if(await opt.count())await opt.click().catch(()=>{});
const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.evaluate(b=>b.dataset.busy==='1'||b.disabled))await rb.click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:120000,polling:120});
const controls=[{id:'A',lng:-111.93067,lat:34.21568},{id:'B',lng:-111.93456,lat:34.21545}];
const rows=[];
for(const c of controls){
  await page.evaluate(c=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[c.lng,c.lat],zoom:17,bearing:0,pitch:0});try{m.fire('dragend')}catch(_){}},c);
  await page.waitForFunction(c=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201;return !!t&&Math.abs(Number(t.lng)-c.lng)<.00008&&Math.abs(Number(t.lat)-c.lat)<.00008},c,{timeout:15000,polling:80});
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.locator('#earthlineDeclareProperty16169').click({timeout:15000});
  await page.waitForFunction(before=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return !!a&&Number(a.serial||0)>before&&a.settled===true},before,{timeout:150000,polling:120});
  await page.waitForTimeout(1500);
  const snap=await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),m=(typeof M!=='undefined'?M:null);
    const gp=(id,k)=>{try{return mp.getLayer(id)?mp.getPaintProperty(id,k):null}catch(_){return null}};
    const gl=(id,k)=>{try{return mp.getLayer(id)?mp.getLayoutProperty(id,k):null}catch(_){return null}};
    const life='earthline-property-safe-life-16221',water='earthline-property-safe-water-16221';
    const natural=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177','earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806'];
    let maxSlope=0,badSlope=0,badNoBuild=0,badPond=0,badChannel=0,points=0;let th=null;try{th=Number(streamThreshold()*3.2)}catch(_){}
    for(const sw of (m?.swales||[]))for(const p of (sw?.pts||[])){const x=Math.max(0,Math.min(GW-1,Math.round(Number(p[0])))),y=Math.max(0,Math.min(GH-1,Math.round(Number(p[1])))),i=y*GW+x;points++;let sp=Infinity;try{sp=Number(slopePct(x,y))}catch(_){};if(Number.isFinite(sp))maxSlope=Math.max(maxSlope,sp);if(!Number.isFinite(sp)||sp>4.000001)badSlope++;if(m?.noBuildMask?.[i])badNoBuild++;if(m?.pond?.[i])badPond++;if(Number.isFinite(th)&&Number(m?.acc?.[i]||0)>=th)badChannel++;}
    return {
      run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
      elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,waterCount:Number(m?.authoritativeWaterPaths15824?.features?.length||0),
      points,maxSlope,badSlope,badNoBuild,badPond,badChannel,
      life:{color:gp(life,'line-color'),dash:gp(life,'line-dasharray'),offset:gp(life,'line-offset'),opacity:gp(life,'line-opacity'),visibility:gl(life,'visibility')},
      water:{color:gp(water,'line-color'),dash:gp(water,'line-dasharray'),offset:gp(water,'line-offset'),opacity:gp(water,'line-opacity'),visibility:gl(water,'visibility')},
      natural:natural.map(id=>({id,exists:!!mp?.getLayer?.(id),visibility:gl(id,'visibility'),lineOpacity:gp(id,'line-opacity'),fillOpacity:gp(id,'fill-opacity')}))
    };
  });
  const dot=x=>Array.isArray(x?.dash)&&x.dash.length>=2&&x.opacity>=.98&&x.visibility!=='none';
  const naturalHidden=snap.natural.every(x=>!x.exists||x.visibility==='none'||x.lineOpacity===0||x.fillOpacity===0);
  const blue=/#(?:5bd4ff|159de0)/i.test(String(snap.life.color))+/#(?:5bd4ff|159de0)/i.test(String(snap.water.color))===2;
  const opposite=JSON.stringify(snap.life.offset)!==JSON.stringify(snap.water.offset);
  const pass=snap.run?.result===true&&snap.run?.settled===true&&snap.safe?.visible===true&&snap.points>0&&snap.badSlope===0&&snap.badNoBuild===0&&snap.badPond===0&&snap.badChannel===0&&snap.waterCount>0&&dot(snap.life)&&dot(snap.water)&&blue&&opposite&&naturalHidden&&!errors.length;
  rows.push({id:c.id,pass,snap});
}
console.log('EARTHLINE_BLUE_17610 '+JSON.stringify({pass:rows.every(r=>r.pass),rows,errors}));
await page.screenshot({path:'/tmp/earthline-blue-17610.png',fullPage:true});
await browser.close();
if(rows.some(r=>!r.pass)||errors.length)process.exitCode=1;
