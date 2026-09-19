import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const STATES=['Maryland','Texas'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};

await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(needle,replacement);};

  apply('screenCounters',
`    const jurisdictionScreenCache16592=new WeakMap();
    function screenJurisdictionCandidate16539(candidate16539){`,
`    const jurisdictionScreenCache16592=new WeakMap();
    const screenReasons16697={calls:0,cacheHits:0,noRuns:0,tooShort:0,badGrid:0,passed:0,originalMidInside:0,originalMidOutside:0,rows:[]};
    function screenJurisdictionCandidate16539(candidate16539){
      screenReasons16697.calls++;
      try{const ss16697=candidate16539&&candidate16539.segment||[],mm16697=ss16697[Math.floor((ss16697.length-1)/2)]||null;if(mm16697){if(earthlinePointInJurisdiction16539(mm16697,jurisdictionGeometry16539))screenReasons16697.originalMidInside++;else screenReasons16697.originalMidOutside++;}}catch(_){}`);

  apply('cacheHit',
`      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);`,
`      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539)){screenReasons16697.cacheHits++;return jurisdictionScreenCache16592.get(candidate16539);}`);

  apply('noRuns',
`      if(!runs16539.length){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`,
`      if(!runs16539.length){screenReasons16697.noRuns++;if(screenReasons16697.rows.length<60)screenReasons16697.rows.push({reason:'noRuns',x:candidate16539&&candidate16539.x,y:candidate16539&&candidate16539.y,score:candidate16539&&candidate16539.score});if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`);

  apply('tooShort',
`      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<Math.max(4,Math.min(10,Number(candidate16539&&candidate16539.minLinePx16632)||10))){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`,
`      const clippedLength16697=segment16539?lineLengthPixels(hy,segment16539):0,targetMin16697=Math.max(4,Math.min(10,Number(candidate16539&&candidate16539.minLinePx16632)||10));
      if(!segment16539||segment16539.length<2||clippedLength16697<targetMin16697){screenReasons16697.tooShort++;if(screenReasons16697.rows.length<60)screenReasons16697.rows.push({reason:'tooShort',x:candidate16539&&candidate16539.x,y:candidate16539&&candidate16539.y,score:candidate16539&&candidate16539.score,clippedLength:clippedLength16697,targetMin:targetMin16697});if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`);

  apply('badGrid',
`      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`,
`      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){screenReasons16697.badGrid++;if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`);

  apply('passCount',
`      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);
      return screenedCandidate16592;`,
`      screenReasons16697.passed++;
      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);
      return screenedCandidate16592;`);

  apply('publishReasons',
`    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);`,
`    const jurisdictionEligibleCandidates16539=candidates.length;
    window.EARTHLINE_JURISDICTION_SCREEN_REASONS_16697=Object.assign({},screenReasons16697,{candidatesBeforeJurisdiction:candidatesBeforeJurisdiction16539,eligible:jurisdictionEligibleCandidates16539,rejected:jurisdictionRejectedCandidates16539});
    candidates.sort((a,b)=>b.score-a.score);`);

  return route.fulfill({response:resp,body});
});

await page.goto(URL+'?jurisdiction_reasons='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_JURISDICTION_SCREEN_REASONS_16697=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return !!e||((!prev||at!==prev)&&!!at);},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  const snap=await page.evaluate(q=>({state:q,reasons:window.EARTHLINE_JURISDICTION_SCREEN_REASONS_16697||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
  const row={state:stateName,elapsedMs:Date.now()-started,timedOut,snap};rows.push(row);console.log('EARTHLINE_JURISDICTION_REASONS '+JSON.stringify(row));
}
console.log('EARTHLINE_JURISDICTION_REASONS_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
if(Object.values(patches).some(v=>v!==1)||rows.some(r=>r.timedOut||r.snap.lastError))process.exitCode=1;
