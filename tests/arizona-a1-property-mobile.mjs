import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?az_a1_property='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{state:'attached',timeout:25000}); await page.waitForTimeout(1100);
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(250);}
await page.locator('#searchInput').click(); await page.locator('#searchInput').fill('Arizona'); await page.waitForTimeout(800);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())try{await opt.tap({timeout:8000});await page.waitForTimeout(250)}catch(_){}
await page.evaluate(()=>document.getElementById('runBtn')?.click());
try{await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''))&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:45000,polling:150})}catch(_){}
await page.waitForTimeout(700);
const controls=await page.evaluate(()=>[...document.querySelectorAll('button,[role="button"]')].map((e,i)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{i,id:e.id,cls:String(e.className||''),text:String(e.textContent||e.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim(),visible:s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}}).filter(x=>x.visible&&(/\bA1\b/i.test(x.text)||/zoom to location/i.test(x.text)||/20-acre|20 acre|property/i.test(x.text))));
console.log('EARTHLINE_AZ_A1_CONTROLS '+JSON.stringify(controls));

let a1=page.locator('[aria-label="Open details for A1"]').first();
if(!(await a1.count()))a1=page.getByText(/^A1$/i).first();
let a1Clicked=false;
if(await a1.count()){try{await a1.tap({timeout:8000});a1Clicked=true}catch(_){const bb=await a1.boundingBox();if(bb){await page.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);a1Clicked=true}}await page.waitForTimeout(650);}
const a1Detail=await page.evaluate(()=>[...document.querySelectorAll('button,[role="button"],a')].map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {id:e.id,tag:e.tagName,cls:String(e.className||''),aria:e.getAttribute('aria-label')||'',text:String(e.textContent||'').replace(/\s+/g,' ').trim(),visible:s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}}).filter(x=>x.visible&&(/A1/i.test(x.text+x.aria)||/zoom to location/i.test(x.text+x.aria))));
console.log('EARTHLINE_AZ_A1_DETAIL '+JSON.stringify({a1Clicked,a1Detail}));
let zoom=page.getByRole('button',{name:/zoom to location/i}).first();
if(!(await zoom.count()))zoom=page.locator('button').filter({hasText:/zoom to location/i}).first();
let zoomClicked=false;
if(await zoom.count()){await zoom.tap({timeout:8000});zoomClicked=true;await page.waitForTimeout(1500);}
const afterZoom=await page.evaluate(()=>({
  panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188'),
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  selected:window.EARTHLINE_SELECTED_CORRIDOR_16323||window.EARTHLINE_SELECTED_REGIONAL_CORRIDOR_16323||null,
  tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
  mapCenter:(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat,zoom:m.getZoom()}:null}catch(_){return null}})()
}));
if(!afterZoom.panelOpen){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(300);}
const prop=page.locator('#earthlineDeclareProperty16169');
const propVisible=await prop.isVisible().catch(()=>false);
let propClicked=false;
if(propVisible){await prop.tap({timeout:8000});propClicked=true;}
try{await page.waitForFunction(()=>{
 const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,s=String(document.documentElement.dataset.earthlinePropertyRunState||'');
 return !!(a&&a.settled===true)||s==='failed';
},{timeout:30000,polling:120})}catch(_){}
await page.waitForTimeout(500);
const out=await page.evaluate(()=>({
 zoomClicked:document.getElementById('earthlineMobileZoomSpinner17003')!=null,
 tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
 runState:String(document.documentElement.dataset.earthlineRunState||''),
 propState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
 audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
 publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
 safety:M?.safetyAudit15806||null,
 lock:M?.propertyResultLock15815||null,
 swales:Number(M?.swales?.length||0),
 safeSwales:Number(M?.authoritativeSafeSwales15815?.features?.length||M?.authoritativeSafeSwales15815?.length||0),
 render:(()=>{
   try{
     const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
     const ids=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
     const src=m?.getSource?.('earthline-property-safe-visible-16221');
     const data=src&&(src._data||src._options?.data);
     const naturalSource=m?.getSource?.('earthline-property-swale-texture-16174');
     const naturalData=naturalSource&&(naturalSource._data||naturalSource._options?.data);
     const naturalIds=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'];
     return {
       sourceFeatures:Array.isArray(data?.features)?data.features.length:null,
       textureAudit:(()=>{try{return typeof window.earthlinePropertyTextureAudit16169==='function'?window.earthlinePropertyTextureAudit16169():null}catch(e){return {error:String(e)}}})(),
       naturalSourceFeatures:Array.isArray(naturalData?.features)?naturalData.features.length:null,
       naturalLayers:naturalIds.map(id=>({
         id,exists:!!m?.getLayer?.(id),
         visibility:m?.getLayoutProperty?.(id,'visibility')??null,
         lineOpacity:m?.getPaintProperty?.(id,'line-opacity')??null,
         fillOpacity:m?.getPaintProperty?.(id,'fill-opacity')??null,
         width:m?.getPaintProperty?.(id,'line-width')??null
       })),
       layers:ids.map(id=>({
         id,exists:!!m?.getLayer?.(id),
         visibility:m?.getLayoutProperty?.(id,'visibility')??null,
         opacity:m?.getPaintProperty?.(id,'line-opacity')??null,
         width:m?.getPaintProperty?.(id,'line-width')??null
       }))
     };
   }catch(e){return {error:String(e)}}
 })(),
 waterPaths:Number(M?.waterPaths?.features?.length||M?.waterPaths?.length||M?.flowPaths?.features?.length||M?.flowPaths?.length||0),
 aquifers:Number(M?.usgsAquifers?.length||0),
 recharge:Number(M?.rechZones?.length||0),
 status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
}));
await page.screenshot({path:'/tmp/earthline-az-a1-property-mobile.png',fullPage:true});
console.log('EARTHLINE_AZ_A1_PROPERTY '+JSON.stringify({controls,a1Clicked,a1Detail,zoomClicked,afterZoom,propVisible,propClicked,out,errs}));


// M78 exact Arizona live controls from user-reported failing frames.
async function runExactPropertyM78(lng,lat,label){
  await page.evaluate(({lng,lat,label})=>{
    window.earthlineSetPropertyTarget16201?.({lng,lat,source:'m78-'+label},{openPanel:false});
  },{lng,lat,label});
  await page.waitForTimeout(150);
  await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16169?.());
  try{
    await page.waitForFunction(()=>!!window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled,{timeout:30000,polling:120});
  }catch(_){}
  const expectedElderPrefix=lng.toFixed(6)+'|'+lat.toFixed(6)+'|';
  try{
    await page.waitForFunction((prefix)=>{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097;
      return !!e && (e.state==='committed'||e.state==='failed') && String(e.propertyRunIdentity||'').startsWith(prefix);
    },expectedElderPrefix,{timeout:30000,polling:120});
  }catch(_){}
  await page.waitForTimeout(250);
  return await page.evaluate(({lng,lat,label})=>{
    const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    const publication=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const safeVisibility=(typeof window.earthlinePropertySafeVisibilityAudit16221==='function'
      ?window.earthlinePropertySafeVisibilityAudit16221()
      :(window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null));
    const decl=window.EARTHLINE_PROPERTY_DECLARATION_16169||null;
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return {
      label,lng,lat,
      target:target?{lng:target.lng,lat:target.lat,source:target.source}:null,
      declaration:decl?.center||null,
      propertyRunIdentity:elder?.propertyRunIdentity||null,
      elderIdentityOk:String(elder?.propertyRunIdentity||'').startsWith(lng.toFixed(6)+'|'+lat.toFixed(6)+'|'),
      elderState:elder?.state||null,
      elderFeatures:Number(elder?.featureCount||0),
      elderCandidates:Number(elder?.dynamicCandidatePoolCount||0),
      elderError:elder?.dynamicError||elder?.error||null,
      swales:Number(publication?.safeCount||publication?.publicationCount||0),
      swalesVisible:!!(safeVisibility?.visible||(safeVisibility?.delegatedToNatural&&Number(safeVisibility?.naturalRenderedFeatures||0)>0)),
      safeVisibility,
      publication,
      systems:(function(){
        const wp=M?.authoritativeWaterPublication15824||null;
        const wf=M?.authoritativeWaterPaths15824;
        const waterFeatures=Array.isArray(wf?.features)?wf.features:[];
        const waterPayload=JSON.stringify(waterFeatures.map(f=>f?.geometry?.coordinates||null));
        let wh=2166136261;for(let i=0;i<waterPayload.length;i++){wh^=waterPayload.charCodeAt(i);wh=Math.imul(wh,16777619)}
        const aqOwner=M?.propertyAquiferOwner16393||null;
        const aqLast=M?.usgsAquiferLastResult16393||null;
        const aqStatus=String(M?.usgsAquiferStatus||'');
        const aqPolys=Number(M?.usgsAquifers?.length||0);
        const aqWells=Number(M?.vtGroundwaterWells16398?.length||0);
        const runGen=Number(M?.searchGen||0);
        const orb=document.getElementById('earthlinePropertyOrb16173')||document.querySelector('[data-earthline-property-orb],.earthline-property-orb');
        return {
          runGen,
          waterCommitted:wp?.committed===true&&wp?.verified===true,
          waterSearchGen:Number(wp?.searchGen),
          waterIdentityOk:Number(wp?.searchGen)===runGen,
          waterCount:Number(wp?.featureCount||waterFeatures.length||0),
          waterFingerprint:(wh>>>0).toString(16).padStart(8,'0'),
          waterVisible:Number(M?.directWaterRenderer15824?.visiblePaths||0),
          aquiferOwnerGen:Number(aqOwner?.searchGen),
          aquiferOwnerOk:!aqOwner||Number(aqOwner?.searchGen)===runGen,
          aquiferStatus:aqStatus,
          aquiferPolys:aqPolys,
          aquiferWells:aqWells,
          aquiferLastGen:Number(aqLast?.searchGen),
          aquiferClass:[aqStatus,aqPolys,aqWells].join('|'),
          aquiferRequestKey:String(M?.usgsAquiferRequestKey16388||''),
          aquiferCompletedKey:String(M?.usgsAquiferCompletedKey16393||''),
          orbRunning:!!(orb&&(orb.dataset?.running==='1'||orb.classList?.contains('running')||orb.getAttribute?.('aria-busy')==='true'))
        };
      })(),
      provenance:(function(){
        const p=M?.noBuildProvenance15843||{};
        const v=M?.vectorNoBuildCoverage||{};
        return {
          m782Served:document.documentElement.innerHTML.includes('fail closed against self-generated exclusions'),
          noBuildStamp:p.noBuildStamp||null,
          sourceStateFingerprint:p.sourceStateFingerprint||null,
          scientificInputFingerprint:p.scientificInputFingerprint||null,
          hashes:p.sourceHashes||null,
          satelliteCanvasAvailable:!!p.satelliteCanvasAvailable,
          imperviousRasterAvailable:!!p.imperviousRasterAvailable,
          noBuildCellsFromWater:Number(p.noBuildCellsFromWater||0),
          noBuildCellsFromImpervious:Number(p.noBuildCellsFromImpervious||0),
          noBuildCellsFromVector:Number(p.noBuildCellsFromVector||0),
          noBuildCellsFromManual:Number(p.noBuildCellsFromManual||0),
          noBuildCellsAfterUnion:Number(p.noBuildCellsAfterUnion||0),
          noBuildCellsAfterDilation:Number(p.noBuildCellsAfterDilation||0),
          vector:{
            sourceTier:v.sourceTier||null,acquisitionResult:v.acquisitionResult||null,
            evidencePath:v.evidencePath17630||null,layerCount:Number(v.layerCount||0),
            sourceFeatureCount:Number(v.sourceFeatureCount||0),relevantFeatureCount:Number(v.relevantFeatureCount||0),
            processedFeatureCount:Number(v.processedFeatureCount||0),
            styleQuerySuccess:v.styleQuerySuccess16516===true,styleQueryFailure:v.styleQueryFailure16516===true
          }
        };
      })(),
      ...(function(){
        const fc=M?.authoritativeSafeSwales15815;
        const features=Array.isArray(fc?.features)?fc.features:[];
        const payload=JSON.stringify(features.map(f=>f?.geometry?.coordinates||null));
        let h=2166136261;
        for(let i=0;i<payload.length;i++){h^=payload.charCodeAt(i);h=Math.imul(h,16777619)}
        const boundary=Array.isArray(M?.analysisBoundaryLngLat)?M.analysisBoundaryLngLat:[];
        let west=Infinity,south=Infinity,east=-Infinity,north=-Infinity;
        for(const p of boundary){const x=Number(p?.[0]),y=Number(p?.[1]);if(Number.isFinite(x)&&Number.isFinite(y)){west=Math.min(west,x);east=Math.max(east,x);south=Math.min(south,y);north=Math.max(north,y)}}
        let swaleFrameOk=boundary.length>=3,outsidePoints=0,totalPoints=0,swWest=Infinity,swSouth=Infinity,swEast=-Infinity,swNorth=-Infinity,maxOutsideDeg=0,firstOutside=null;
        const visit=(v)=>{
          if(Array.isArray(v)&&v.length>=2&&Number.isFinite(Number(v[0]))&&Number.isFinite(Number(v[1]))){
            const x=Number(v[0]),y=Number(v[1]);totalPoints++;
            swWest=Math.min(swWest,x);swEast=Math.max(swEast,x);swSouth=Math.min(swSouth,y);swNorth=Math.max(swNorth,y);
            const dx=x<west?west-x:(x>east?x-east:0),dy=y<south?south-y:(y>north?y-north:0);
            if(dx>1e-7||dy>1e-7){outsidePoints++;swaleFrameOk=false;maxOutsideDeg=Math.max(maxOutsideDeg,dx,dy);if(!firstOutside)firstOutside={x,y,dx,dy}}
            return;
          }
          if(Array.isArray(v))for(const q of v)visit(q);
        };
        for(const ft of features)visit(ft?.geometry?.coordinates);
        return {
          swaleFingerprint:(h>>>0).toString(16).padStart(8,'0'),swaleFrameOk,
          boundaryBounds:{west,south,east,north},
          swaleBounds:[swWest,swSouth,swEast,swNorth].every(Number.isFinite)?{west:swWest,south:swSouth,east:swEast,north:swNorth}:null,
          outsidePoints,totalPoints,maxOutsideDeg,firstOutside
        };
      })()
    };
  },{lng,lat,label});
}
const controlsM78=[
  {key:'az-good',lng:-111.93178,lat:34.21607},
  {key:'az-bad',lng:-111.93582,lat:34.21605},
  {key:'poudre',lng:-105.2237,lat:40.6412}
];
const exactM78=[];
for(const control of controlsM78){
  for(let repeat=1;repeat<=5;repeat++){
    exactM78.push(await runExactPropertyM78(control.lng,control.lat,control.key+'-'+repeat));
  }
}
function sameField(rows,getter){return rows.length===5&&rows.every(r=>getter(r)===getter(rows[0]))}
const controlResultsM78=controlsM78.map(control=>{
  const rows=exactM78.filter(r=>r.label.startsWith(control.key+'-'));
  const stable={
    scientific: sameField(rows,r=>String(r.publication?.scientificInputFingerprint||'')),
    noBuild: sameField(rows,r=>String(r.publication?.noBuildMaskHash||'')),
    swales: sameField(rows,r=>String(r.swaleFingerprint||'')),
    water: sameField(rows,r=>String(r.systems?.waterFingerprint||'')),
    waterCount: sameField(rows,r=>Number(r.systems?.waterCount||0)),
    aquifer: sameField(rows,r=>String(r.systems?.aquiferClass||'')),
    propertyIdentity: rows.every(r=>r.elderIdentityOk===true),
    waterIdentity: rows.every(r=>r.systems?.waterIdentityOk===true),
    aquiferIdentity: rows.every(r=>r.systems?.aquiferOwnerOk===true),
    elderCommitted: rows.every(r=>r.elderState==='committed'),
    swalesVisible: rows.every(r=>r.swales>0&&r.swalesVisible===true),
    waterCommitted: rows.every(r=>r.systems?.waterCommitted===true&&r.systems?.waterCount>0),
    orbClear: rows.every(r=>r.systems?.orbRunning!==true),
    frameTolerance: rows.every(r=>Number(r.maxOutsideDeg||0)<=0.000005)
  };
  return {key:control.key,stable,pass:Object.values(stable).every(Boolean),rows:rows.map(r=>({
    label:r.label,swales:r.swales,swaleFingerprint:r.swaleFingerprint,
    scientificInputFingerprint:r.publication?.scientificInputFingerprint||null,
    noBuildMaskHash:r.publication?.noBuildMaskHash||null,
    elderState:r.elderState,elderIdentityOk:r.elderIdentityOk,elderFeatures:r.elderFeatures,
    waterCount:r.systems?.waterCount,waterFingerprint:r.systems?.waterFingerprint,
    waterIdentityOk:r.systems?.waterIdentityOk,waterVisible:r.systems?.waterVisible,
    aquiferClass:r.systems?.aquiferClass,aquiferOwnerOk:r.systems?.aquiferOwnerOk,
    orbRunning:r.systems?.orbRunning,maxOutsideDeg:r.maxOutsideDeg
  }))};
});
const repeatOk=controlResultsM78.every(r=>r.pass);
console.log('EARTHLINE_M78_FIVE_REPEAT_CONTROLS '+JSON.stringify({repeatOk,controlResultsM78}));
const textureStackM78=await page.evaluate(async()=>{
  try{
    const fn=window.earthlineSyncPropertyTexture16169;
    if(typeof fn!=='function')return {ok:false,error:'texture sync owner unavailable'};
    const result=await Promise.resolve(fn('m78-stack-force'));
    return {ok:true,result,audit:(typeof window.earthlinePropertyTextureAudit16169==='function'?window.earthlinePropertyTextureAudit16169():window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null),backgroundError:window.EARTHLINE_PROPERTY_TEXTURE_BACKGROUND_ERROR_16477||null};
  }catch(e){return {ok:false,error:String(e&&e.message||e),stack:String(e&&e.stack||'')}}
});
console.log('EARTHLINE_M78_TEXTURE_STACK '+JSON.stringify(textureStackM78));
if(!repeatOk)process.exitCode=1;

await browser.close();
const visibleFallback=Number(out?.render?.sourceFeatures||0)>0 && Array.isArray(out?.render?.layers) && out.render.layers.some(x=>x.exists&&x.visibility!=='none'&&Number(x.opacity)>0);
console.log('EARTHLINE_TEXTURE_DIAGNOSTIC '+JSON.stringify(out?.render||null));
if(!propClicked||!out.audit?.settled)process.exitCode=1;

// rerun with render-layer audit

// exact A1 detail tap rerun

// exact A1 + layer/source audit

// verify fail-visible 17011

// diagnose natural replacement visibility after safe fallback fade
// M78 live ownership verification
// M78 post-deploy live rerun 2

// M78 exact live rerun trigger 2026-10-25

// M78.1 repair-runner trigger

// M78.1 valid-workflow trigger

// M78.1 post-production verification trigger

// M78.2 exact self-exclusion verification trigger

// M78.2 valid-workflow production verification trigger

// M78.2 hardened-anchor verification trigger

// M78.2 input-fingerprint discriminator trigger

// M78.3 five-repeat four-system binding gate
