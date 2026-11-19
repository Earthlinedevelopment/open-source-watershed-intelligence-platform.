'use strict';
/* Runs the page-side connection code (tools/adapter-16600.js + tools/lock-16600.js) in a Node vm with stubs for the page's
   own functions, the real engine and bridge, and a fetch that serves the independently built vector tile.
   This checks the wiring (names, data shapes, failure paths). It is NOT a substitute for the connected browser test. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),FX=path.join(__dirname,'fixtures');
const fx=JSON.parse(fs.readFileSync(path.join(FX,'fixture.json'))),tile=fs.readFileSync(path.join(FX,'tile.pbf'));
const E=require(path.join(root,'earthline-property-swales.js')),B=require(path.join(root,'earthline-property-swale-bridge.js'));
const adapter=fs.readFileSync(path.join(root,'tools/adapter-16600.js'),'utf8'),lock=fs.readFileSync(path.join(root,'tools/lock-16600.js'),'utf8');
const results=[];const T=async(n,f)=>{try{await f();results.push('PASS  '+n);}catch(e){results.push('FAIL  '+n+' — '+(e&&e.stack||e));}};

function makePage(fetchImpl,opts={}){
  const GW=210,GH=146,N=GW*GH,cell=2.2,[lng0,lat0]=fx.center;
  const frame=B.makeFrame(lng0,lat0,GW,GH,cell);
  const h=new Float32Array(N);for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)h[y*GW+x]=(opts.slope==null?2:opts.slope)/100*(GH-y)*cell+0.05*Math.sin(x/9);
  const inP=new Uint8Array(N);for(let y=7;y<139;y++)for(let x=29;x<181;x++)inP[y*GW+x]=1;           // ~334 m x 290 m
  const acc=E._internal.flowAccumulation(h,GW,GH);
  const ring=[[28.5,6.5],[180.5,6.5],[180.5,138.5],[28.5,138.5],[28.5,6.5]].map(p=>frame.toLngLat(p[0],p[1]));
  const M={centerLng:lng0,centerLat:lat0,cellM:cell,h,inP,acc,pond:new Uint8Array(N),maxAcc:Math.max(...acc),pondCells:0,searchGen:1,analysisBoundaryLngLat:ring,manualNoBuild:opts.manual||[],swales:[]};
  const ctx={M,GW,GH,N,idx:(x,y)=>y*GW+x,MAPBOX_TOKEN:'pk.TEST',fetch:fetchImpl,performance,AbortController,setTimeout,clearTimeout,Response,Blob,console:{log(){},warn(){}},
    DecompressionStream:globalThis.DecompressionStream,TARGET_M:6.1,MIN_M:4.572,MAX_M:7.62,
    streamThreshold:()=>Math.max(2,M.maxAcc*0.005*0.9),
    earthlineRecordTerrainHandoff15791(){},earthlineIsStale:()=>false,earthlineTaskYield16464:async()=>{},
    earthlineCollectSwaleDiagnostics:()=>({stage:{}}),spacingStats:c=>({medianM:6,minM:4.6,maxM:7.6,populationCount:c.length,sampleCount:c.length,sampled:false}),
    canopyAt:()=>0,
    earthlineHaltPrescription15870(code,audit){M.prescriptionHalt15870={code,audit};const e=new Error(code);e.name='EarthlinePrescriptionHalt';e.code=code;throw e;},
    earthlineEmptyPropertyFC16176:()=>({type:'FeatureCollection',features:[]}),
    earthlineBlockPropertyPublication16176(reason){M.blocked=reason;M.swales=[];},
    earthlineSafeModelFromGeoJSON16176:(fc,raw)=>fc.features.map((f,i)=>Object.assign({},raw[i],{id:f.properties.id,pts:raw[i].pts})),
    window:null,Float32Array,Uint8Array,Math,Number,Array,Object,JSON,Set,Map,Date,Promise,Error,String,isFinite,Infinity,NaN,encodeURIComponent};
  ctx.window=ctx;ctx.EarthlinePropertySwales=E;ctx.EarthlineSwaleBridge=B;
  vm.createContext(ctx);vm.runInContext(adapter+'\n'+lock,ctx,{filename:'adapter+lock'});
  return {ctx,M,frame,GW,GH,cell};
}
const tileResponse=(onCall)=>async(url)=>{onCall&&onCall(url);assert(/access_token=pk\.TEST/.test(url));
  const m=/mapbox-streets-v8\/(\d+)\/(\d+)\/(\d+)\.vector\.pbf/.exec(url);assert(m,'bad url '+url);assert.deepStrictEqual(m.slice(1).map(Number),[fx.z,fx.x,fx.y]);
  return {ok:true,status:200,arrayBuffer:async()=>tile.buffer.slice(tile.byteOffset,tile.byteOffset+tile.byteLength)};};

(async()=>{
  let page,calls=[];
  await T('Property run: tile fetched once at z15 with the page token; swales published through the engine; page data shapes filled',async()=>{
    page=makePage(tileResponse(u=>calls.push(u)));
    const t0=Date.now();const r=await page.ctx.earthlineRunCleanSwaleEngine16600(1,performance.now());const ms=Date.now()-t0;
    assert(Array.isArray(r)&&r.length>0,'no corridors');assert.equal(calls.length,1);assert(!/sku=/.test(calls[0]));
    const M=page.M;assert.strictEqual(M.swales,r);assert.equal(M.propertySwaleEngine16600.verified,true);assert.equal(M.propertySwaleEngine16600.acquisition.status,'features-found');
    for(const s of r){assert(/^B\d+$/.test(s.id));assert(s.pts.length>=2&&s.pts.every(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])));
      for(const k of ['capCells','lenM','slope','score','levelH'])assert(Number.isFinite(s[k]),k);assert(s.slope<=4&&s.slope>=0.2);}
    assert.equal(M.prescriptionZeroReason15870,null);assert.strictEqual(M.coverageDiagnostic15803,null);
    assert.equal(M.propertySwaleEngine16600.features.length,r.length);assert(M.propertySwaleEngine16600.audit.checked>=r.length);
    results.push('      '+r.length+' swales in '+ms+' ms; engine '+M.propertySwaleEngine16600.engineSwales+' → audit rejected '+M.propertySwaleEngine16600.audit.rejected.length+'; params '+JSON.stringify(M.propertySwaleEngine16600.params));
  });
  await T('lock replacement: committed collection equals the model, ids match, verified, exclusionConfidence set',()=>{
    const M=page.M;const fc=page.ctx.earthlineCommitEngineLock16600(M.propertySwaleEngine16600);
    assert.equal(fc.features.length,M.swales.length);assert.equal(M.propertyResultLock15815.safetyVerified,true);assert.equal(M.safetyAudit15806.verified,true);
    assert.deepStrictEqual(fc.features.map(f=>f.properties.id),M.swales.map(s=>s.id));assert.equal(M.exclusionConfidence,'open-data');
    assert(fc.features.every(f=>f.geometry.type==='LineString'&&f.properties.publicationOwner==='earthlineCommitEngineLock16600'&&/^EL-P-/.test(f.properties.stableId)));
  });
  await T('published swales respect the vector exclusions (independent re-measure with the bridge audit on the committed coordinates)',()=>{
    const M=page.M,fc=M.authoritativeSafeSwales15815,a=B.auditSwales(fc.features,page.ctx.M.propertySwaleEngineContext16600.acq.geometry,M.analysisBoundaryLngLat,page.frame);
    assert.equal(a.rejected.length,0,JSON.stringify(a.rejected));results.push('      re-measured '+a.checked+' committed swales: 0 violations; min clearances '+JSON.stringify(a.minClearanceM));
  });
  await T('repeat runs on identical inputs give identical swales and hash (5 runs)',async()=>{
    const hs=new Set(),ids=new Set();for(let k=0;k<5;k++){const p=makePage(tileResponse());await p.ctx.earthlineRunCleanSwaleEngine16600(1,performance.now());hs.add(p.M.propertySwaleEngine16600.determinismHash);ids.add(p.M.swales.map(s=>s.stableId).join(','));}
    assert.equal(hs.size,1);assert.equal(ids.size,1);
  });
  await T('exclusion request fails -> run halts (fail closed), zero swales, nothing published',async()=>{
    for(const [label,f] of Object.entries({reject:async()=>{throw new Error('net');},http:async()=>({ok:false,status:429,arrayBuffer:async()=>new ArrayBuffer(0)}),empty:async()=>({ok:true,status:200,arrayBuffer:async()=>new ArrayBuffer(0)}),garbage:async()=>({ok:true,status:200,arrayBuffer:async()=>new Uint8Array([0x1a,0xff,0xff,0xff,0xff,0xff]).buffer})})){
      const p=makePage(f);await assert.rejects(()=>p.ctx.earthlineRunCleanSwaleEngine16600(1,performance.now()),e=>e.code==='clean-engine-exclusion-check-failed','case '+label);
      assert.deepStrictEqual(Array.from(p.M.swales),[]);assert.equal(p.M.propertySwaleEngine16600.verified,false);assert(p.M.propertySwaleEngine16600.detail.reason);}
  });
  await T('engine or bridge file missing -> halts, never falls back to another engine',async()=>{
    const p=makePage(tileResponse());p.ctx.EarthlinePropertySwales=undefined;
    await assert.rejects(()=>p.ctx.earthlineRunCleanSwaleEngine16600(1,performance.now()),e=>e.code==='clean-swale-engine-unavailable');assert.deepStrictEqual(Array.from(p.M.swales),[]);
  });
  await T('steep land: zero swales is a stated result with the existing zero-reason key (no new text)',async()=>{
    const p=makePage(tileResponse(),{slope:10});const r=await p.ctx.earthlineRunCleanSwaleEngine16600(1,performance.now());
    assert.equal(r.length,0);assert.equal(p.M.prescriptionZeroReason15870,'no-suitable-slope-corridors');assert(p.M.propertySwaleEngine16600.rejections.R2>0);
  });
  await T('R14: near-flat land through the real page connection: zero swales, existing zero-reason key, terrain evidence recorded',async()=>{
    const p=makePage(tileResponse(),{slope:0.05});const r=await p.ctx.earthlineRunCleanSwaleEngine16600(1,performance.now());
    const eng=p.M.propertySwaleEngine16600;assert.equal(r.length,0);assert.equal(eng.evidence.terrain.gate,'refused');assert.equal(eng.rejections.R14,1);
    assert(['no-suitable-slope-corridors','all-candidates-excluded'].includes(p.M.prescriptionZeroReason15870),'zero reason '+p.M.prescriptionZeroReason15870);
    results.push('      relief '+eng.evidence.terrain.reliefM+' m < '+eng.evidence.terrain.minReliefM+' m; zero reason key '+p.M.prescriptionZeroReason15870);
  });
  await T('manual no-build polygon is honoured absolutely',async()=>{
    const man=[[[60,40],[150,40],[150,100],[60,100]]];const p=makePage(tileResponse(),{manual:man});const base=makePage(tileResponse());
    await base.ctx.earthlineRunCleanSwaleEngine16600(1,performance.now());const r=await p.ctx.earthlineRunCleanSwaleEngine16600(1,performance.now());
    assert(r.length>0,'no swales left');results.push('      without polygon '+base.M.swales.length+' swales, with polygon '+r.length);
    for(const s of r)for(const [x,y] of s.pts)assert(!(x>=60&&x<=150&&y>=40&&y<=100),'swale vertex inside the manual no-build polygon '+x+','+y);
  });
  await T('sensitivity hook re-runs the same grid with other channel definitions and publishes nothing',()=>{
    const rows=page.ctx.__EARTHLINE_SWALE_ENGINE_HOOK_16600.sensitivity([0.78,1,3,5]);assert.equal(rows.length,4);
    assert(rows[0].channelThresholdCells<rows[3].channelThresholdCells);results.push('      '+JSON.stringify(rows.map(r=>[r.thresholdMultiplier,r.swales,r.coverage.buildablePct])));
  });
  console.log(results.join('\n'));if(results.some(r=>r.startsWith('FAIL')))process.exit(1);
})();
