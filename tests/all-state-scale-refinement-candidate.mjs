import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const STATES=String(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
if(!STATES.length) throw new Error('STATES is empty');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};

await page.route('**/*',async route=>{
  const req=route.request();
  if(req.resourceType()!=='document'||!req.isNavigationRequest()||!req.url().startsWith(URL))return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  if(!body.includes('async function makeContours(hy,candidateQuantile16609=false){'))return route.fulfill({response:resp,body});
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(needle,replacement);};

  apply('contourSignature',
  `  async function makeContours(hy,candidateQuantile16609=false){`,
  `  async function makeContours(hy,candidateQuantile16609=false,levelsOverride16702=null){`);

  apply('contourLevels',
  `    if(candidateQuantile16609){
      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}
    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}`,
  `    if(Array.isArray(levelsOverride16702)&&levelsOverride16702.length){
      const seen16702=new Set();for(const raw16702 of levelsOverride16702){const k16702=Math.round(Number(raw16702)*10)/10;if(Number.isFinite(k16702)&&k16702>min&&k16702<max&&!seen16702.has(k16702)){seen16702.add(k16702);levels.push(k16702);}}
    }else if(candidateQuantile16609){
      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}
    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}`);

  apply('swaleSignature',
  `  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null){`,
  `  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){`);

  apply('supplementalIntoOwner',
  `    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);`,
  `    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);
    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);`);

  apply('chosenAudit',
  `    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.`,
  `    window.EARTHLINE_REFINED_SELECTION_16702={supplementalInput:Array.isArray(supplementalCandidates16702)?supplementalCandidates16702.length:0,chosenRefined:chosen.filter(c=>c&&c.refined16702).length,chosenRefinedRows:chosen.filter(c=>c&&c.refined16702).map(c=>({x:c.x,y:c.y,score:c.score,coastKm:c.coastKm16702,tile:c.tile16702}))};
    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.`);

  const needle=`    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
  const repl=`    let supplementalCandidates16702=[];
    let scaleRefineTrigger16705=false;
    if(!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>10000&&hy.outsideLandMask16632&&hy.validityMask16584){
      const nearOceanTrigger16705=(x16705,y16705,r16705=2)=>{for(let dy16705=-r16705;dy16705<=r16705;dy16705++)for(let dx16705=-r16705;dx16705<=r16705;dx16705++){const xx16705=x16705+dx16705,yy16705=y16705+dy16705;if(xx16705<0||xx16705>=hy.w||yy16705<0||yy16705>=hy.h)continue;if(hy.outsideLandMask16632[yy16705*hy.w+xx16705])return true;}return false;};
      const channelTrigger16705=percentile(hy.acc,.972);let coastalCells16705=0,screenPass16705=0;
      for(let y16705=1;y16705<hy.h-1;y16705++)for(let x16705=1;x16705<hy.w-1;x16705++){const i16705=y16705*hy.w+x16705;if(hy.validityMask16584[i16705]!==1||!nearOceanTrigger16705(x16705,y16705,2))continue;coastalCells16705++;const sp16705=Number(hy.slope[i16705]),ac16705=Number(hy.acc[i16705]);if(Number.isFinite(sp16705)&&sp16705>=.20&&sp16705<=13.5&&Number.isFinite(ac16705)&&ac16705<channelTrigger16705)screenPass16705++;}
      const screenPassRatio16705=coastalCells16705>0?screenPass16705/coastalCells16705:1;
      scaleRefineTrigger16705=coastalCells16705>=50&&screenPassRatio16705<=.02;
      window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705={maxCellM:Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0),coastalCells:coastalCells16705,screenPass:screenPass16705,screenPassRatio:screenPassRatio16705,triggered:scaleRefineTrigger16705,at:new Date().toISOString()};
    }
    if(scaleRefineTrigger16705){
      const savedLandAudit16702=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584,savedGen16702=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167;
      try{
        const coastCells16702=[];
        const nearOcean16702=(x16702,y16702,r16702=2)=>{for(let dy16702=-r16702;dy16702<=r16702;dy16702++)for(let dx16702=-r16702;dx16702<=r16702;dx16702++){const xx16702=x16702+dx16702,yy16702=y16702+dy16702;if(xx16702<0||xx16702>=hy.w||yy16702<0||yy16702>=hy.h)continue;if(hy.outsideLandMask16632[yy16702*hy.w+xx16702])return true;}return false;};
        for(let y16702=1;y16702<hy.h-1;y16702++)for(let x16702=1;x16702<hy.w-1;x16702++){const i16702=y16702*hy.w+x16702;if(hy.validityMask16584[i16702]===1&&nearOcean16702(x16702,y16702,2))coastCells16702.push({x:x16702,y:y16702});}
        const channelMain16705=percentile(hy.acc,.972);let coastalScreenPass16705=0;
        for(const p16705 of coastCells16702){const i16705=p16705.y*hy.w+p16705.x,sp16705=Number(hy.slope[i16705]),ac16705=Number(hy.acc[i16705]);if(Number.isFinite(sp16705)&&sp16705>=.20&&sp16705<=13.5&&Number.isFinite(ac16705)&&ac16705<channelMain16705)coastalScreenPass16705++;}
        const coastalScreenRatio16705=coastCells16702.length?coastalScreenPass16705/coastCells16702.length:1;
        window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705={maxCellM:Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0),coastalValidCells2:coastCells16702.length,coastalScreenPass2:coastalScreenPass16705,screenPassRatio:coastalScreenRatio16705,triggered:coastCells16702.length>=18&&coastalScreenRatio16705<.05,at:new Date().toISOString()};
        coastCells16702.sort((a,b)=>a.y-b.y);const tiles16702=[];
        if(coastCells16702.length>=18&&coastalScreenRatio16705<.05){
          const parts16702=Math.min(3,Math.max(1,Math.ceil(coastCells16702.length/90)));
          for(let part16702=0;part16702<parts16702;part16702++){
            const a16702=Math.floor(coastCells16702.length*part16702/parts16702),z16702=Math.floor(coastCells16702.length*(part16702+1)/parts16702),group16702=coastCells16702.slice(a16702,z16702);if(!group16702.length)continue;
            let minX16702=Math.min(...group16702.map(p=>p.x)),maxX16702=Math.max(...group16702.map(p=>p.x)),minY16702=Math.min(...group16702.map(p=>p.y)),maxY16702=Math.max(...group16702.map(p=>p.y));
            minX16702=Math.max(0,minX16702-4);maxX16702=Math.min(hy.w-1,maxX16702+4);minY16702=Math.max(0,minY16702-4);maxY16702=Math.min(hy.h-1,maxY16702+4);
            const b0=hy.bounds[0],b1=hy.bounds[1],b2=hy.bounds[2],b3=hy.bounds[3],lon16702=x=>b0+(x/(hy.w-1))*(b2-b0),lat16702=y=>b3-(y/(hy.h-1))*(b3-b1);
            const tb16702=[lon16702(minX16702),lat16702(maxY16702),lon16702(maxX16702),lat16702(minY16702)];if(tb16702[2]>tb16702[0]&&tb16702[3]>tb16702[1])tiles16702.push({id:'coast-'+(part16702+1),b:tb16702});
          }
        }
        const start16702=performance.now();
        const tileResults16702=await Promise.all(tiles16702.map(async tile16702=>{
          const d16702=await loadDEM(tile16702.b,112,112,6000,'scale refinement '+tile16702.id),g16702=earthlineLandValidityMask16584(d16702,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16702;
          const h16702=await hydrology(d16702,g16702.mask);h16702.outsideLandMask16632=g16702.outsideLandMask16632||null;h16702.inlandWaterMask16632=g16702.inlandWaterMask16632||null;
          const channel16702=percentile(h16702.acc,.972),elevs16702=[];
          const nearOut16702=(x,y,r=4)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=h16702.w||yy<0||yy>=h16702.h)continue;if(g16702.outsideLandMask16632[yy*h16702.w+xx])return true;}return false;};
          for(let y=1;y<h16702.h-1;y++)for(let x=1;x<h16702.w-1;x++){const i=y*h16702.w+x;if(g16702.mask[i]!==1||!nearOut16702(x,y,4))continue;const sp=Number(h16702.slope[i]),ac=Number(h16702.acc[i]),el=Number(h16702.elev[i]);if(Number.isFinite(sp)&&sp>=.20&&sp<=13.5&&Number.isFinite(ac)&&ac<channel16702&&Number.isFinite(el))elevs16702.push(el);}
          elevs16702.sort((a,b)=>a-b);const levels16702=[],seen16702=new Set();if(elevs16702.length){for(const frac of [.05,.12,.22,.34,.47,.60]){const e=elevs16702[Math.min(elevs16702.length-1,Math.floor((elevs16702.length-1)*frac))],k=Math.round(e*2)/2;if(!seen16702.has(k)){seen16702.add(k);levels16702.push(k);}}}
          const c16702=await makeContours(h16702,true,levels16702),s16702=await makeSwales(h16702,c16702,false,swaleJurisdictionGeometry16539,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16702;
          const dist16702=ll=>{const gg=llGrid(h16702,ll);if(!gg||!Number.isFinite(gg.x)||!Number.isFinite(gg.y))return null;const cx=Math.max(0,Math.min(h16702.w-1,Math.round(gg.x))),cy=Math.max(0,Math.min(h16702.h-1,Math.round(gg.y)));for(let r=0;r<=30;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const xx=cx+dx,yy=cy+dy;if(xx<0||xx>=h16702.w||yy<0||yy>=h16702.h)continue;if(g16702.outsideLandMask16632[yy*h16702.w+xx])return r;}return null;};
          const rows=(s16702.features||[]).map(f=>{const seg=f.geometry&&f.geometry.coordinates||[],mid=seg[Math.floor((seg.length-1)/2)]||null,dd=mid?dist16702(mid):null,km=Number.isFinite(dd)?dd*Math.max(h16702.cellX,h16702.cellY)/1000:null;return {f,seg,mid,km};}).filter(r=>Number.isFinite(r.km)&&r.km<=20).sort((a,b)=>(b.f.properties?.score||0)-(a.f.properties?.score||0));
          const picked=[];for(const r of rows){if(picked.length>=12)break;if(picked.some(p=>Math.hypot(p.f.properties?.rank||0-r.f.properties?.rank||0,0)<0))continue;picked.push(r);}
          return picked.map(r=>{const mg=llGrid(hy,r.mid);return {segment:r.seg,x:Math.max(1,Math.min(hy.w-2,Math.round(mg.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(mg.y))),slope:Number(r.f.properties?.slope_pct||.2),acc:0,maxAcc:0,score:Math.max(0,Math.min(1,Number(r.f.properties?.score||0)/100)),confidence:'preferred',minLinePx16632:4,refined16702:true,coastKm16702:Number(r.km.toFixed(1)),tile16702:tile16702.id};});
        }));
        const rawSupplemental16702=tileResults16702.flat().sort((a16702,b16702)=>(Number(b16702.score)||0)-(Number(a16702.score)||0)||(Number(a16702.coastKm16702)||Infinity)-(Number(b16702.coastKm16702)||Infinity));
        const seenMainCell16702=new Set();supplementalCandidates16702=[];
        for(const c16702 of rawSupplemental16702){const k16702=String(c16702.x)+','+String(c16702.y);if(seenMainCell16702.has(k16702))continue;seenMainCell16702.add(k16702);supplementalCandidates16702.push(c16702);}
        window.EARTHLINE_SCALE_REFINED_INPUT_16702={tiles:tiles16702.length,rawInput:rawSupplemental16702.length,input:supplementalCandidates16702.length,elapsedMs:Math.round(performance.now()-start16702),rows:supplementalCandidates16702.map(c=>({x:c.x,y:c.y,score:c.score,coastKm:c.coastKm16702,tile:c.tile16702}))};
      }catch(e16702){window.EARTHLINE_SCALE_REFINED_INPUT_16702={error:String(e16702)};}
      finally{window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16702;window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16702;}
    }
    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
  apply('integratedRefinement',needle,repl);

  return route.fulfill({response:resp,body});
});

await page.goto(URL+'?integrated_scale_refine='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||'')),started=Date.now();
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_SCALE_REFINED_INPUT_16702=null;window.EARTHLINE_REFINED_SELECTION_16702=null;window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
  let timedOut=false;try{await page.waitForFunction(prev=>{const token=String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!e||((!prev||token!==prev)&&!!token&&/screening published\./i.test(s));},prior,{timeout:70000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  const snap=await page.evaluate(q=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[],mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;},pts=sw.map(mid).filter(Array.isArray),reg=fn=>pts.filter(p=>fn(+p[0],+p[1])).length;
    let regions=null;if(/texas/i.test(q))regions={panhandle:reg((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:reg((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerGulf:reg((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:reg((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)};if(/california/i.test(q))regions={west:reg(x=>x<=-119.5),east:reg(x=>x>-119.5),north:reg((x,y)=>y>=37.5),south:reg((x,y)=>y<37.5),farEast:reg(x=>x>-118)};
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    return {trigger:window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705||null,input:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,selection:window.EARTHLINE_REFINED_SELECTION_16702||null,swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,regions,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  },stateName);
  const row={state:stateName,elapsedMs:Date.now()-started,timedOut,snap};rows.push(row);console.log('EARTHLINE_INTEGRATED_SCALE_REFINE '+JSON.stringify(row));
}
console.log('EARTHLINE_INTEGRATED_SCALE_REFINE_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
if(Object.values(patches).some(v=>v!==1)||rows.some(r=>r.timedOut||r.snap.lastError||!(Number(r.snap.totalMs)<=15000)||Number(r.snap.unsafe||0)!==0||Number(r.snap.outside?.swales||0)!==0||Number(r.snap.visible)!==Number(r.snap.published)))process.exitCode=1;
