import { chromium } from 'playwright';
const ORIGIN='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

async function desktop(){
 const context=await browser.newContext({viewport:{width:1798,height:900},serviceWorkers:'block'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(ORIGIN+'?postprod17631='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 const base=await page.evaluate(()=>({language:!!document.getElementById('earthlineLanguage16488'),gaugeLabel:document.querySelector('.earthline-recharge-gauge-label-16488')?.textContent?.trim()||'',launch:document.documentElement.dataset.earthlineLaunch16872||null}));
 await page.locator('#searchInput').fill('Arizona');await page.waitForTimeout(700);
 const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();if(await opt.count())await opt.click().catch(()=>{});
 const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.evaluate(b=>b.dataset.busy==='1'||b.disabled))await rb.click();
 await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:120000,polling:120});
 const regional=await page.evaluate(()=>{const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{},p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},f=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{},b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||{};return{generated:Number(p.generated||0),visible:Number(d.swaleLines||0),water:Number(d.waterPaths||0),arrows:Number(d.directionArrows||0),contours:Number(d.contourLines||0),unsafe:Number(f.unsafeSegments||0),outside:Number(b.outsideAfterClip?.swales||0)}});

 const ctl={lng:-111.93456,lat:34.21545};
 await page.evaluate(c=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[c.lng,c.lat],zoom:17,bearing:0,pitch:0});try{m.fire('dragend')}catch(_){}},ctl);
 await page.waitForFunction(c=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201;return !!t&&Math.abs(Number(t.lng)-c.lng)<.00008&&Math.abs(Number(t.lat)-c.lat)<.00008},ctl,{timeout:15000,polling:80});
 const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
 await page.locator('#earthlineDeclareProperty16169').click({timeout:15000});
 await page.waitForFunction(b=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return !!a&&Number(a.serial||0)>b&&a.settled===true},before,{timeout:150000,polling:120});
 await page.waitForTimeout(1700);
 const property=await page.evaluate(({before,ctl})=>{
   const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),m=(typeof M!=='undefined'?M:null),a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},safe=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{},elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
   const gp=(id,k)=>{try{return mp?.getLayer?.(id)?mp.getPaintProperty(id,k):null}catch(_){return null}},gl=(id,k)=>{try{return mp?.getLayer?.(id)?mp.getLayoutProperty(id,k):null}catch(_){return null}};
   const life='earthline-property-safe-life-16221',waterLine='earthline-property-safe-water-16221';
   const natural=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177','earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806'];
   let maxSlope=0,badSlope=0,badNoBuild=0,badPond=0,badChannel=0,pts=0,th=null;try{th=Number(streamThreshold()*3.2)}catch(_){}
   for(const sw of (m?.swales||[]))for(const p of (sw?.pts||[])){const x=Math.max(0,Math.min(GW-1,Math.round(Number(p[0])))),y=Math.max(0,Math.min(GH-1,Math.round(Number(p[1])))),i=y*GW+x;pts++;let sp=Infinity;try{sp=Number(slopePct(x,y))}catch(_){};if(Number.isFinite(sp))maxSlope=Math.max(maxSlope,sp);if(!Number.isFinite(sp)||sp>4.000001)badSlope++;if(m?.noBuildMask?.[i])badNoBuild++;if(m?.pond?.[i])badPond++;if(Number.isFinite(th)&&Number(m?.acc?.[i]||0)>=th)badChannel++;}
   return {serialDelta:Number(a.serial||0)-before,result:a.result===true,settled:a.settled===true,safe:safe.visible===true,water:Number(m?.authoritativeWaterPaths15824?.features?.length||0),recharge:Number(m?.rechZones?.length||0),elder,pts,maxSlope,badSlope,badNoBuild,badPond,badChannel,target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
     life:{color:gp(life,'line-color'),dash:gp(life,'line-dasharray'),opacity:gp(life,'line-opacity')},waterLine:{color:gp(waterLine,'line-color'),dash:gp(waterLine,'line-dasharray'),opacity:gp(waterLine,'line-opacity')},
     naturalHidden:natural.every(id=>!mp?.getLayer?.(id)||gl(id,'visibility')==='none'||gp(id,'line-opacity')===0||gp(id,'fill-opacity')===0)};
 },{before,ctl});
 await page.locator('#earthlineVermontReport16149').click();await page.waitForTimeout(500);
 const report=await page.evaluate(()=>{const p=document.getElementById('earthlineVermontReportPanel16149'),t=String(p?.innerText||'').replace(/\s+/g,' ');return{property:/Property bioswale corridor/i.test(t),process:/The Earthline Process/i.test(t),how:/How Bioswales Work/i.test(t),stale:/192 regional opportunity corridor/i.test(t)}});
 const targetOk=Math.abs(Number(property.target?.lng)-ctl.lng)<.00008&&Math.abs(Number(property.target?.lat)-ctl.lat)<.00008;
 const blueDotted=x=>Array.isArray(x?.dash)&&x.dash.length>=2&&x.opacity>=.98&&/^#(?:5bd4ff|159de0)$/i.test(String(x.color||''));
 const pass=base.language&&base.gaugeLabel==='Recharge Suitability'&&regional.generated>0&&regional.visible===regional.generated&&regional.water>0&&regional.arrows>0&&regional.contours>0&&regional.unsafe===0&&regional.outside===0&&property.serialDelta===1&&property.result&&property.settled&&property.safe&&property.water>0&&property.pts>0&&property.badSlope===0&&property.badNoBuild===0&&property.badPond===0&&property.badChannel===0&&targetOk&&blueDotted(property.life)&&blueDotted(property.waterLine)&&property.naturalHidden&&property.elder?.state==='committed'&&report.property&&report.process&&report.how&&!report.stale&&!errors.length;
 await context.close();return{pass,base,regional,property,report,errors};
}

async function mobile(){
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(ORIGIN+'?postprodmobile17631='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});await page.waitForSelector('#searchInput',{timeout:30000});
 await page.locator('#searchInput').fill('Arizona');await page.waitForTimeout(700);const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();if(await opt.count())await opt.click().catch(()=>{});const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.evaluate(b=>b.dataset.busy==='1'||b.disabled))await rb.click();
 await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:120000,polling:120});
 const c={lng:-111.93067,lat:34.21568};await page.evaluate(c=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[c.lng,c.lat],zoom:17,bearing:0,pitch:0});try{m.fire('dragend')}catch(_){}},c);
 await page.waitForFunction(c=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201;return !!t&&Math.abs(Number(t.lng)-c.lng)<.00008&&Math.abs(Number(t.lat)-c.lat)<.00008},c,{timeout:15000,polling:80});
 await page.waitForSelector('#earthlineMobilePropertyAction17004',{state:'visible',timeout:10000});const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));await page.locator('#earthlineMobilePropertyAction17004').tap();
 await page.waitForFunction(b=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return !!a&&Number(a.serial||0)>b&&a.settled===true},before,{timeout:150000,polling:120});
 const out=await page.evaluate(b=>({serialDelta:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)-b,result:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.result===true,safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221?.visible===true}),before);
 const pass=out.serialDelta===1&&out.result&&out.safe&&!errors.length;await context.close();return{pass,out,errors};
}
const desktopResult=await desktop(),mobileResult=await mobile();await browser.close();const pass=desktopResult.pass&&mobileResult.pass;console.log('EARTHLINE_POSTPROD_17631 '+JSON.stringify({pass,desktop:desktopResult,mobile:mobileResult}));if(!pass)process.exitCode=1;
