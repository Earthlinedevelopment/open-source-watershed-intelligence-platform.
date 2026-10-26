import { chromium } from 'playwright-core';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const EXPECTED_BLOB='2a5af24e1302253a583a5481d92fae6ea3ee5222';
const CASES=[
  {id:'az-good',label:'Arizona GOOD',lat:34.21607,lng:-111.93178},
  {id:'az-bad',label:'Arizona BAD',lat:34.21605,lng:-111.93582},
  {id:'poudre',label:'Poudre Foothills',lat:40.6412,lng:-105.2237}
];
mkdirSync('artifacts/mantra78-live-controls',{recursive:true});

function gitBlobSha(buf){
  return createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
}
function count(hay,needle){return hay.split(needle).length-1;}

const httpResp=await fetch(BASE+'?m78_identity='+Date.now(),{redirect:'follow',headers:{'cache-control':'no-cache'}});
const httpBuf=Buffer.from(await httpResp.arrayBuffer());
const httpText=httpBuf.toString('utf8');
const httpIdentity={
  ok:httpResp.ok,status:httpResp.status,url:httpResp.url,bytes:httpBuf.length,
  gitBlobSha:gitBlobSha(httpBuf),expectedBlob:EXPECTED_BLOB,
  m77Marker:count(httpText,'EARTHLINE M77 — SINGLE PROPERTY DISPLAY OWNER'),
  identityGate:count(httpText,'authoritative Property publication identity missing after governed Property terminal'),
  oldDuplicateCall:count(httpText,'publishDisplayedRun16151(propertySnapshot)')
};
httpIdentity.pass=httpIdentity.ok&&httpIdentity.gitBlobSha===EXPECTED_BLOB&&httpIdentity.m77Marker===1&&httpIdentity.identityGate===1&&httpIdentity.oldDuplicateCall===0;
console.log('EARTHLINE_M78_HTTP_IDENTITY '+JSON.stringify(httpIdentity));

const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome'});
const rows=[];

async function runOne(c,repeat){
  const context=await browser.newContext({viewport:{width:1600,height:1000},deviceScaleFactor:1});
  const page=await context.newPage();
  const pageErrors=[]; const consoleErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  let loadError=null,timeout=false;
  const started=Date.now();
  try{
    await page.goto(BASE+'?m78_control='+encodeURIComponent(c.id)+'_'+repeat+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{state:'attached',timeout:30000});
    await page.waitForFunction(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);return !!(m&&typeof m.jumpTo==='function'&&typeof window.earthlineSyncPropertyTargetFromMap16201==='function'&&document.getElementById('runBtn'));},{timeout:30000,polling:100});
    await page.evaluate(({lng,lat})=>{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const input=document.getElementById('searchInput');
      if(input){input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
      m.jumpTo({center:[lng,lat],zoom:18,bearing:0,pitch:0});
    },c);
    await page.waitForTimeout(1000);
    const targetPrep=await page.evaluate(({lng,lat})=>{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m.getCenter();
      const synced=window.earthlineSyncPropertyTargetFromMap16201();
      const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
      return {synced,center:{lng:Number(c.lng),lat:Number(c.lat)},target:t,zoom:m.getZoom()};
    },c);
    const beforeLedger=await page.evaluate(()=>Array.isArray(window.EARTHLINE_RUN_LEDGER_16147)?window.EARTHLINE_RUN_LEDGER_16147.length:0);
    await page.evaluate(()=>document.getElementById('runBtn')?.click());
    try{
      await page.waitForFunction(()=>{
        const r=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
        const fail=window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null;
        return !!(r&&r.settled===true)||!!fail;
      },{timeout:120000,polling:150});
    }catch(_){timeout=true;}
    try{
      await page.waitForFunction(()=>{
        const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
        return !!e&&(e.state==='committed'||e.state==='failed');
      },{timeout:30000,polling:200});
    }catch(_){}
    await page.waitForTimeout(900);

    const snap=await page.evaluate(async ({beforeLedger,lng,lat})=>{
      const md=(typeof M!=='undefined'&&M)||window.M||{};
      const stripKeys=new Set(['at','publishedAt','generatedAt','completedAt','capturedAt','startedAt','finishedAt','updatedAt','blockedAt','runToken','activeRunToken']);
      function clean(v){
        if(v===null||v===undefined)return v;
        if(typeof v==='number')return Number.isFinite(v)?Number(v.toFixed(10)):String(v);
        if(typeof v!=='object')return v;
        if(Array.isArray(v))return v.map(clean);
        const o={};
        for(const k of Object.keys(v).sort()){
          if(stripKeys.has(k))continue;
          const x=v[k];
          if(typeof x==='function'||x===undefined)continue;
          o[k]=clean(x);
        }
        return o;
      }
      async function hash(v){
        const s=JSON.stringify(clean(v));
        const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
        return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('');
      }
      function fcCount(fc){return fc&&Array.isArray(fc.features)?fc.features.length:0;}
      const displayed=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const pubAudit=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
      const runAudit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      const publication=md.propertyPublication15816||null;
      const waterPub=md.authoritativeWaterPublication15824||null;
      const waterFC=md.authoritativeWaterPaths15824||{type:'FeatureCollection',features:[]};
      const swaleFC=md.authoritativeSafeSwales15815||{type:'FeatureCollection',features:[]};
      const prov=md.noBuildProvenance15843||null;
      const sourceHashes=prov&&prov.sourceHashes||{};
      const frame=Array.isArray(md.analysisBoundaryLngLat)?md.analysisBoundaryLngLat:[];
      const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const safeSource=mp&&mp.getSource&&mp.getSource('earthline-property-safe-visible-16221');
      const safeSourceData=safeSource&&safeSource._data||{type:'FeatureCollection',features:[]};
      const naturalSource=mp&&mp.getSource&&mp.getSource('earthline-property-swale-texture-16174');
      const naturalSourceData=naturalSource&&naturalSource._data||{type:'FeatureCollection',features:[]};
      const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      let elderFeatures=[];
      try{elderFeatures=window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()||[];}catch(_){}
      const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
      const tLng=Number(target?.lng),tLat=Number(target?.lat);
      let elderExpected='';
      if(Number.isFinite(tLng)&&Number.isFinite(tLat)){
        const areaM2=20*4046.8564224,wM=Math.sqrt(areaM2*1.15),hM=areaM2/wM;
        const dLat=hM/(2*111320),dLng=wM/(2*111320*Math.max(.05,Math.cos(tLat*Math.PI/180)));
        const b=[tLng-dLng,tLat-dLat,tLng+dLng,tLat+dLat];
        elderExpected=tLng.toFixed(6)+'|'+tLat.toFixed(6)+'|'+b.map(v=>Number(v).toFixed(6)).join(',');
      }
      const aq=md.usgsAquifers||null;
      const aqCount=Array.isArray(aq)?aq.length:(aq&&Array.isArray(aq.features)?aq.features.length:0);
      const aqStatus=String(md.usgsAquiferStatus||'');
      const aquiferClass=aqCount>0?'mapped-aquifer-evidence-present':(/unavailable|insufficient|failed|error/i.test(aqStatus)?'coverage-unavailable-or-insufficient':'no-mapped-polygon-in-current-evidence');
      const ledger=(window.EARTHLINE_RUN_LEDGER_16147||[]).slice(beforeLedger);
      const outer=[...ledger].reverse().find(x=>x&&x.event==='run_started')||null;
      const propPublished=[...ledger].reverse().find(x=>x&&x.event==='property_run_published')||null;
      const textureAudit=typeof window.earthlinePropertyTextureAudit16169==='function'?window.earthlinePropertyTextureAudit16169():null;
      const propertyButton=document.getElementById('earthlineDeclareProperty16169');
      const runButton=document.getElementById('runBtn');
      const hashes={
        frame:await hash(frame),
        water:await hash(waterFC),
        swales:await hash(swaleFC),
        safeRenderedSource:await hash(safeSourceData),
        naturalRenderedSource:await hash(naturalSourceData),
        elder:await hash(elderFeatures),
        aquifer:await hash(aq),
        scientificInput:String(prov?.scientificInputFingerprint||pubAudit?.scientificInputFingerprint||''),
        sourceState:String(prov?.sourceStateFingerprint||pubAudit?.sourceStateFingerprint||''),
        dem:String(sourceHashes.elevationGridHash||''),
        noBuild:String(prov?.noBuildMaskHash||pubAudit?.noBuildMaskHash||''),
        flow:String(sourceHashes.flowDirectionHash||'')+'|'+String(sourceHashes.flowAccumulationHash||'')
      };
      const currentSearchGen=Number(md.searchGen);
      const sourceExact=hashes.swales===hashes.safeRenderedSource;
      const ownerCoherent=!!(displayed&&pubAudit&&displayed.runToken&&pubAudit.runToken&&String(displayed.runToken)===String(pubAudit.runToken));
      const publicationCoherent=!!(publication&&publication.committed===true&&Number(publication.searchGen)===currentSearchGen);
      const waterCoherent=!!(waterPub&&waterPub.committed===true&&waterPub.verified===true&&Number(waterPub.searchGen)===currentSearchGen&&Number(waterPub.featureCount)===fcCount(waterFC));
      const elderCoherent=!!(elder&&elder.state==='committed'&&String(elder.propertyRunIdentity||'')===elderExpected);
      const orbClear=!document.documentElement.classList.contains('earthline-property-running-16233')&&
        String(propertyButton?.dataset?.busy||'')!=='1'&&String(propertyButton?.dataset?.terminalRunning||'')!=='1'&&
        String(runButton?.dataset?.busy||'')!=='1';
      return {
        targetRequested:{lng,lat},target,displayedTier:String(displayed&&(displayed.tier||displayed.mode)||'').toLowerCase(),
        documentTier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),
        runState:String(document.documentElement.dataset.earthlineRunState||''),
        propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
        outerRunToken:outer?.runToken||null,canonicalDisplayedRunToken:displayed?.runToken||null,
        canonicalPropertyPublicationRunToken:pubAudit?.runToken||null,
        propertyPublishedLedgerCanonical:propPublished?.canonicalRunToken||null,
        searchGen:currentSearchGen,publication,propertyPublicationAudit:pubAudit,propertyRunAudit:runAudit,
        waterPublication:waterPub,frameSeed:window.EARTHLINE_PROPERTY_FRAME_SEED_16414||null,
        counts:{swales:fcCount(swaleFC),water:fcCount(waterFC),safeSource:fcCount(safeSourceData),naturalSource:fcCount(naturalSourceData),elder:elderFeatures.length,aquifer:aqCount},
        hashes,sourceExact,ownerCoherent,publicationCoherent,waterCoherent,
        elder:{last:elder,expectedIdentity:elderExpected,coherent:elderCoherent},
        aquifer:{class:aquiferClass,status:aqStatus,lastResult:clean(md.usgsAquiferLastResult16393||null),
          owner:clean(md.propertyAquiferOwner16393||null),
          handoff:clean(window.EARTHLINE_PROPERTY_AQUIFER_HANDOFF_AUDIT_16359||null),
          inherited:clean(window.EARTHLINE_PROPERTY_AQUIFER_INHERIT_AUDIT_16334||window.EARTHLINE_PROPERTY_INHERITED_AQUIFER_CONTEXT_16373||null)},
        textureAudit:clean(textureAudit),orbClear,
        ledger:ledger.map(x=>clean(x))
      };
    },{beforeLedger,lng:c.lng,lat:c.lat});

    const pass=(
      !timeout&&!pageErrors.length&&
      snap.propertyRunAudit?.settled===true&&snap.propertyRunAudit?.result===true&&
      snap.propertyPublicationAudit?.published===true&&
      snap.displayedTier==='property'&&snap.documentTier==='property'&&
      snap.ownerCoherent&&snap.publicationCoherent&&snap.waterCoherent&&
      snap.sourceExact&&snap.elder.coherent&&snap.orbClear&&
      snap.counts.swales>0&&snap.counts.water>0
    );
    const row={case:c.id,label:c.label,repeat,pass,timeout,loadError,pageErrors,consoleErrors:consoleErrors.slice(-20),wallMs:Date.now()-started,targetPrep,snap};
    await context.close();
    return row;
  }catch(e){
    loadError=String(e&&e.stack||e);
    const row={case:c.id,label:c.label,repeat,pass:false,timeout,loadError,pageErrors,consoleErrors:consoleErrors.slice(-20),wallMs:Date.now()-started};
    await context.close();
    return row;
  }
}

for(const c of CASES){
  for(let repeat=1;repeat<=5;repeat++){
    const row=await runOne(c,repeat);
    rows.push(row);
    console.log('EARTHLINE_M78_CONTROL '+JSON.stringify({case:row.case,repeat:row.repeat,pass:row.pass,timeout:row.timeout,wallMs:row.wallMs,
      swales:row.snap?.counts?.swales,water:row.snap?.counts?.water,ownerCoherent:row.snap?.ownerCoherent,
      sourceExact:row.snap?.sourceExact,elder:row.snap?.elder?.coherent,orbClear:row.snap?.orbClear,
      frame:row.snap?.hashes?.frame,scientificInput:row.snap?.hashes?.scientificInput,waterHash:row.snap?.hashes?.water,
      swaleHash:row.snap?.hashes?.swales,aquiferClass:row.snap?.aquifer?.class,loadError:row.loadError,pageErrors:row.pageErrors}));
  }
}
await browser.close();

const byCase={};
for(const c of CASES){
  const rr=rows.filter(r=>r.case===c.id);
  function same(path){
    const vals=rr.map(r=>path(r));
    return vals.length===5&&vals.every(v=>v!=null&&v===vals[0]);
  }
  byCase[c.id]={
    runs:rr.length,passed:rr.filter(r=>r.pass).length,
    allRunPass:rr.length===5&&rr.every(r=>r.pass),
    sameFrame:same(r=>r.snap?.hashes?.frame),
    sameScientificInput:same(r=>r.snap?.hashes?.scientificInput),
    sameSourceState:same(r=>r.snap?.hashes?.sourceState),
    sameDEM:same(r=>r.snap?.hashes?.dem),
    sameNoBuild:same(r=>r.snap?.hashes?.noBuild),
    sameFlow:same(r=>r.snap?.hashes?.flow),
    sameWater:same(r=>r.snap?.hashes?.water),
    sameSwales:same(r=>r.snap?.hashes?.swales),
    sameElder:same(r=>r.snap?.hashes?.elder),
    sameAquifer:same(r=>r.snap?.hashes?.aquifer),
    sameAquiferClass:same(r=>r.snap?.aquifer?.class),
    ownerCoherentEveryRun:rr.length===5&&rr.every(r=>r.snap?.ownerCoherent===true),
    sourceExactEveryRun:rr.length===5&&rr.every(r=>r.snap?.sourceExact===true),
    elderCurrentEveryRun:rr.length===5&&rr.every(r=>r.snap?.elder?.coherent===true),
    orbClearEveryRun:rr.length===5&&rr.every(r=>r.snap?.orbClear===true)
  };
  byCase[c.id].pass=Object.values(byCase[c.id]).every(v=>typeof v!=='boolean'||v===true)&&byCase[c.id].runs===5&&byCase[c.id].passed===5;
}
const summary={
  at:new Date().toISOString(),httpIdentity,rows:rows.length,passedRows:rows.filter(r=>r.pass).length,
  byCase,pass:httpIdentity.pass&&rows.length===15&&rows.every(r=>r.pass)&&Object.values(byCase).every(x=>x.pass)
};
writeFileSync('artifacts/mantra78-live-controls/results.json',JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_M78_SUMMARY '+JSON.stringify(summary));
if(!summary.pass)process.exitCode=1;
