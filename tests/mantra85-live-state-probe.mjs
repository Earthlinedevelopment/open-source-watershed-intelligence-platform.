import {chromium} from 'playwright';
import {writeFileSync,mkdirSync} from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGET={lng:-73.012909,lat:44.513845,label:'61 Sleepy Hollow Rd, Essex, Vermont, USA'};
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:950}});
const pageErrors=[],badResponses=[];page.on('pageerror',e=>pageErrors.push(String(e)));page.on('console',m=>{if(m.type()==='error')pageErrors.push(m.text())});page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url()})});

function compactAudit(a){
  if(!a||typeof a!=='object')return null;
  const out={};for(const k of ['runToken','generated','published','publicationCount','settled','result','timedOut','renderVerified','stage','stageLabel','error','at','settledAt'])if(a[k]!==undefined)out[k]=a[k];return out;
}
async function snapshot(label){return page.evaluate(({label,target})=>{
  const md=(typeof M!=='undefined'&&M)||window.M||null;
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
  const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
  const grid=flow?.gridAudit?.grid||null;
  const fn=window.earthlineRenderRegionalOverlay16020;
  return {
    label,
    tier:String(d?.tier||d?.mode||document.documentElement.dataset.earthlineAnalysisTier||''),
    displayedRunToken:String(d?.runToken||''),
    displayedTarget:d?.target||d?.location||null,
    displayedBounds:d?.bounds||d?.extent||window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.bounds||null,
    propertyTarget:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    propertyDeclaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
    propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    propertyPublication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    flowGrid:grid,
    modelEvidenceKeys:md?Object.keys(md).filter(k=>/canopy|forest|tree|veg|landcover|mask|water|exclude|valid/i.test(k)).sort().map(k=>({key:k,type:ArrayBuffer.isView(md[k])?md[k].constructor.name:typeof md[k],length:Number(md[k]?.length||0)})):[],
    model:{
      present:!!md,
      searchGen:Number(md?.searchGen||0),
      loc:md?.loc||null,
      centerLng:Number(md?.centerLng),centerLat:Number(md?.centerLat),
      hLength:Number(md?.h?.length||0),
      inPLength:Number(md?.inP?.length||0),
      noBuildMaskLength:Number(md?.noBuildMask?.length||0),
      cellM:Number(md?.cellM),requestedCellM:Number(md?.requestedCellM),
      boundaryCount:Number(md?.analysisBoundaryLngLat?.length||0),
      safeSwales:Number(md?.authoritativeSafeSwales15815?.features?.length||0),
      swales:Number(md?.swales?.length||0),
      exclusionConfidence:String(md?.exclusionConfidence||''),
      vectorNoBuildCoverage:md?.vectorNoBuildCoverage||null
    },
    elder:elder?{state:elder.state||null,propertyRunIdentity:elder.propertyRunIdentity||null,featureCount:Number(elder.featureCount||0),error:elder.error||null,at:elder.at||null,summary:elder.summary||null}:null,
    renderer:{exists:typeof fn==='function',sourceMutatesGeometry:typeof fn==='function'&&String(fn).includes('earthlineRegionalLocalDisplay16020')},
    expectedTarget:target
  };
},{label,target:TARGET});}

await page.goto(URL+'?m85_observer='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;return !!e||(Number(p?.generated||0)>0&&Number(d?.swaleLines||0)>0);},null,{timeout:60000,polling:100});
const regional=await snapshot('regional');

const propertyCall=await page.evaluate(async target=>{
  window.EARTHLINE_PROPERTY_TARGET_16201={...target,source:'m85-read-only-observer',at:new Date().toISOString()};
  if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(window.EARTHLINE_PROPERTY_TARGET_16201);
  const fn=window.earthlineDeclarePropertyAtCrosshair16173||window.earthlineDeclarePropertyAtCrosshair16169;
  if(typeof fn!=='function')return {ok:false,error:'Property owner unavailable'};
  try{const out=await Promise.resolve(fn());return {ok:out!==false,out};}catch(e){return {ok:false,error:String(e?.message||e)}}
},TARGET);
await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return a?.settled===true||a?.stage==='failed';},null,{timeout:60000,polling:100}).catch(()=>{});
const property=await snapshot('property');

const violations=[];
if(pageErrors.length)violations.push('browser page/console errors');
if(!regional.model.present||!regional.model.hLength||!regional.model.inPLength)violations.push('Regional terrain/land acquisition fields incomplete');
if(!regional.flowGrid?.w||!regional.flowGrid?.h)violations.push('Regional explicit grid dimensions missing');
if(regional.renderer.sourceMutatesGeometry)violations.push('Regional renderer alters science geometry');
if(!propertyCall.ok)violations.push('Property run failed: '+String(propertyCall.error||''));
if(!property.model.hLength||!property.model.inPLength||!property.model.noBuildMaskLength)violations.push('Property acquisition fields incomplete');
const t=property.propertyTarget||{};if(Math.abs(Number(t.lng)-TARGET.lng)>1e-6||Math.abs(Number(t.lat)-TARGET.lat)>1e-6)violations.push('Property target identity mismatch');
if(property.elder?.state!=='committed')violations.push('Elder evidence not committed at observed Property terminal');
const pubAt=Date.parse(String(property.propertyPublication?.at||'')),elderPreparedAt=Date.parse(String(property.elder?.preparedAt||property.elder?.at||'')),auditPreparedAt=Date.parse(String(property.propertyPublication?.elderPreparedAt||''));
if(!property.propertyPublication?.elderPreparedAt)violations.push('Property publication did not carry prepared Elder evidence provenance');
if(Number.isFinite(pubAt)&&Number.isFinite(elderPreparedAt)&&elderPreparedAt>pubAt)violations.push('Elder evidence prepared after Property publication by '+(elderPreparedAt-pubAt)+' ms');
if(Number.isFinite(pubAt)&&Number.isFinite(auditPreparedAt)&&auditPreparedAt>pubAt)violations.push('Property publication Elder provenance is newer than publication');
const publishedSafe=Number(property.propertyPublication?.safeCount||0),modelSafe=Number(property.model?.safeSwales||0);
if(publishedSafe>0&&modelSafe!==publishedSafe)violations.push('authoritative safe-swale state drift after publication: published '+publishedSafe+' vs model '+modelSafe);

const report={at:new Date().toISOString(),url:URL,target:TARGET,propertyCall,regional,property,pageErrors,badResponses,violations,pass:violations.length===0};
mkdirSync('artifacts/mantra85',{recursive:true});writeFileSync('artifacts/mantra85/live-state-probe.json',JSON.stringify(report,null,2));
console.log('MANTRA85_LIVE_STATE '+JSON.stringify(report));
await browser.close();
if(violations.length)process.exitCode=1;
