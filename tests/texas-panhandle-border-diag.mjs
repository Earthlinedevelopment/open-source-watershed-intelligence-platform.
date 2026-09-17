import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1700,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

const needle=`    let jurisdictionRejectedCandidates16539=0;\n    if(!focusMode&&jurisdictionGeometry16539){\n      const eligible16539=[];\n      for(const candidate16539 of candidates){\n        const screened16539=screenJurisdictionCandidate16539(candidate16539);\n        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;\n      }\n      candidates.length=0;candidates.push(...eligible16539);\n    }`;
const replacement=`    let jurisdictionRejectedCandidates16539=0;\n    const __earthlineCandidateFates16606=[];\n    if(!focusMode&&jurisdictionGeometry16539){\n      const eligible16539=[];\n      for(const candidate16539 of candidates){\n        const screened16539=screenJurisdictionCandidate16539(candidate16539);\n        try{\n          const rawSeg16606=candidate16539&&candidate16539.segment||[];\n          const rawMid16606=rawSeg16606[Math.floor((rawSeg16606.length-1)/2)]||null;\n          const screenedSeg16606=screened16539&&screened16539.segment||[];\n          const screenedMid16606=screenedSeg16606[Math.floor((screenedSeg16606.length-1)/2)]||null;\n          __earthlineCandidateFates16606.push({rawMid:rawMid16606,eligible:!!screened16539,screenedMid:screenedMid16606,score:Number(candidate16539&&candidate16539.score||0),confidence:String(candidate16539&&candidate16539.confidence||''),slope:Number(candidate16539&&candidate16539.slope),acc:Number(candidate16539&&candidate16539.acc),maxAcc:Number(candidate16539&&candidate16539.maxAcc)});\n        }catch(_){}\n        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;\n      }\n      candidates.length=0;candidates.push(...eligible16539);\n    }\n    try{window.EARTHLINE_CANDIDATE_FATES_16606=__earthlineCandidateFates16606;}catch(_){}`;

let patchCount=0;
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();
  const text=await resp.text();
  patchCount=text.split(needle).length-1;
  return route.fulfill({response:resp,body:patchCount?text.split(needle).join(replacement):text});
});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;
try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&Array.isArray(window.EARTHLINE_CANDIDATE_FATES_16606)&&!!window.EARTHLINE_REGIONAL_VISUAL_DATA_16020);},{timeout:35000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(500);

const result=await page.evaluate(()=>{
  const f=Array.isArray(window.EARTHLINE_CANDIDATE_FATES_16606)?window.EARTHLINE_CANDIDATE_FATES_16606:[];
  const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{};
  const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
  const ct=Array.isArray(v?.contours?.features)?v.contours.features:[];
  const fl=Array.isArray(v?.flows?.features)?v.flows.features:[];
  const midGeom=g=>{const pts=[];const walk=c=>{if(!Array.isArray(c))return;if(c.length>=2&&Number.isFinite(+c[0])&&Number.isFinite(+c[1])){pts.push([+c[0],+c[1]]);return;}for(const x of c)walk(x);};walk(g?.coordinates);if(!pts.length)return null;return pts[Math.floor((pts.length-1)/2)];};
  const regs={
    panhandleCore:(x,y)=>x>=-103.05&&x<=-100.0&&y>=34.0&&y<=36.5,
    panhandleNorth:(x,y)=>x>=-103.05&&x<=-100.0&&y>=35.4&&y<=36.55,
    panhandleWestNM:(x,y)=>x>=-103.15&&x<=-102.45&&y>=34.0&&y<=36.55,
    northOK:(x,y)=>x>-100.0&&x<=-94.4&&y>=33.5&&y<=36.55,
    northwestTexas:(x,y)=>x>=-104.0&&x<=-99.0&&y>=33.0&&y<=36.55
  };
  const out={};
  for(const [name,pred] of Object.entries(regs)){
    const row={raw:0,eligible:0,rejected:0,published:0,contours:0,flows:0,samples:[]};
    for(const c of f){const m=c?.rawMid;if(!Array.isArray(m))continue;const x=+m[0],y=+m[1];if(!pred(x,y))continue;row.raw++;if(c.eligible)row.eligible++;else row.rejected++;if(row.samples.length<16)row.samples.push({mid:m,eligible:c.eligible,score:c.score,slope:c.slope,acc:c.acc,maxAcc:c.maxAcc});}
    for(const g of sw){const m=midGeom(g?.geometry);if(m&&pred(+m[0],+m[1]))row.published++;}
    for(const g of ct){const m=midGeom(g?.geometry);if(m&&pred(+m[0],+m[1]))row.contours++;}
    for(const g of fl){const m=midGeom(g?.geometry);if(m&&pred(+m[0],+m[1]))row.flows++;}
    out[name]=row;
  }
  return {regions:out,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,boundaryAudit:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,visualBounds:v?.bounds||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()};
});
console.log('EARTHLINE_TX_PANHANDLE_DIAG '+JSON.stringify({patchCount,timedOut,result,errors:errors.slice(0,20)}));
await browser.close();
if(!patchCount||timedOut||result.lastError)process.exitCode=1;
