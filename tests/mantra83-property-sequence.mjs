import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:4173/';
const ADDRESS='61 Sleepy Hollow Rd, Essex, Vermont, USA';
const REGION='Vermont';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:1440,height:1000},
  extraHTTPHeaders:{Referer:'https://earthlinedevelopment.org/'}
});
const page=await context.newPage();
const pageErrors=[],consoleErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

async function waitReady(){
  await page.waitForSelector('#runBtn',{state:'visible',timeout:30000});
  await page.waitForFunction(()=>typeof window.earthlineLiveRegionalRun15970==='function',{timeout:30000});
}
async function run(query,expectedTier,priorToken=''){
  await page.locator('#searchInput').fill(query);
  await page.locator('#runBtn').click();
  await page.waitForFunction(({tier,prior})=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    return d&&String(d.tier||d.mode||'').toLowerCase()===tier&&d.runToken&&d.runToken!==prior&&document.documentElement.dataset.earthlineRunState==='published';
  },{tier:expectedTier,prior:priorToken},{timeout:90000});
  return await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    return {
      displayed:d,
      identity:window.EARTHLINE_PROPERTY_IDENTITY_MANTRA83||null,
      propertyTarget:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      propertyRun:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      exclusion:typeof window.earthlineGetExclusionEvidence16516==='function'?window.earthlineGetExclusionEvidence16516():null,
      state:document.documentElement.dataset.earthlineRunState||'',
      tier:document.documentElement.dataset.earthlineAnalysisTier||''
    };
  });
}
function verifyProperty(x,label){
  if(!x.displayed||x.displayed.tier!=='property')throw new Error(label+': Property not canonical');
  if(!x.identity||x.identity.verified!==true)throw new Error(label+': identity not verified');
  if(String(x.identity.runToken)!==String(x.displayed.runToken))throw new Error(label+': identity token mismatch');
  if(!Number.isFinite(Number(x.identity.driftM))||Number(x.identity.driftM)>250)throw new Error(label+': identity drift '+x.identity.driftM);
  if(!x.displayed.location||!Number.isFinite(Number(x.displayed.location.lat))||!Number.isFinite(Number(x.displayed.location.lng)))throw new Error(label+': displayed location missing');
}

try{
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
  await waitReady();

  const p1=await run(ADDRESS,'property');
  verifyProperty(p1,'P1');

  const p2=await run(ADDRESS,'property',p1.displayed.runToken);
  verifyProperty(p2,'P2');

  const r1=await run(REGION,'regional',p2.displayed.runToken);
  if(!r1.displayed||r1.displayed.tier!=='regional')throw new Error('Regional transition failed');

  const p3=await run(ADDRESS,'property',r1.displayed.runToken);
  verifyProperty(p3,'P3');

  const tokens=[p1.displayed.runToken,p2.displayed.runToken,r1.displayed.runToken,p3.displayed.runToken];
  if(new Set(tokens).size!==4)throw new Error('run tokens were reused across canonical runs');

  console.log('MANTRA83_PROPERTY_SEQUENCE '+JSON.stringify({
    pass:true,
    p1:{token:p1.displayed.runToken,driftM:p1.identity.driftM,swales:p1.displayed.derived?.swaleOpportunityLines},
    p2:{token:p2.displayed.runToken,driftM:p2.identity.driftM,swales:p2.displayed.derived?.swaleOpportunityLines},
    regional:{token:r1.displayed.runToken,swales:r1.displayed.derived?.swaleOpportunityLines},
    p3:{token:p3.displayed.runToken,driftM:p3.identity.driftM,swales:p3.displayed.derived?.swaleOpportunityLines},
    pageErrors,consoleErrors:consoleErrors.slice(-20)
  }));
}catch(error){
  console.error('MANTRA83_PROPERTY_SEQUENCE_FAIL '+JSON.stringify({error:String(error&&error.stack||error),pageErrors,consoleErrors:consoleErrors.slice(-30)}));
  process.exitCode=1;
}finally{
  await browser.close();
}
