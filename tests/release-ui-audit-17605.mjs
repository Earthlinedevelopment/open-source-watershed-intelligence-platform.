import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { resolve,extname } from 'node:path';

const root=process.cwd(),origin='https://earthlinedevelopment.org';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.py':'text/plain; charset=utf-8'};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:900},serviceWorkers:'block'});
await context.route(origin+'/**',async route=>{
  const u=new URL(route.request().url()),p=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html',f=resolve(root,p);
  if(f.startsWith(root)&&existsSync(f))return route.fulfill({status:200,path:f,contentType:mime[extname(f)]||'application/octet-stream',headers:{'cache-control':'no-store'}});
  return route.continue();
});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(origin+'/?ui17605='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForTimeout(800);

const initial=await page.evaluate(()=>{
  const visible=(el)=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>0&&r.height>0};
  const logo=document.querySelector('#earthlinePanelBrand16201 img,.brand img,img[alt="Earthline"]');
  const mantra=document.querySelector('#earthlinePanelBrand16201 .mantra-primary,.mantra-primary');
  const lang=document.getElementById('earthlineLanguage16488')||document.querySelector('#earthlineRail16188 select');
  const data=[...document.querySelectorAll('#earthlineRail16188 *')].find(e=>String(e.textContent||'').trim()==='DATA');
  const body=String(document.body.innerText||'');
  return {
    mantra:String(mantra?.textContent||'').replace(/\s+/g,' ').trim(),
    logo:{src:logo?.getAttribute('src')||null,alt:logo?.getAttribute('alt')||null,visible:visible(logo)},
    runOrb:{button:!!document.getElementById('runBtn'),shell:!!document.querySelector('#runBtn > i.earthline-orb-shell-16244')},
    languages:lang?[...lang.options].map(o=>({value:o.value,label:o.textContent})) : [],
    dataButton:{exists:!!data,visible:visible(data)},
    removed:{
      exploreWater:/Explore Water/i.test(body),
      waterStory:/Water story/i.test(body),
      visualScientific:/Visual Scientific/i.test(body)
    }
  };
});
console.log('EARTHLINE_UI17605_INITIAL '+JSON.stringify(initial));

const dataBtn=page.locator('#earthlineRail16188').getByText('DATA',{exact:true}).first();
let dataAudit=null;
if(await dataBtn.count()){
  await dataBtn.click();await page.waitForTimeout(250);
  dataAudit=await page.evaluate(()=>{
    const m=document.getElementById('earthlineRechargeDataModal16488'),c=document.getElementById('earthlineRechargeDataContent16488');
    const txt=String(c?.innerText||m?.innerText||'').replace(/\s+/g,' ').trim();
    const s=m?getComputedStyle(m):null,r=m?.getBoundingClientRect();
    return {visible:!!m&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>0&&r.height>0,text:txt.slice(0,5000),
      terms:{slope:/slope/i.test(txt),flow:/flow/i.test(txt),canopy:/canopy/i.test(txt),groundwater:/groundwater|aquifer|well/i.test(txt),rain:/rainfall|precip/i.test(txt)}};
  });
  await page.locator('#earthlineRechargeDataClose16488').click().catch(()=>{});
}
console.log('EARTHLINE_UI17605_DATA '+JSON.stringify(dataAudit));

if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(200);
}
await page.locator('#searchInput').fill('Arizona');await page.waitForTimeout(700);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();if(await opt.count())await opt.click().catch(()=>{});
const run=page.locator('#runBtn');if(await run.isVisible()&&!await run.evaluate(b=>b.dataset.busy==='1'||b.disabled))await run.click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:120000,polling:120});
await page.waitForTimeout(700);

const regional=await page.evaluate(()=>{
  const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{};
  const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
  const body=String(document.body.innerText||'').replace(/\s+/g,' ');
  return {generated:Number(pub.generated||0),visible:Number(d.swaleLines||0),water:Number(d.waterPaths||0),arrows:Number(d.directionArrows||0),contours:Number(d.contourLines||0),labels:Number(d.elevationLabels||0),
    gaugeText:(body.match(/Recharge (?:Potential|Suitability)[^\n]{0,180}/i)||[])[0]||null};
});
console.log('EARTHLINE_UI17605_REGIONAL '+JSON.stringify(regional));

const ctl={lng:-111.93456,lat:34.21545};
await page.evaluate(ctl=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[ctl.lng,ctl.lat],zoom:17,bearing:0,pitch:0});try{m.fire('dragend')}catch(_){}},ctl);
await page.waitForFunction(ctl=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201;return !!t&&Math.abs(Number(t.lng)-ctl.lng)<.00008&&Math.abs(Number(t.lat)-ctl.lat)<.00008},ctl,{timeout:15000,polling:80});
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.locator('#earthlineDeclareProperty16169').click({timeout:15000});
await page.waitForFunction(before=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return !!a&&Number(a.serial||0)>before&&a.settled===true},before,{timeout:150000,polling:120});
await page.waitForTimeout(1800);

const property=await page.evaluate(()=>{
  const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),m=(typeof M!=='undefined'?M:null);
  const ids=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
  const natural=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177','earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806'];
  const gp=(id,p)=>{try{return map?.getLayer?.(id)?map.getPaintProperty(id,p):null}catch(_){return null}};
  const gl=(id,p)=>{try{return map?.getLayer?.(id)?map.getLayoutProperty(id,p):null}catch(_){return null}};
  const styles=ids.map(id=>({id,exists:!!map?.getLayer?.(id),visibility:gl(id,'visibility'),color:gp(id,'line-color'),opacity:gp(id,'line-opacity'),width:gp(id,'line-width'),dash:gp(id,'line-dasharray'),offset:gp(id,'line-offset')}));
  const naturalState=natural.map(id=>({id,exists:!!map?.getLayer?.(id),visibility:gl(id,'visibility'),lineOpacity:gp(id,'line-opacity'),fillOpacity:gp(id,'fill-opacity')}));
  const styleLayers=map?.getStyle?.()?.layers||[];
  const aqLayers=styleLayers.map((x,i)=>({id:x.id,i})).filter(x=>/aquifer/i.test(x.id));
  const safeTop=Math.max(...styles.map(x=>styleLayers.findIndex(l=>l.id===x.id)).filter(i=>i>=0),-1);
  const aqTop=Math.max(...aqLayers.map(x=>x.i),-1);
  const visibleAquiferEls=[...document.querySelectorAll('[id*="aquifer" i],[class*="aquifer" i]')].filter(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>0&&r.height>0}).map(el=>({id:el.id,cls:String(el.className||''),text:String(el.textContent||'').replace(/\s+/g,' ').trim().slice(0,500)})).slice(0,20);
  return {
    run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
    elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
    styles,naturalState,aqLayers,safeTop,aqTop,visibleAquiferEls,
    water:Number(m?.authoritativeWaterPaths15824?.features?.length||0),recharge:Number(m?.rechZones?.length||0),aquiferStatus:String(m?.usgsAquiferStatus||'')
  };
});
console.log('EARTHLINE_UI17605_PROPERTY '+JSON.stringify(property));

let report=null;
const reportBtn=page.locator('#earthlineVermontReport16149');
if(await reportBtn.count()){
  await reportBtn.click().catch(()=>{});await page.waitForTimeout(600);
  report=await page.evaluate(()=>{
    const p=document.getElementById('earthlineVermontReportPanel16149'),shell=p?.querySelector('.el49-shell'),txt=String(p?.innerText||'').replace(/\s+/g,' ').trim();
    const buttons=[...p?.querySelectorAll('button')||[]].map(b=>String(b.textContent||b.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim());
    return {open:!!p?.classList?.contains('open'),scrollHeight:shell?.scrollHeight||0,clientHeight:shell?.clientHeight||0,buttons,
      hasHow:/How Bioswales Work/i.test(txt),hasProcess:/Earthline Process/i.test(txt),hasDisclaimer:/verify|verification|professional landscape/i.test(txt),hasElder:/Elder Tree/i.test(txt),text:txt.slice(0,3500)};
  });
}
console.log('EARTHLINE_UI17605_REPORT '+JSON.stringify(report));
console.log('EARTHLINE_UI17605_ERRORS '+JSON.stringify(errors));
await page.screenshot({path:'/tmp/release-ui-17605.png',fullPage:true});
await browser.close();
if(errors.length)process.exitCode=1;
