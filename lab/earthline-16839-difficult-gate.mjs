import {chromium} from 'playwright';
import fs from 'fs';
const src=fs.readFileSync('lab/earthline-16839-supertile-local-phase-ab.mjs','utf8');
const m=src.match(/const injection=String\.raw`([\s\S]*?)`;\n\nconst browser=/);
if(!m)throw new Error('16839 injection not found');
const injection=m[1];
const states=['Iowa','Arkansas','Oklahoma','Nebraska','Vermont','Texas','Florida','Louisiana','California','New York','Maryland','Colorado'];
const browser=await chromium.launch({headless:true});
const rows=[];
for(const state of states){
  const page=await browser.newPage({viewport:{width:1800,height:900}});let injectError=null,error=null;
  await page.route('https://earthlinedevelopment.org/**',async route=>{const req=route.request();if(req.resourceType()!=='document'){await route.continue();return;}const u=new URL(req.url());if(u.pathname!=='/'&&u.pathname!=='/index.html'){await route.continue();return;}const resp=await route.fetch();let body=await resp.text();const anchor='    /* EARTHLINE 16780 — the coarse 6x6 coverage owner can pass while a large';const at=body.indexOf(anchor);if(at<0){injectError='16780 anchor missing';await route.fulfill({response:resp,body});return;}body=body.slice(0,at)+injection+body.slice(at);await route.fulfill({response:resp,body});});
  try{
    await page.goto('https://earthlinedevelopment.org/?gate16839='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},state);
    await page.waitForFunction(()=>{const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020;return window.EARTHLINE_STATEWIDE_SUPERTILE_16839&&window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0&&Number(d?.swaleLines||0)>0;},null,{timeout:110000,polling:100});
    await page.waitForTimeout(300);
  }catch(e){error=String(e?.message||e);}
  const snap=await page.evaluate(()=>{const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{},perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{},land=window.EARTHLINE_LAND_VALIDITY_16584||{},loc=window.EARTHLINE_STATEWIDE_SUPERTILE_16839||{},root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||{};return {generated:Number(p.generated||0),visible:Number(d.swaleLines||0),unsafe:Number(flow.unsafeSegments||0),coreMs:Number(perf.totalMs||NaN),waterReady:Array.isArray(land.waterParts),gaps:Number(loc.gaps||0),groups:Number(loc.groups||0),added:Number(loc.added||0),failed:Number(loc.failed||0),localMs:Number(loc.elapsedMs||0),rootPass:root.pass??root.rootPass??null,firstFailedStage:root.firstFailedStage||null,pubOutside:Number(p.outsideJurisdiction||p.outside||p.outsideCount||0)};}).catch(()=>({}));
  rows.push({state,error,injectError,...snap});
  console.log(JSON.stringify(rows.at(-1)));
  await page.close();
}
await browser.close();
const pass=rows.every(r=>!r.error&&!r.injectError&&r.generated>0&&r.generated===r.visible&&r.unsafe===0&&r.pubOutside===0&&r.waterReady&&Number.isFinite(r.coreMs)&&r.coreMs<=15000&&r.failed===0);
fs.mkdirSync('out',{recursive:true});fs.writeFileSync('out/16839-difficult-gate.json',JSON.stringify({at:new Date().toISOString(),pass,rows},null,2));console.log(JSON.stringify({pass,rows:rows.map(r=>({state:r.state,error:r.error,generated:r.generated,visible:r.visible,unsafe:r.unsafe,pubOutside:r.pubOutside,coreMs:r.coreMs,localMs:r.localMs,gaps:r.gaps,groups:r.groups,added:r.added,failed:r.failed}))}));if(!pass)process.exit(2);
