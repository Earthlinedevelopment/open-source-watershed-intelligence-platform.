import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

const needle=`    let jurisdictionRejectedCandidates16539=0;\n    if(!focusMode&&jurisdictionGeometry16539){\n      const eligible16539=[];\n      for(const candidate16539 of candidates){\n        const screened16539=screenJurisdictionCandidate16539(candidate16539);\n        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;\n      }\n      candidates.length=0;candidates.push(...eligible16539);\n    }`;
const replacement=`    let jurisdictionRejectedCandidates16539=0;\n    const __earthlineCoastFates16610=[];\n    if(!focusMode&&jurisdictionGeometry16539){\n      const eligible16539=[];\n      for(const candidate16539 of candidates){\n        const screened16539=screenJurisdictionCandidate16539(candidate16539);\n        try{\n          const seg16610=candidate16539&&candidate16539.segment||[];\n          const mid16610=seg16610[Math.floor((seg16610.length-1)/2)]||null;\n          const scalars16610={};\n          for(const [k16610,v16610] of Object.entries(candidate16539||{})){if(typeof v16610==='number'||typeof v16610==='string'||typeof v16610==='boolean')scalars16610[k16610]=v16610;}\n          __earthlineCoastFates16610.push({mid:mid16610,eligible:!!screened16539,scalars:scalars16610,keys:Object.keys(candidate16539||{})});\n        }catch(_){}\n        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;\n      }\n      candidates.length=0;candidates.push(...eligible16539);\n    }\n    try{window.EARTHLINE_COAST_FATES_16610=__earthlineCoastFates16610;}catch(_){}`;

let patchCount=0;
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch(),text=await resp.text();
  patchCount=text.split(needle).length-1;
  return route.fulfill({response:resp,body:text.split(needle).join(replacement)});
});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;
try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&Array.isArray(window.EARTHLINE_COAST_FATES_16610));},{timeout:35000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(500);

const result=await page.evaluate(()=>{
  const f=Array.isArray(window.EARTHLINE_COAST_FATES_16610)?window.EARTHLINE_COAST_FATES_16610:[];
  const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
  const ct=Array.isArray(v?.contours?.features)?v.contours.features:[];
  const fl=Array.isArray(v?.flows?.features)?v.flows.features:[];
  const midFeature=feat=>{const c=feat?.geometry?.coordinates||[];const pts=[];const walk=x=>{if(!Array.isArray(x))return;if(x.length>=2&&Number.isFinite(+x[0])&&Number.isFinite(+x[1])){pts.push([+x[0],+x[1]]);return;}for(const y of x)walk(y);};walk(c);if(!pts.length)return null;let sx=0,sy=0;for(const p of pts){sx+=p[0];sy+=p[1];}return [sx/pts.length,sy/pts.length];};
  const regions={
    upperCoast:(x,y)=>x>-96.2&&x<-93.45&&y>28.4&&y<30.7,
    midCoast:(x,y)=>x>-98.2&&x<=-96.2&&y>26.6&&y<29.7,
    lowerCoast:(x,y)=>x>-98.8&&x<-96.5&&y>25.75&&y<=27.6,
    eastInterior:(x,y)=>x>-96&&x<-93.45&&y>=30.7&&y<33.1,
    texasEastHalf:(x,y)=>x>-99&&x<-93.45&&y>25.75&&y<33.1
  };
  const buckets={};
  for(const name of Object.keys(regions))buckets[name]={raw:0,eligible:0,rejected:0,published:0,contours:0,flows:0,samples:[]};
  for(const q of f){const x=Number(q?.mid?.[0]),y=Number(q?.mid?.[1]);if(!Number.isFinite(x)||!Number.isFinite(y))continue;for(const [name,pred] of Object.entries(regions)){if(!pred(x,y))continue;const b=buckets[name];b.raw++;if(q.eligible)b.eligible++;else b.rejected++;if(b.samples.length<12)b.samples.push(q);}}
  for(const [name,pred] of Object.entries(regions)){
    for(const x of sw){const m=midFeature(x);if(m&&pred(m[0],m[1]))buckets[name].published++;}
    for(const x of ct){const m=midFeature(x);if(m&&pred(m[0],m[1]))buckets[name].contours++;}
    for(const x of fl){const m=midFeature(x);if(m&&pred(m[0],m[1]))buckets[name].flows++;}
  }
  let makeSwalesSource='';try{makeSwalesSource=String(makeSwales).slice(0,24000);}catch(e){makeSwalesSource='ERR '+String(e);}
  let screenSource='';try{screenSource=String(screenJurisdictionCandidate16539).slice(0,12000);}catch(e){screenSource='ERR '+String(e);}
  const mloc=typeof M!=='undefined'?{name:M?.loc?.name||null,fullName:M?.loc?.fullName||null,bbox:M?.loc?.bbox||null,lng:M?.loc?.lng??null,lat:M?.loc?.lat??null,searchGen:M?.searchGen??null}:null;
  let mapCenter=null,mapBounds=null;try{const c=earthlineMap.getCenter(),b=earthlineMap.getBounds();mapCenter={lng:+c.lng,lat:+c.lat};mapBounds={w:+b.getWest(),s:+b.getSouth(),e:+b.getEast(),n:+b.getNorth()};}catch(_){}
  return {
    fateCount:f.length,buckets,
    generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    landValidity:window.EARTHLINE_REGIONAL_LAND_VALIDITY_AUDIT_16584||window.EARTHLINE_REGIONAL_LAND_VALIDITY_AUDIT_16583||null,
    boundaryAudit:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    mloc,mapCenter,mapBounds,
    visualBounds:v?.bounds||null,
    makeSwalesSource,screenSource,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
  };
});

console.log('EARTHLINE_TX_COAST_DIAG '+JSON.stringify({patchCount,timedOut,result,errors:errors.slice(0,20)}));
await browser.close();
if(patchCount!==1||timedOut||result.lastError)process.exitCode=1;
