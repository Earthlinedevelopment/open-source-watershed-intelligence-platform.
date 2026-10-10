import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE=String(process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/').replace(/\/?$/,'/');
const HOSTMAP=process.env.EARTHLINE_HOSTMAP==='1';
const STATES=(process.env.STATES||'Vermont|New York|Arkansas|Iowa|Oklahoma|Texas|Colorado|Maryland|California')
  .split('|').map(s=>s.trim()).filter(Boolean);
const OUT=process.env.OUT||'artifacts/v1-priority-geographic-17090';
const HARD_CEILING_MS=15000;
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({
  headless:true,
  args:HOSTMAP?['--host-resolver-rules=MAP earthlinedevelopment.org 127.0.0.1']:[]
});
const rows=[];

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function ensurePanelOpen(page){
  const open=await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'));
  if(open)return true;
  const orb=page.locator('#earthlineRailSearch16188');
  if(!await orb.count())return false;
  await orb.click();
  await page.waitForTimeout(250);
  return await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'));
}

async function runRegional(page,state){
  await ensurePanelOpen(page);
  const before=await page.evaluate(()=>Number((typeof M!=='undefined'&&M&&M.searchGen)||0));
  const started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    if(!i||!b)throw new Error('Regional controls unavailable');
    i.focus();i.value=q;
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    b.click();
  },state);
  try{
    await page.waitForFunction(({state,before})=>{
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      if(err)return true;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||
                          document.getElementById('earthlineTierNotice16173')?.textContent||'');
      const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
      const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const sg=Number((typeof M!=='undefined'&&M&&M.searchGen)||0);
      const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
      const q=norm(state), identity=norm(pkg?.identity?.name)===q || norm(root?.query).includes(q) ||
        (q==='vermont'&&/vermont/i.test(String(root?.query||status)));
      return /screening published\./i.test(status)&&!!perf&&identity&&sg>=Number(before||0);
    },{state,before},{timeout:26000,polling:120});
  }catch(_){}
  return await page.evaluate(({state,started})=>{
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||
                        document.getElementById('earthlineTierNotice16173')?.textContent||'').trim();
    const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    const targets=sw
      .filter(f=>f?.geometry?.type==='LineString'&&Array.isArray(f.geometry.coordinates)&&f.geometry.coordinates.length)
      .sort((a,b)=>Number(a.properties?.rank??999999)-Number(b.properties?.rank??999999))
      .slice(0,6)
      .map((f,index)=>{
        const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
        return {index,lng:Number(c[0]),lat:Number(c[1]),rank:Number(f.properties?.rank??index+1),
          grade:String(f.properties?.grade||''),score:Number(f.properties?.score||0)};
      });
    return {
      state,wallMs:Date.now()-started,coreMs:Number(perf?.totalMs||0),
      generated:Number(pub?.generated??0),visible:Number(display?.swaleLines??pub?.overlaySwaleLines??0),
      unsafe:Number(flow?.unsafeSegments??0),outsideSwales:Number(boundary?.outsideAfterClip?.swales??0),
      rootPass:root?.pass!==false,error:err,status,targets
    };
  },{state,started});
}

async function stabilizeCameraAt(page,target){
  let final=null;
  for(let i=0;i<4;i++){
    final=await page.evaluate(t=>{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      if(!m)throw new Error('map unavailable');
      try{m.stop?.()}catch(_){}
      m.jumpTo({center:[t.lng,t.lat],zoom:16.2,bearing:0,pitch:0});
      const c=m.getCenter();
      return {lng:Number(c.lng),lat:Number(c.lat),zoom:Number(m.getZoom())};
    },target);
    await page.waitForTimeout(350);
    final=await page.evaluate(()=>{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();
      return c?{lng:Number(c.lng),lat:Number(c.lat),zoom:Number(m.getZoom())}:null;
    });
    if(final&&Math.abs(final.lng-target.lng)<0.00002&&Math.abs(final.lat-target.lat)<0.00002){
      await page.waitForTimeout(450);
      const settled=await page.evaluate(()=>{
        const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();
        return c?{lng:Number(c.lng),lat:Number(c.lat),zoom:Number(m.getZoom())}:null;
      });
      if(settled&&Math.abs(settled.lng-target.lng)<0.00002&&Math.abs(settled.lat-target.lat)<0.00002)
        return {ok:true,center:settled};
    }
  }
  return {ok:false,center:final};
}

async function createCrosshairByRealDrag(page,target){
  const stable=await stabilizeCameraAt(page,target);
  if(!stable.ok)return {ok:false,reason:'camera did not stabilize at Regional corridor',stable};

  const prior=await page.evaluate(()=>window.EARTHLINE_PROPERTY_TARGET_16201||null);
  const canvas=page.locator('.mapboxgl-canvas').first();
  const b=await canvas.boundingBox();
  if(!b)return {ok:false,reason:'map canvas unavailable',stable};

  const dragPoint=await page.evaluate(({left,top,width,height})=>{
    const candidates=[
      [0.78,0.72],[0.22,0.72],[0.78,0.28],[0.22,0.28],
      [0.68,0.82],[0.32,0.82],[0.68,0.18],[0.32,0.18]
    ];
    for(const [fx,fy] of candidates){
      const x=left+width*fx,y=top+height*fy;
      const el=document.elementFromPoint(x,y);
      if(!el)continue;
      const blocked=el.closest?.(
        '[aria-label^="Open details for"],.earthline-swale-hit-16070,.earthline-swale-label-16149,'+
        'button,a,[role="button"],.mapboxgl-control-container,#earthlineRail16188,#earthlinePanel16188,'+
        '#earthlineCorridorDetail16149'
      );
      if(blocked)continue;
      const mapSurface=el.matches?.('.mapboxgl-canvas,canvas')||el.closest?.('.mapboxgl-canvas-container');
      if(mapSurface)return {x,y,tag:el.tagName||'',id:el.id||'',cls:String(el.className||'')};
    }
    return null;
  },{left:b.x,top:b.y,width:b.width,height:b.height});
  if(!dragPoint)return {ok:false,reason:'no unobstructed real map drag point',stable};

  const x=dragPoint.x,y=dragPoint.y;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x+12,y+6,{steps:5});
  await page.mouse.up();
  await page.waitForTimeout(900);

  const after=await page.evaluate(()=>({
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    center:(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return c?{lng:Number(c.lng),lat:Number(c.lat)}:null}catch(_){return null}})()
  }));
  const source=String(after.target?.source||'');
  return {
    ok:/^crosshair(?:-user-drag)?/.test(source)&&Number.isFinite(Number(after.target?.lng))&&Number.isFinite(Number(after.target?.lat)),
    source,prior,after,stable
  };
}

async function clickPropertyAndWait(page){
  if(!await ensurePanelOpen(page))return {ok:false,reason:'navigation panel unavailable'};
  const button=page.locator('#earthlineDeclareProperty16169');
  if(!await button.count())return {ok:false,reason:'Property control missing'};
  await button.scrollIntoViewIfNeeded().catch(()=>{});
  const before=await page.evaluate(()=>({
    settledAt:String(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settledAt||''),
    searchGen:Number((typeof M!=='undefined'&&M&&M.searchGen)||0)
  }));
  const started=Date.now();
  try{await button.click({timeout:5000});}
  catch(e){return {ok:false,reason:'Property physical click failed: '+String(e),wallMs:Date.now()-started};}

  try{
    await page.waitForFunction(before=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      const state=String(document.documentElement.dataset.earthlinePropertyRunState||'');
      return state==='running'||(a&&String(a.settledAt||'')&&String(a.settledAt||'')!==String(before.settledAt||''));
    },before,{timeout:5000,polling:80});
  }catch(_){}

  try{
    await page.waitForFunction(before=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      const state=String(document.documentElement.dataset.earthlinePropertyRunState||'');
      return !!(a&&a.settled===true&&state!=='running'&&
        (String(a.settledAt||'')!==String(before.settledAt||'')||Number((typeof M!=='undefined'&&M&&M.searchGen)||0)>Number(before.searchGen||0)));
    },before,{timeout:22000,polling:120});
  }catch(_){}

  return await page.evaluate(started=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const s=(typeof M!=='undefined'&&M)?M.safetyAudit15806||null:null;
    const lock=(typeof M!=='undefined'&&M)?M.propertyResultLock15815||null:null;
    const fc=(typeof M!=='undefined'&&M)?M.authoritativeSafeSwales15815:null;
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const displayed=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    return {
      ok:!!(a?.settled===true&&a?.result===true&&p?.published===true&&s?.verified===true&&lock?.safetyVerified===true),
      wallMs:Date.now()-started,
      target,targetSource:String(target?.source||''),
      settled:a?.settled===true,result:a?.result===true,timedOut:a?.timedOut===true,
      publication:p,safetyVerified:s?.verified===true,lockVerified:lock?.safetyVerified===true,
      safeSwales:Number(fc?.features?.length||0),
      displayedTier:String(displayed?.tier||displayed?.mode||'').toLowerCase(),
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||
                    document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
    };
  },started);
}

for(const state of STATES){
  const context=await browser.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  await page.route('https://ccucaqwbdsskcwxxbqiz.supabase.co/functions/v1/earthline-telemetry',route=>route.fulfill({status:204,body:''}));

  const row={state,pass:false,regional:null,attempts:[],repeat:null,pageErrors};
  try{
    await page.goto(BASE+'?v1_geo_17090='+encodeURIComponent(state)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForSelector('#searchInput',{state:'attached',timeout:15000});

    let success=null;
    for(let attemptIndex=0;attemptIndex<3&&!success;attemptIndex++){
      const regional=await runRegional(page,state);
      row.regional=regional;
      const regionalPass=!regional.error&&regional.coreMs>0&&regional.coreMs<=HARD_CEILING_MS&&
        regional.generated>0&&regional.generated===regional.visible&&regional.unsafe===0&&
        regional.outsideSwales===0&&regional.rootPass===true&&regional.targets.length>attemptIndex;
      if(!regionalPass){
        row.attempts.push({attemptIndex,regionalPass:false,regional});
        break;
      }

      const target=regional.targets[attemptIndex];
      const crosshair=await createCrosshairByRealDrag(page,target);
      if(!crosshair.ok){
        row.attempts.push({attemptIndex,target,crosshair,property:null});
        continue;
      }
      const property=await clickPropertyAndWait(page);
      const propertyPass=property.ok&&property.wallMs>0&&property.wallMs<=HARD_CEILING_MS&&
        /^crosshair(?:-user-drag)?/.test(property.targetSource)&&property.displayedTier==='property';
      row.attempts.push({attemptIndex,target,crosshair,property,propertyPass});
      if(propertyPass)success={target,crosshair,property};
    }

    if(success){
      row.repeat=await clickPropertyAndWait(page);
      row.repeatPass=row.repeat.ok&&row.repeat.wallMs>0&&row.repeat.wallMs<=HARD_CEILING_MS&&
        /^crosshair(?:-user-drag)?/.test(row.repeat.targetSource)&&row.repeat.displayedTier==='property';
    }else row.repeatPass=false;

    row.pass=!!success&&row.repeatPass&&pageErrors.length===0;
  }catch(e){
    row.fatal=String(e);
    row.pass=false;
  }
  rows.push(row);
  writeFileSync(`${OUT}/${state.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.json`,JSON.stringify(row,null,2));
  console.log('EARTHLINE_GEO_17090 '+JSON.stringify({
    state:row.state,pass:row.pass,fatal:row.fatal||null,
    regional:row.regional?{coreMs:row.regional.coreMs,generated:row.regional.generated,visible:row.regional.visible,unsafe:row.regional.unsafe,outsideSwales:row.regional.outsideSwales}:null,
    attempts:row.attempts.map(a=>({attemptIndex:a.attemptIndex,target:a.target||null,crosshairOk:a.crosshair?.ok??null,
      propertyOk:a.property?.ok??null,propertyMs:a.property?.wallMs??null,safeSwales:a.property?.safeSwales??null,
      targetSource:a.property?.targetSource||a.crosshair?.source||null})),
    repeat:row.repeat?{ok:row.repeat.ok,wallMs:row.repeat.wallMs,safeSwales:row.repeat.safeSwales,targetSource:row.repeat.targetSource}:null,
    pageErrors
  }));
  await context.close();
  await sleep(250);
}
await browser.close();

const summary={
  total:rows.length,
  pass:rows.filter(r=>r.pass).length,
  fail:rows.filter(r=>!r.pass).length,
  failed:rows.filter(r=>!r.pass).map(r=>({state:r.state,fatal:r.fatal||null,pageErrors:r.pageErrors,attempts:r.attempts,repeat:r.repeat||null})),
  timings:rows.map(r=>({
    state:r.state,
    regionalMs:r.regional?.coreMs??null,
    propertyMs:r.attempts.find(a=>a.propertyPass)?.property?.wallMs??null,
    repeatMs:r.repeat?.wallMs??null
  }))
};
writeFileSync(`${OUT}/summary.json`,JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_GEO_17090_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
