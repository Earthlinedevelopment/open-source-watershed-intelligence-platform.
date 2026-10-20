import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
if(!launcher)throw new Error('Unsupported browser '+BROWSER);
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const recoveryHtml=readFileSync('index.html','utf8');
const recoveryLaunch=readFileSync('earthline-launch-16872.js','utf8');
const browser=await launcher.launch({headless});
const ART='artifacts/production-recovery-m69';
mkdirSync(ART,{recursive:true});

const cases=[
  {name:'Essex',query:'Essex, Vermont'},
  {name:'Rutland',query:'Rutland, Vermont'}
];

function safeName(v){return String(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}

async function visible(locator){
  try{return await locator.isVisible()}catch{return false}
}
async function snap(page,label){
  return await page.evaluate(label=>{
    const shown=el=>{
      if(!el)return false;
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>1&&r.height>1;
    };
    const water=document.getElementById('earthlinePropertyWaterOverlay15824');
    const modal=document.getElementById('modalBg');
    const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const pub=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||M?.propertyPublication15816||null;
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const safe=M?.authoritativeSafeSwales15815;
    const safeCount=Number(safe?.features?.length??safe?.length??audit?.corridors??0);
    const direct=M?.directWaterRenderer15824||null;
    const authority=M?.directAuthorityGeometryAudit15874||M?.safetyAudit15806||null;
    const bodyText=String(document.body?.innerText||'');
    return {
      label,
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      audit,
      publication:pub,
      target:target?{lng:Number(target.lng),lat:Number(target.lat),code:String(target.code||''),parentRunToken:String(target.parentRunToken||'')}:null,
      water:{
        exists:!!water,
        visible:shown(water),
        children:Number(water?.childElementCount||0),
        cores:Number(water?.querySelectorAll?.('.water-core')?.length||0),
        renderer:direct
      },
      safeCount,
      safetyVerified:M?.safetyAudit15806?.verified===true||M?.propertyResultLock15815?.safetyVerified===true,
      authorityIntersections:Number.isFinite(Number(authority?.intersectionCount))?Number(authority.intersectionCount):null,
      d1Box:!!document.getElementById('earthlineExclusionEvidence16516'),
      d5Hint:!!document.getElementById('earthlineCrosshairMoveHint17093'),
      supportButton:!!document.querySelector('[data-act="support"]'),
      supportModalVisible:shown(modal)&&/Support|Help\s*&?\s*Documentation/i.test(String(modal?.textContent||'')),
      obsoleteSupportCopy:/Upgrade path to live data/i.test(bodyText),
      pageErrors:window.__M69_PAGE_ERRORS||[]
    };
  },label);
}
function sameTarget(a,b){
  if(!a||!b)return false;
  return Math.abs(Number(a.lng)-Number(b.lng))<1e-7&&Math.abs(Number(a.lat)-Number(b.lat))<1e-7&&String(a.code||'')===String(b.code||'');
}
function propertySnapshotPass(s){
  return !!(
    s&&
    s.audit?.settled===true&&s.audit?.result===true&&
    s.propertyState!=='running'&&
    s.water?.visible===true&&s.water?.children>0&&s.water?.cores>0&&
    s.safeCount>0&&s.safetyVerified===true&&
    (s.authorityIntersections===null||s.authorityIntersections===0)&&
    !s.d1Box&&!s.d5Hint&&!s.supportButton&&!s.supportModalVisible&&!s.obsoleteSupportCopy
  );
}

const results=[];
for(const c of cases){
  const context=await browser.newContext({viewport:{width:1700,height:950}});
  // Test the recovery source on the real production origin without modifying pages-live.
  // This preserves the exact Origin header required by Terrain/CHMv2/CORS while
  // substituting only the two recovery-modified public files.
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    const req=route.request();
    const u=new URL(req.url());
    if(req.resourceType()==='document'&&u.origin==='https://earthlinedevelopment.org'&&u.pathname==='/'){
      await route.fulfill({status:200,body:recoveryHtml,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
      return;
    }
    if(u.origin==='https://earthlinedevelopment.org'&&u.pathname==='/earthline-launch-16872.js'){
      await route.fulfill({status:200,body:recoveryLaunch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
      return;
    }
    await route.continue();
  });
  const page=await context.newPage();
  const pageErrors=[];
  await page.addInitScript(()=>{window.__M69_PAGE_ERRORS=[]});
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')pageErrors.push(m.text())});
  await page.goto(BASE+'?m69='+encodeURIComponent(BROWSER+'-'+c.name+'-'+Date.now()),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});

  // Fresh load: forbidden UI must not already be present.
  const fresh=await snap(page,'fresh');
  if(fresh.d1Box||fresh.d5Hint||fresh.supportButton||fresh.supportModalVisible||fresh.obsoleteSupportCopy){
    throw new Error(c.name+' fresh-load forbidden UI regression '+JSON.stringify(fresh));
  }

  // Physical Regional search/run.
  const input=page.locator('#searchInput');
  await input.click();
  await input.fill(c.query);
  await page.waitForTimeout(700);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(await opts.count())await opts.first().click();
  const run=page.locator('#runBtn');
  await run.click({timeout:15000});
  await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''))&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:120000,polling:100});
  await page.waitForTimeout(500);
  const regional=await snap(page,'regional');
  await page.screenshot({path:`${ART}/${BROWSER}-${safeName(c.name)}-regional.png`,fullPage:true});
  if(regional.d1Box||regional.d5Hint||regional.supportButton||regional.supportModalVisible||regional.obsoleteSupportCopy){
    throw new Error(c.name+' Regional forbidden UI regression '+JSON.stringify(regional));
  }

  // Physical corridor selection and Zoom to Location.
  let corridor=page.locator('[aria-label^="Open details for A"]:visible').first();
  if(!(await corridor.count()))corridor=page.getByText(/^A\d+$/).first();
  if(!(await corridor.count()))throw new Error(c.name+' no visible Regional corridor control');
  await corridor.click({timeout:15000});
  await page.waitForTimeout(250);
  let zoom=page.getByRole('button',{name:/zoom to (?:this )?location/i}).first();
  if(!(await zoom.count()))zoom=page.locator('button').filter({hasText:/zoom to (?:this )?location/i}).first();
  if(!(await zoom.count()))throw new Error(c.name+' no Zoom to Location control after corridor selection');
  await zoom.click({timeout:15000});
  await page.waitForTimeout(1200);
  const afterZoom=await snap(page,'after-zoom');
  if(afterZoom.d5Hint||afterZoom.supportModalVisible)throw new Error(c.name+' overlay appeared after Zoom');

  // Ensure the Property control is reachable, then physical click it.
  if(!(await visible(page.locator('#earthlineDeclareProperty16169')))){
    const rail=page.locator('#earthlineRailSearch16188');
    if(await rail.count())await rail.click().catch(()=>{});
    await page.waitForTimeout(250);
  }
  const prop=page.locator('#earthlineDeclareProperty16169');
  await prop.waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&!b.disabled&&b.dataset.busy!=='1'},null,{timeout:15000,polling:100});

  const before1=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),target:window.EARTHLINE_PROPERTY_TARGET_16201||null}));
  await prop.click({timeout:15000});
  await page.waitForFunction(prev=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)===Number(prev)+1, before1.serial,{timeout:15000,polling:50});
  await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return !!a&&a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running'},null,{timeout:120000,polling:100});
  await page.waitForTimeout(300);
  const immediate=await snap(page,'property-immediate');
  await page.screenshot({path:`${ART}/${BROWSER}-${safeName(c.name)}-property-immediate.png`,fullPage:true});

  await page.waitForTimeout(15000);
  const settled15=await snap(page,'property-15s');
  await page.screenshot({path:`${ART}/${BROWSER}-${safeName(c.name)}-property-15s.png`,fullPage:true});

  // Repeat physical Property click. Exactly one serial increment must occur again.
  if(!(await visible(prop))){
    const rail=page.locator('#earthlineRailSearch16188');
    if(await rail.count())await rail.click().catch(()=>{});
    await page.waitForTimeout(250);
  }
  await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&!b.disabled&&b.dataset.busy!=='1'},null,{timeout:15000,polling:100});
  const before2=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),target:window.EARTHLINE_PROPERTY_TARGET_16201||null}));
  await prop.click({timeout:15000});
  await page.waitForFunction(prev=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)===Number(prev)+1,before2.serial,{timeout:15000,polling:50});
  await page.waitForFunction(prev=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return !!a&&Number(a.serial)===Number(prev)+1&&a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running'},before2.serial,{timeout:120000,polling:100});
  await page.waitForTimeout(300);
  const repeat=await snap(page,'property-repeat');
  await page.screenshot({path:`${ART}/${BROWSER}-${safeName(c.name)}-property-repeat.png`,fullPage:true});

  const serial1=Number(immediate.audit?.serial||0);
  const serial2=Number(repeat.audit?.serial||0);
  const targetPass=sameTarget(before1.target,immediate.target)&&sameTarget(immediate.target,settled15.target)&&sameTarget(before2.target,repeat.target);
  const pass=propertySnapshotPass(immediate)&&propertySnapshotPass(settled15)&&propertySnapshotPass(repeat)&&
    serial1===Number(before1.serial)+1&&serial2===Number(before2.serial)+1&&targetPass&&pageErrors.length===0;
  const row={browser:BROWSER,case:c.name,pass,regional,afterZoom,before1,immediate,settled15,before2,repeat,targetPass,pageErrors};
  results.push(row);
  console.log('EARTHLINE_PRODUCTION_RECOVERY_M69 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
const summary={browser:BROWSER,total:results.length,pass:results.filter(r=>r.pass).length,fail:results.filter(r=>!r.pass).length,results};
console.log('EARTHLINE_PRODUCTION_RECOVERY_M69_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
