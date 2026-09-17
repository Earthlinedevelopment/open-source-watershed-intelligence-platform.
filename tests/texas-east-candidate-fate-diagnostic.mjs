import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

const needle=`    let jurisdictionRejectedCandidates16539=0;\n    if(!focusMode&&jurisdictionGeometry16539){\n      const eligible16539=[];\n      for(const candidate16539 of candidates){\n        const screened16539=screenJurisdictionCandidate16539(candidate16539);\n        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;\n      }\n      candidates.length=0;candidates.push(...eligible16539);\n    }`;
const replacement=`    let jurisdictionRejectedCandidates16539=0;\n    const __earthlineCandidateFates16605=[];\n    if(!focusMode&&jurisdictionGeometry16539){\n      const eligible16539=[];\n      for(const candidate16539 of candidates){\n        const screened16539=screenJurisdictionCandidate16539(candidate16539);\n        try{\n          const rawSeg16605=candidate16539&&candidate16539.segment||[];\n          const rawMid16605=rawSeg16605[Math.floor((rawSeg16605.length-1)/2)]||null;\n          const screenedSeg16605=screened16539&&screened16539.segment||[];\n          const screenedMid16605=screenedSeg16605[Math.floor((screenedSeg16605.length-1)/2)]||null;\n          __earthlineCandidateFates16605.push({rawMid:rawMid16605,rawStart:rawSeg16605[0]||null,rawEnd:rawSeg16605[rawSeg16605.length-1]||null,eligible:!!screened16539,screenedMid:screenedMid16605,score:Number(candidate16539&&candidate16539.score||0),confidence:String(candidate16539&&candidate16539.confidence||'')});\n        }catch(_){}\n        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;\n      }\n      candidates.length=0;candidates.push(...eligible16539);\n    }\n    try{window.EARTHLINE_CANDIDATE_FATES_16605=__earthlineCandidateFates16605;}catch(_){}`;

let patchCount=0;
await page.route('**/*',async route=>{
  const req=route.request();
  if(req.resourceType()!=='document')return route.continue();
  const resp=await route.fetch();
  const text=await resp.text();
  if(!text.includes(needle))return route.fulfill({response:resp,body:text});
  patchCount=text.split(needle).length-1;
  const body=text.split(needle).join(replacement);
  return route.fulfill({response:resp,body});
});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;
try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&Array.isArray(window.EARTHLINE_CANDIDATE_FATES_16605));},{timeout:30000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(300);
const result=await page.evaluate(()=>{
  const f=Array.isArray(window.EARTHLINE_CANDIDATE_FATES_16605)?window.EARTHLINE_CANDIDATE_FATES_16605:[];
  const buckets={rawEast96:{all:0,eligible:0,rejected:0},rawEast95:{all:0,eligible:0,rejected:0},rawEast94:{all:0,eligible:0,rejected:0},rawWest96:{all:0,eligible:0,rejected:0}};
  const eastSamples=[];
  for(const x of f){
    const lon=Number(x?.rawMid?.[0]); if(!Number.isFinite(lon))continue;
    const add=k=>{buckets[k].all++;if(x.eligible)buckets[k].eligible++;else buckets[k].rejected++;};
    if(lon>-96)add('rawEast96'); else add('rawWest96');
    if(lon>-95)add('rawEast95');
    if(lon>-94)add('rawEast94');
    if(lon>-97&&eastSamples.length<60)eastSamples.push(x);
  }
  const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
  const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  return {fateCount:f.length,buckets,eastSamples,generation:gen,visibleSwales:Array.isArray(visual?.swales?.features)?visual.swales.features.length:0,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()};
});
console.log('EARTHLINE_TX_EAST_FATE '+JSON.stringify({patchCount,timedOut,result,errors:errors.slice(0,20)}));
await browser.close();
if(!patchCount||timedOut||result.lastError)process.exitCode=1;
