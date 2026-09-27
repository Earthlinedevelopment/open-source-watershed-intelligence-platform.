import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
await page.goto('http://127.0.0.1:8787/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(5000);

function need(cond,msg,obj){if(!cond)throw new Error(msg+' '+JSON.stringify(obj||{}));}
async function choose(value){
  await page.evaluate(v=>{const s=document.querySelector('#earthlineLanguage16488');if(!s)throw new Error('language selector missing');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}))},value);
  // Intentionally outwait the inherited 900 ms UI maintenance owner.
  await page.waitForTimeout(1400);
  return page.evaluate(()=>({
    lang:document.documentElement.lang,
    stored:window.EARTHLINE_LANGUAGE_16488,
    run:document.querySelector('#runBtn span')?.textContent?.trim(),
    runTitle:document.querySelector('#runBtn')?.title,
    runAria:document.querySelector('#runBtn')?.getAttribute('aria-label'),
    contact:document.querySelector('#earthlineRailContact16512 .earthline-contact-label-16512')?.textContent?.trim(),
    gauge:document.querySelector('.earthline-recharge-gauge-label-16488')?.textContent?.trim(),
    property:typeof window.earthlinePropertyTargetLabel16848==='function'?window.earthlinePropertyTargetLabel16848({lat:44.5,lng:-72.6},window.EARTHLINE_LANGUAGE_16488):null
  }));
}

const th=await choose('th');
need(th.lang==='th'&&th.stored==='th','Thai state not stable',th);
need(th.run==='เริ่มการวิเคราะห์','Thai Run Analysis reset after maintenance interval',th);
need(th.runTitle==='เริ่มการวิเคราะห์'&&th.runAria==='เริ่มการวิเคราะห์','Thai Run metadata reset',th);
need(th.contact==='ติดต่อ'&&th.gauge==='ศักยภาพการเติมน้ำใต้ดิน','Thai launch UI reset',th);
need(th.property?.startsWith('เป้าเล็ง'),'Thai Property label reset',th);

const vi=await choose('vi');
need(vi.lang==='vi'&&vi.stored==='vi','Vietnamese state not stable',vi);
need(vi.run==='CHẠY PHÂN TÍCH','Vietnamese Run Analysis reset after maintenance interval',vi);
need(vi.runTitle==='CHẠY PHÂN TÍCH'&&vi.runAria==='CHẠY PHÂN TÍCH','Vietnamese Run metadata reset',vi);
need(vi.contact==='LIÊN HỆ'&&vi.gauge==='Tiềm năng bổ cập tầng chứa nước','Vietnamese launch UI reset',vi);
need(vi.property?.startsWith('TÂM NGẮM'),'Vietnamese Property label reset',vi);

const en=await choose('en');
need(en.lang==='en'&&en.stored==='en','English state not stable',en);
need(en.run==='RUN ANALYSIS'&&en.runTitle==='RUN ANALYSIS'&&en.runAria==='RUN ANALYSIS','English Run Analysis did not restore',en);
need(en.contact==='CONTACT'&&en.gauge==='Recharge Potential','English launch UI did not restore',en);
need(en.property?.startsWith('CROSSHAIR'),'English Property label did not restore',en);

if(pageErrors.length)throw new Error('page errors: '+pageErrors.join(' | '));
console.log(JSON.stringify({PASS:true,th,vi,en},null,2));
await browser.close();
