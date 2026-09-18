import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const out=[];
for(const threshold16633 of [22,12,8,4]){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const patches={};
  await page.route('**/*',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let text=await resp.text();
    const apply=(name,n,r)=>{patches[name]=text.split(n).length-1;text=text.split(n).join(r);};

    apply('validityMasks',
      'const valid16584=new Uint8Array(w16584*h16584);',
      'const valid16584=new Uint8Array(w16584*h16584),outsideLandMask16584=new Uint8Array(w16584*h16584),inlandWaterMask16584=new Uint8Array(w16584*h16584);');
    apply('outsideLandMark',
      'if(!onLand16584){outsideLand16584++;continue;}',
      'if(!onLand16584){outsideLand16584++;outsideLandMask16584[y16584*w16584+x16584]=1;continue;}');
    apply('inlandWaterMark',
      'if(inWater16584){inlandWater16584++;continue;}',
      'if(inWater16584){inlandWater16584++;inlandWaterMask16584[y16584*w16584+x16584]=1;continue;}');
    apply('validityReturn',
      'return {mask:valid16584,audit:audit16584};',
      'return {mask:valid16584,outsideLandMask16584,inlandWaterMask16584,audit:audit16584};');

    apply('hydrologyMasksPrimary',
      'hy=await hydrology(dem,validityGrid16584.mask);\n          hy.waterParts16584=Array.isArray(landValidity16584.waterParts)?landValidity16584.waterParts:[];',
      'hy=await hydrology(dem,validityGrid16584.mask);\n          hy.outsideLandMask16584=validityGrid16584.outsideLandMask16584||null;hy.inlandWaterMask16584=validityGrid16584.inlandWaterMask16584||null;\n          hy.waterParts16584=Array.isArray(landValidity16584.waterParts)?landValidity16584.waterParts:[];');
    apply('hydrologyMasksFallback',
      "if(!hy){hy=await hydrology(dem,validityGrid16584&&validityGrid16584.mask||null);if(landValidity16584&&Array.isArray(landValidity16584.waterParts))hy.waterParts16584=landValidity16584.waterParts;}",
      "if(!hy){hy=await hydrology(dem,validityGrid16584&&validityGrid16584.mask||null);if(validityGrid16584){hy.outsideLandMask16584=validityGrid16584.outsideLandMask16584||null;hy.inlandWaterMask16584=validityGrid16584.inlandWaterMask16584||null;}if(landValidity16584&&Array.isArray(landValidity16584.waterParts))hy.waterParts16584=landValidity16584.waterParts;}");

    apply('singlePassContext',
      'const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];',
      'const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];\n    const coarseShortContext16630=!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>10000;\n    const nearOutsideLand16630=new Uint8Array(hy.w*hy.h),outsideLandMask16630=hy.outsideLandMask16584;\n    if(coarseShortContext16630&&outsideLandMask16630){for(let y16630=0;y16630<hy.h;y16630++)for(let x16630=0;x16630<hy.w;x16630++){if(!outsideLandMask16630[y16630*hy.w+x16630])continue;for(let dy16630=-9;dy16630<=9;dy16630++)for(let dx16630=-9;dx16630<=9;dx16630++){const xx16630=x16630+dx16630,yy16630=y16630+dy16630;if(xx16630>=0&&xx16630<hy.w&&yy16630>=0&&yy16630<hy.h)nearOutsideLand16630[yy16630*hy.w+xx16630]=1;}}}');

    apply('singlePassLength',
      'const segment=chaikin(raw,2,false);if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;',
      'const segment=chaikin(raw,2,false);if(segment.length<10)return null;\n      const linePixels16630=lineLengthPixels(hy,segment);let shortContextAccepted16630=false;\n      if(linePixels16630<10){if(linePixels16630<4||!coarseShortContext16630)return null;const mid16630=segment[Math.floor((segment.length-1)/2)],g16630=llGrid(hy,mid16630);if(!g16630||!Number.isFinite(g16630.x)||!Number.isFinite(g16630.y))return null;const x16630=Math.max(0,Math.min(hy.w-1,Math.round(g16630.x))),y16630=Math.max(0,Math.min(hy.h-1,Math.round(g16630.y))),edgeDistance16630=Math.min(g16630.x,g16630.y,(hy.w-1)-g16630.x,(hy.h-1)-g16630.y),nearCoast16630=!!nearOutsideLand16630[y16630*hy.w+x16630];if(edgeDistance16630>6&&!nearCoast16630)return null;shortContextAccepted16630=true;}');

    apply('singlePassReturn',
      "return {segment,x:anchor.x,y:anchor.y,slope:meanSlope,acc:meanAcc,maxAcc,score:slopeScore*.56+flowScore*.28+lengthScore*.16,confidence:relaxed?'screening':'preferred'};",
      "return {segment,x:anchor.x,y:anchor.y,slope:meanSlope,acc:meanAcc,maxAcc,score:slopeScore*.56+flowScore*.28+lengthScore*.16,confidence:relaxed?'screening':'preferred',minLinePixels16630:shortContextAccepted16630?4:10,shortContext16630:shortContextAccepted16630};");

    apply('screenMin',
      'if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}',
      'if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<Math.max(4,Math.min(10,Number(candidate16539&&candidate16539.minLinePixels16630)||10))){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');

    apply('rendererSwalePixels16633',
      'const pts=points(f.geometry.coordinates),len=polyLength(pts);if(pts.length<3||len<22)continue;',
      'const pts=points(f.geometry.coordinates),len=polyLength(pts);if(pts.length<3||len<'+threshold16633+')continue;');

    apply('overlayAuditRetry',
      'const overlayAudit=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;',
      "let overlayAudit=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;if(swaleCount>0&&(!overlayAudit||Number(overlayAudit.swaleLines||0)===0)){try{m.resize&&m.resize();if(typeof window.earthlineRenderRegionalOverlay16020==='function')window.earthlineRenderRegionalOverlay16020(visualData);overlayAudit=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||overlayAudit;}catch(_){}}");

    return route.fulfill({response:resp,body:text});
  });

  const started=Date.now();
  await page.goto(URL+'?tx_renderer_threshold='+threshold16633+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\\./i.test(s)&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167);},{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(350);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null;
    return {swales:sw.length,visible:d?.swaleLines??null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),panhandleWestNM:count((x,y)=>x>-103.2&&x<-102&&y>31.8&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)},candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,totalMs:p?.totalMs??null,phases:p?.phaseTotalsMs??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  });
  const row={threshold16633,patches,elapsedMs:Date.now()-started,timedOut,state,errors:errors.slice(0,12)};
  out.push(row);console.log('EARTHLINE_TX_RENDER_THRESHOLD '+JSON.stringify(row));await page.close();
}
console.log('EARTHLINE_TX_RENDER_THRESHOLD_SUMMARY '+JSON.stringify(out));
await browser.close();
