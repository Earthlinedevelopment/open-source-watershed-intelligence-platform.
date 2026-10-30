const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'https://earthlinedevelopment.org/';
const places = [
  {name:'Germany', q:'Germany'},
  {name:'India', q:'India'},
  {name:'Vietnam', q:'Vietnam'},
  {name:'New Zealand', q:'New Zealand country'},
  {name:'Australia', q:'Australia'},
  {name:'Alaska', q:'Alaska'},
  {name:'Hawaii', q:'Hawaii'}
];
const out={startedAt:new Date().toISOString(),build:'16882',languages:{},places:{},errors:[]};
const save=()=>{fs.mkdirSync('artifacts/mantra49-16882',{recursive:true});fs.writeFileSync('artifacts/mantra49-16882/results.json',JSON.stringify(out,null,2));};
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
async function useCandidate(page){
  await page.route('**/earthline-launch-16872.js*', async route=>{
    await route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync('earthline-launch-16872.js','utf8')});
  });
}
async function waitReady(page){
  await page.waitForSelector('#earthlineLanguage16488',{timeout:30000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>typeof window.earthlineSyncPropertyTargetFromMap16201==='function',{timeout:30000});
  await page.waitForTimeout(1800);
}
async function uiSnapshot(page){
  return page.evaluate(()=>{
    const txt=s=>document.querySelector(s)?.textContent?.replace(/\s+/g,' ').trim()||'';
    const rail=id=>{const e=document.getElementById(id);if(!e)return null;const r=e.getBoundingClientRect();return {text:(e.textContent||'').replace(/\s+/g,' ').trim(),w:r.width,h:r.height,scrollW:e.scrollWidth,scrollH:e.scrollHeight}};
    return {
      selector:document.getElementById('earthlineLanguage16488')?.value||'',
      native:window.EARTHLINE_LANGUAGE_16488||'',lang:document.documentElement.lang,
      search:txt('#earthlineSearchSection16188 .el-panel-label-16188'),
      property:txt('#earthlinePropertySection16188 .el-panel-label-16188'),
      report:txt('#earthlineReportSection16188 .el-panel-label-16188'),
      placeholder:document.getElementById('searchInput')?.getAttribute('placeholder')||'',
      engine:txt('.earthline-engine-sentence-16488'),note:txt('.earthline-professional-note-16488'),
      gauge:txt('.earthline-recharge-gauge-label-16488'),rain:txt('.earthline-rainfall-label-16488'),
      run:txt('#runBtn'),reportButton:txt('#earthlineVermontReport16149'),
      contact:rail('earthlineRailContact16512'),login:rail('earthlineLaunchLogin16872'),donate:rail('earthlineLaunchDonate16872'),merch:rail('earthlineLaunchMerch16872')
    };
  });
}
const expected={
  en:{search:'Search',property:'Property Modelling',placeholder:'Search a location',gauge:'Recharge Potential',rain:'Average yearly rainfall:',run:'RUN ANALYSIS',contact:'CONTACT',login:'LOGIN',donate:'DONATE',merch:'MERCH'},
  es:{search:'Buscar',property:'Modelado de propiedad',placeholder:'Buscar una ubicación',gauge:'Potencial de recarga',rain:'Precipitación media anual:',run:'EJECUTAR ANÁLISIS',contact:'CONTACTO',login:'INICIAR SESIÓN',donate:'DONAR',merch:'PRODUCTOS'},
  vi:{search:'Tìm kiếm',property:'Mô hình hóa khu đất',placeholder:'Tìm kiếm địa điểm',gauge:'Tiềm năng bổ cập',rain:'Lượng mưa trung bình năm:',run:'CHẠY PHÂN TÍCH',contact:'LIÊN HỆ',login:'ĐĂNG NHẬP',donate:'ỦNG HỘ',merch:'SẢN PHẨM'},
  th:{search:'ค้นหา',property:'การจำลองพื้นที่',placeholder:'ค้นหาสถานที่',gauge:'ศักยภาพการเติมน้ำ',rain:'ปริมาณฝนเฉลี่ยต่อปี:',run:'เรียกใช้การวิเคราะห์',contact:'ติดต่อ',login:'เข้าสู่ระบบ',donate:'บริจาค',merch:'สินค้า'}
};
function assertLanguage(s,code,label){
  const e=expected[code];
  for(const k of ['search','property','placeholder','gauge','rain','run']) if(norm(s[k])!==norm(e[k])) throw new Error(`${label}: ${k} expected ${e[k]} got ${s[k]}`);
  for(const k of ['contact','login','donate','merch']){
    if(!s[k]) throw new Error(`${label}: missing ${k}`);
    if(norm(s[k].text)!==norm(e[k])) throw new Error(`${label}: ${k} expected ${e[k]} got ${s[k].text}`);
    if(s[k].w>61||s[k].h>61||s[k].scrollW>s[k].w+2||s[k].scrollH>s[k].h+3) throw new Error(`${label}: ${k} rail overflow ${JSON.stringify(s[k])}`);
  }
  if(s.selector!==code||s.native!==code||s.lang!==code) throw new Error(`${label}: language state mismatch ${JSON.stringify({selector:s.selector,native:s.native,lang:s.lang})}`);
}
async function testLanguages(browser){
  const ctx=await browser.newContext({viewport:{width:1800,height:900}});const p=await ctx.newPage();await useCandidate(p);
  await p.goto(BASE+'?audit=16882-language',{waitUntil:'domcontentloaded',timeout:60000});await waitReady(p);
  await p.selectOption('#earthlineLanguage16488','en');await p.waitForTimeout(900);let s=await uiSnapshot(p);assertLanguage(s,'en','initial English');out.languages.initialEnglish=s;
  for(const code of ['vi','en','es','en','th','en']){
    await p.selectOption('#earthlineLanguage16488',code);await p.waitForTimeout(1000);s=await uiSnapshot(p);assertLanguage(s,code,`switch ${code}`);out.languages[`switch_${code}_${Object.keys(out.languages).length}`]=s;
  }
  await p.selectOption('#earthlineLanguage16488','vi');await p.waitForTimeout(700);await p.reload({waitUntil:'domcontentloaded',timeout:60000});await waitReady(p);s=await uiSnapshot(p);assertLanguage(s,'vi','Vietnamese hard refresh');out.languages.vietnameseHardRefresh=s;
  await p.selectOption('#earthlineLanguage16488','en');await p.waitForTimeout(1000);s=await uiSnapshot(p);assertLanguage(s,'en','English after Vietnamese hard refresh');out.languages.englishAfterHardRefresh=s;
  await p.screenshot({path:'artifacts/mantra49-16882/language-final-english.png',fullPage:false});await ctx.close();save();
}
async function waitRegional(page){
  return page.evaluate(()=>new Promise(resolve=>{
    const started=Date.now();let done=false;
    const finish=(kind,detail)=>{if(done)return;done=true;resolve({kind,detail,elapsedMs:Date.now()-started})};
    const check=()=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();if(tier.includes('regional'))finish('displayed',d)};
    document.addEventListener('earthline:analysis-complete',e=>{const t=String(e.detail&&(e.detail.tier||e.detail.mode)||'').toLowerCase();if(t.includes('regional'))finish('complete',e.detail||{})});
    document.addEventListener('earthline:analysis-failed',e=>finish('failed',e.detail||{}));
    const iv=setInterval(()=>{if(done){clearInterval(iv);return}check()},250);
    setTimeout(()=>finish('timeout',{}),55000);
  }));
}
async function waitProperty(page){
  return page.evaluate(()=>new Promise(resolve=>{
    const started=Date.now();let done=false;const finish=(kind,detail)=>{if(done)return;done=true;resolve({kind,detail,elapsedMs:Date.now()-started})};
    document.addEventListener('earthline:analysis-complete',e=>{const t=String(e.detail&&(e.detail.tier||e.detail.mode)||'').toLowerCase();if(t.includes('property'))finish('complete',e.detail||{})});
    document.addEventListener('earthline:analysis-failed',e=>finish('failed',e.detail||{}));
    setTimeout(()=>finish('timeout',{}),55000);
  }));
}
async function mapSnapshot(page){
  return page.evaluate(()=>{
    const m=window.earthlineMap||null,c=m&&m.getCenter?m.getCenter():null,t=window.EARTHLINE_PROPERTY_TARGET_16201||null,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    return {loc:typeof M!=='undefined'&&M&&M.loc?{name:M.loc.name,fullName:M.loc.fullName,countryCode:M.loc.countryCode,lat:M.loc.lat,lng:M.loc.lng,bbox:M.loc.bbox}:null,center:c?{lng:c.lng,lat:c.lat}:null,target:t?{lng:t.lng,lat:t.lat,code:t.code||'',source:t.source||''}:null,tier:String(d&&(d.tier||d.mode)||''),score:d&&d.recharge?d.recharge.score:null};
  });
}
async function dragMap(page){
  const canvas=page.locator('.mapboxgl-canvas').first();if(await canvas.count()===0) throw new Error('Mapbox canvas missing');const r=await canvas.boundingBox();if(!r)throw new Error('Map canvas box unavailable');
  const x=r.x+r.width*.56,y=r.y+r.height*.52;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-180,y+40,{steps:12});await page.mouse.up();await page.waitForTimeout(1400);
}
async function testPlace(browser,place,index){
  const ctx=await browser.newContext({viewport:{width:1800,height:900}});const page=await ctx.newPage();await useCandidate(page);const errs=[];page.on('pageerror',e=>errs.push('pageerror '+e.message));page.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text())});
  await page.goto(BASE+`?audit=16882-${encodeURIComponent(place.name)}-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:60000});await waitReady(page);
  await page.selectOption('#earthlineLanguage16488','en');await page.fill('#searchInput',place.q);
  const regPromise=waitRegional(page);await page.click('#runBtn');const regional=await regPromise;if(!['complete','displayed'].includes(regional.kind))throw new Error(`${place.name}: regional ${regional.kind}`);
  await page.waitForTimeout(1000);const before=await mapSnapshot(page);if(!before.loc||!before.center)throw new Error(`${place.name}: missing loc/center ${JSON.stringify(before)}`);
  if(!before.target) await page.evaluate(()=>window.earthlineSyncPropertyTargetFromMap16201&&window.earthlineSyncPropertyTargetFromMap16201());
  const preDrag=await mapSnapshot(page);await dragMap(page);const postDrag=await mapSnapshot(page);
  if(!preDrag.target||!postDrag.target)throw new Error(`${place.name}: property target missing before/after drag`);
  const delta=Math.hypot(Number(postDrag.target.lng)-Number(preDrag.target.lng),Number(postDrag.target.lat)-Number(preDrag.target.lat));
  if(!(delta>0.0001))throw new Error(`${place.name}: crosshair target did not move after map drag; before=${JSON.stringify(preDrag.target)} after=${JSON.stringify(postDrag.target)}`);
  const buttonText=await page.locator('#earthlineDeclareProperty16169').innerText();if(!/CROSSHAIR|ANALYZE/.test(buttonText))throw new Error(`${place.name}: property button not ready: ${buttonText}`);
  const propPromise=waitProperty(page);await page.click('#earthlineDeclareProperty16169');const property=await propPromise;if(property.kind!=='complete')throw new Error(`${place.name}: property ${property.kind}`);
  await page.waitForTimeout(900);const final=await mapSnapshot(page);
  await page.screenshot({path:`artifacts/mantra49-16882/${String(index+1).padStart(2,'0')}-${place.name.toLowerCase().replace(/[^a-z]+/g,'-')}.png`,fullPage:false});
  out.places[place.name]={regional,preDrag,postDrag,dragDelta:delta,property,final,consoleErrors:errs.slice(0,20)};save();await ctx.close();
}
(async()=>{let browser;try{browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-dev-shm-usage']});await testLanguages(browser);for(let i=0;i<places.length;i++){await testPlace(browser,places[i],i)}out.finishedAt=new Date().toISOString();out.pass=true;save();console.log('MANTRA49 16882 RELEASE AUDIT PASS');console.log(JSON.stringify(out,null,2));}catch(e){out.pass=false;out.failure=String(e&&e.stack||e);save();console.error(out.failure);process.exitCode=1}finally{if(browser)await browser.close()}})();
