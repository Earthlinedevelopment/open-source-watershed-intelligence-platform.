import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,readFileSync,statSync,existsSync} from 'node:fs';
import path from 'node:path';
const root=process.cwd(),base='https://earthlinedevelopment.org/';
const center={lng:-111.93066,lat:34.21568};
mkdirSync('artifacts/m96-visible-property',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:950}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.route('https://earthlinedevelopment.org/**',route=>{
 const req=new URL(route.request().url());
 let rel;try{rel=decodeURIComponent(req.pathname).replace(/^\/+/,'')||'index.html'}catch{return route.abort()}
 const loc=path.resolve(root,rel);
 if((loc!==root&&!loc.startsWith(root+path.sep))||!existsSync(loc)||!statSync(loc).isFile())return route.abort();
 const ext=path.extname(loc).toLowerCase();
 const ctype={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.geojson':'application/geo+json','.css':'text/css','.png':'image/png','.webp':'image/webp'};
 return route.fulfill({status:200,contentType:ctype[ext]||'application/octet-stream',body:readFileSync(loc)});
});
let snapshot=null,fatal=null;
try{
 await page.goto(base+'?m95_candidate='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#searchInput').fill('Arizona');
 await page.locator('#runBtn').click();
 await page.waitForFunction(()=>window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0||window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:50000,polling:160});
 const region=await page.evaluate(()=>({count:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated,error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970}));
 if(!region.count)throw Error('Regional publication missing: '+JSON.stringify(region));
 await page.evaluate(pos=>{const mp=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);mp.stop();mp.jumpTo({center:[pos.lng,pos.lat],zoom:17.7});},center);
 await page.waitForTimeout(1600);
 const before=await page.evaluate(()=>({
   target:window.EARTHLINE_PROPERTY_TARGET_16201,center:(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap)?.getCenter?.()
 }));
 if(Math.abs(Number(before.target?.lng)-center.lng)>1e-5||Math.abs(Number(before.target?.lat)-center.lat)>1e-5)
   throw Error('Preclick map target not selected physical location: '+JSON.stringify(before));
 await page.evaluate(()=>{
   const logs=[];let previous=window.EARTHLINE_PROPERTY_TARGET_16201;
   const center=()=>{const c=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap)?.getCenter?.();return c?{lng:c.lng,lat:c.lat}:null;};
   Object.defineProperty(window,'EARTHLINE_PROPERTY_TARGET_16201',{
      configurable:true,
      get(){return previous;},
      set(v){logs.push({type:'target-write',to:{lng:v?.lng,lat:v?.lat,source:v?.source},map:center(),stack:String(new Error().stack).split('\n').slice(1,5).join('|')});previous=v;}
   });
   for(const type of ['pointerover','pointerdown','focus','click']){
     document.addEventListener(type,e=>{
       if(e.target?.closest?.('#earthlineDeclareProperty16169'))
         logs.push({type,at:Date.now(),target:previous?{lng:previous.lng,lat:previous.lat}:null,map:center()});
     },true);
   }
   window.M95_EVENT_TRACE=logs;
 });
 const button=page.locator('#earthlineDeclareProperty16169');
 if(!await button.isVisible()||!await button.isEnabled())throw Error('Normal Property control not visible/enabled');
 await button.click();
 await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:55000,polling:150});
 try{await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed'&&window.EARTHLINE_ELDER_TREE_LAST_17097?.featureCount>0,null,{timeout:16000,polling:250})}catch{}
 await page.waitForTimeout(1200);
 snapshot=await page.evaluate(({center,before,region})=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
  const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||{};
  const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
  const map=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);
  const es=map?.getSource?.('earthline-elder-trees-17097');
  const se=window.earthlineGetExclusionEvidence16516?.();
  const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  const ex=document.getElementById('earthlineExclusionEvidence16516');
  const safe=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};
  const out={center,before,region,target,runCenter:a.center,
   tier:document.documentElement.dataset.earthlineAnalysisTier,
   run:a?{stage:a.stage,settled:a.settled,result:a.result,corridors:a.corridors,error:a.error}:null,
   publication:{published:p.published,safeCount:p.safeCount,source:p.sourceStateFingerprint},
   safe:{count:safe.count,visible:safe.visible},elder:{state:e.state,count:e.featureCount,id:e.propertyRunIdentity,sourceCount:es?._data?.features?.length||0,layer:!!map?.getLayer?.('earthline-elder-tree-points-17097')},
   exclusion:{tier:se?.sourceTier,acquisition:se?.acquisitionResult,kind:se?.kind,allowed:se?.publicationAllowed,uiKind:ex?.dataset.kind,uiText:ex?.innerText?.slice(0,300)},status:document.getElementById('earthlineVermontStatus16147')?.textContent?.slice(0,300)};
  return out;
 },{center,before,region});
 await page.screenshot({path:'artifacts/m96-visible-property/pinned-real-user-click.png',fullPage:false});
 const targetMatches=o=>Math.abs(Number(o?.lng)-center.lng)<1e-5&&Math.abs(Number(o?.lat)-center.lat)<1e-5;
 snapshot.visual=await page.evaluate(()=>{
  const m=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);
  const ids=['earthline-property-safe-water-16221','earthline-property-safe-water-second-m96'];
  const elder='earthline-elder-tree-points-17097';
  const get=id=>({exists:!!m?.getLayer?.(id),visible:m?.getLayer?.(id)?m.getLayoutProperty(id,'visibility')!=='none':false,
    opacity:m?.getLayer?.(id)?m.getPaintProperty(id,'line-opacity'):null,
    dash:m?.getLayer?.(id)?m.getPaintProperty(id,'line-dasharray'):null,
    offset:m?.getLayer?.(id)?m.getPaintProperty(id,'line-offset'):null});
  let blueRendered=null,elderRendered=null;
  try{blueRendered=m?.queryRenderedFeatures?.({layers:ids.filter(x=>m.getLayer(x))})?.length??null}catch{}
  try{elderRendered=m?.queryRenderedFeatures?.({layers:[elder]})?.length??null}catch{}
  return {water:ids.map(get),blueRendered,elderRendered,elderLabel:m?.getLayer?.(elder)?m.getLayoutProperty(elder,'text-field'):null,
    elderPinScale:m?.getLayer?.(elder)?m.getLayoutProperty(elder,'icon-size'):null};
});
 console.log('M96_RENDERED_VISUAL '+JSON.stringify(snapshot.visual));
 const checks={
  selectedTargetPreserved:targetMatches(snapshot.target),
  publicationCenterPreserved:targetMatches(snapshot.runCenter),
  propertyPublished:snapshot.tier==='property'&&snapshot.run.settled&&snapshot.run.result&&snapshot.publication.published,
  pinnedSwalePresent:snapshot.publication.safeCount>0&&snapshot.safe.visible===true,
  elderPresent:snapshot.elder.state==='committed'&&snapshot.elder.count>0&&snapshot.elder.sourceCount>0&&snapshot.elder.layer,
  twoBlueDottedStrips:snapshot.visual?.water?.length===2&&snapshot.visual.water.every(x=>x.exists&&x.visible&&Array.isArray(x.dash)&&x.dash.length===2),
  oppositeBlueOffsets:snapshot.visual.water[0]?.offset?.[0]==='interpolate'&&snapshot.visual.water[1]?.offset?.[0]==='interpolate',
  actualBlueOpacityVisible:snapshot.visual.water.every(x=>typeof x.opacity==='number'&&x.opacity>=0.95),
  elderCandidateMapLabel:JSON.stringify(snapshot.visual.elderLabel||'').includes('ELDER CANDIDATE'),
  blueMapActuallyRendered:snapshot.visual.blueRendered>0,
  elderPinsActuallyRendered:snapshot.visual.elderRendered>0,
  screenedClearTruth:snapshot.exclusion.acquisition==='screened-clear'&&snapshot.exclusion.kind==='open-data'&&snapshot.exclusion.uiKind==='open-data'&&!/must remain blocked/i.test(snapshot.exclusion.uiText||'')
 };
 snapshot.trace=await page.evaluate(()=>window.M95_EVENT_TRACE||[]);
 console.log('M95_EVENT_TRACE '+JSON.stringify(snapshot.trace));
 snapshot.checks=checks;snapshot.pass=Object.values(checks).every(Boolean)&&errors.length===0;
 console.log('M96_REAL_VISUAL_CANDIDATE '+JSON.stringify({...snapshot,errors}));
 if(!snapshot.pass)process.exitCode=1;
}catch(e){fatal=String(e);console.log('M96_REAL_VISUAL_FATAL '+fatal);process.exitCode=1;}
writeFileSync('artifacts/m96-visible-property/results.json',JSON.stringify({snapshot,fatal,errors},null,2));
await browser.close();