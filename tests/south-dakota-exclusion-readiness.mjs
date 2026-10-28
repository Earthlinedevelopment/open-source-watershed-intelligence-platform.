import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831},deviceScaleFactor:1});
await installCandidateOrigin(context);

// Force the continuity condition that exposed South Dakota: all free Overpass endpoints unavailable.
// This does not change application code. It proves whether the already-loaded basemap can safely own exclusions.
for(const host of [
  'https://overpass-api.de/**',
  'https://overpass.private.coffee/**',
  'https://maps.mail.ru/**'
]) await context.route(host,r=>r.abort('failed'));

async function snapshot(page,label){
  return page.evaluate(label=>{
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
    let active=null,readyFlag=null,loaded=null,styleLoaded=null,layerCount=0,relevantLayerCount=0,sourceStates={};
    try{active=typeof earthlineMapActive==='function'?earthlineMapActive():null}catch(_){}
    try{readyFlag=typeof earthlineMapReady!=='undefined'?!!earthlineMapReady:null}catch(_){}
    try{loaded=!!map?.loaded?.()}catch(_){}
    try{styleLoaded=!!map?.isStyleLoaded?.()}catch(_){}
    try{
      const style=map?.getStyle?.()||{};
      const layers=Array.isArray(style.layers)?style.layers:[];
      layerCount=layers.length;
      const relevant=layers.filter(l=>{
        const earthlineOwned=/^earthline-/.test(String(l.id||'').toLowerCase())||/^earthline-/.test(String(l.source||'').toLowerCase());
        if(earthlineOwned)return false;
        const id=((l.id||'')+' '+(l['source-layer']||'')).toLowerCase();
        const line=l.type==='line',area=l.type==='fill'||l.type==='fill-extrusion';
        const transport=/road|street|bridge|tunnel|path|track|service|transportation|highway/.test(id);
        const structure=/building|structure|parking/.test(id);
        const water=/water|river|lake|reservoir|stream|canal|wetland/.test(id);
        const parkingCarrier=area&&/landuse|land-use/.test(id);
        return (line&&(transport||structure||water))||(area&&(transport||structure||parkingCarrier||water));
      });
      relevantLayerCount=relevant.length;
      const sources=[...new Set(relevant.map(l=>l.source).filter(Boolean))];
      for(const id of sources){
        try{sourceStates[id]=!!map?.isSourceLoaded?.(id)}catch(_){sourceStates[id]=false}
      }
    }catch(_){}
    return {
      label,active,readyFlag,loaded,styleLoaded,layerCount,relevantLayerCount,sourceStates,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
      run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      coverage:(typeof M!=='undefined'&&M?.vectorNoBuildCoverage)||null,
      prefetch:(typeof M!=='undefined'&&M?._mappedExclusionStylePrefetch16459)||null
    };
  },label);
}

async function runCase(label,waitForStyle,forceReadyFlagFalse=false){
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?sd_exclusion_readiness='+label+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill('South Dakota');
  await page.waitForTimeout(800);
  const option=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/South Dakota/i}).first();
  if(await option.count())await option.click({timeout:10000}).catch(()=>{});
  await page.evaluate(()=>document.getElementById('runBtn')?.click());
  await page.waitForFunction(()=>{
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    return /screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;
  },null,{timeout:90000,polling:100});

  const target={lng:-103.47572161339522,lat:43.86130075842892};
  await page.evaluate(t=>{
    const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
    if(!m)throw new Error('map unavailable');
    m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
    try{m.fire?.('dragend')}catch(_){}
  },target);
  await page.waitForFunction(t=>{
    const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return !!p&&Math.abs(Number(p.lng)-t.lng)<=0.00008&&Math.abs(Number(p.lat)-t.lat)<=0.00008;
  },target,{timeout:15000,polling:100});

  const timeline=[];
  timeline.push(await snapshot(page,'target-ready'));
  if(forceReadyFlagFalse){
    const forced=await page.evaluate(()=>{
      try{
        if(typeof earthlineMapReady==='undefined')return {supported:false,before:null,after:null};
        const before=!!earthlineMapReady;
        earthlineMapReady=false;
        return {supported:true,before,after:!!earthlineMapReady};
      }catch(e){return {supported:false,error:String(e)}}
    });
    timeline.push({label:'forced-ready-flag-false',forced});
  }
  if(waitForStyle){
    await page.waitForFunction(()=>{
      try{
        const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
        if(!map||!map.getStyle)return false;
        const layers=map.getStyle()?.layers||[];
        const relevant=layers.filter(l=>{
          const own=/^earthline-/.test(String(l.id||'').toLowerCase())||/^earthline-/.test(String(l.source||'').toLowerCase());
          if(own)return false;
          const id=((l.id||'')+' '+(l['source-layer']||'')).toLowerCase();
          const line=l.type==='line',area=l.type==='fill'||l.type==='fill-extrusion';
          return (line&&/road|street|bridge|tunnel|path|track|service|transportation|highway|water|river|stream|canal/.test(id))||
                 (area&&/building|structure|parking|landuse|water|lake|reservoir|wetland/.test(id));
        });
        if(!relevant.length)return false;
        const sources=[...new Set(relevant.map(l=>l.source).filter(Boolean))];
        return sources.every(id=>{try{return map.isSourceLoaded(id)}catch(_){return false}});
      }catch(_){return false}
    },null,{timeout:12000,polling:100}).catch(()=>{});
    timeline.push(await snapshot(page,'after-style-wait'));
  }

  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const button=page.locator('#earthlineDeclareProperty16169');
  await button.waitFor({state:'visible',timeout:15000});
  const disabled=await button.isDisabled().catch(()=>false);
  if(!disabled)await button.click({timeout:10000});
  await page.waitForFunction(prev=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const block=window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null;
    return (!!a&&Number(a.serial||0)>prev&&a.settled===true)||!!block;
  },before,{timeout:90000,polling:100}).catch(()=>{});
  await page.waitForTimeout(500);
  timeline.push(await snapshot(page,'after-property'));
  const final=timeline[timeline.length-1];
  const result={
    label,waitForStyle,forceReadyFlagFalse,disabled,timeline,errors,
    pass:final?.publication?.published===true&&final?.run?.settled===true&&final?.run?.result===true,
    blockedReason:final?.run?.error||final?.coverage?.unverifiedReason||null
  };
  await page.close();
  return result;
}

const immediate=await runCase('immediate',false,false);
const styleWait=await runCase('style-wait',true,false);
const forcedReadyFalse=await runCase('forced-ready-false',false,true);
const out={at:new Date().toISOString(),immediate,styleWait,forcedReadyFalse};
console.log('EARTHLINE_SD_EXCLUSION_READINESS '+JSON.stringify(out));
await context.close();
await browser.close();

// Diagnostic success means we captured both cases; product pass/fail is reported in JSON.
if(!immediate.timeline?.length||!styleWait.timeline?.length||!forcedReadyFalse.timeline?.length)process.exitCode=1;
