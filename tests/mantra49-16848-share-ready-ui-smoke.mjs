import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const source=await fs.readFile('index.html','utf8');
if(!source.includes('mailto:info@earthlinedevelopment.org?subject=Earthline%20Inquiry')) throw new Error('correct Contact mailto missing');
if(source.includes('Earthlineinfo@earthlinedevelopment.org')) throw new Error('wrong Contact address remains');
if(!source.includes('EARTHLINE_TEXT_16848')) throw new Error('16848 translation owner missing');

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[]; const consoleErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
await page.goto('http://127.0.0.1:8787/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(5000);
const boot=await page.evaluate(()=>({
  ready:document.readyState,
  rail:!!document.querySelector('#earthlineRail16188'),
  panel:!!document.querySelector('#earthlinePanel16188'),
  language:!!document.querySelector('#earthlineLanguage16488'),
  contact:!!document.querySelector('#earthlineRailContact16512'),
  gauge:!!document.querySelector('.earthline-recharge-gauge-label-16488'),
  build:window.EARTHLINE_BUILD||null,
  restore:typeof window.earthlineRestoreUi16488,
  langFn:typeof window.earthlinePropertyTargetLabel16848,
  htmlLang:document.documentElement.lang
}));
console.log('BOOT '+JSON.stringify({boot,pageErrors,consoleErrors},null,2));
if(pageErrors.length) throw new Error('Browser page errors during boot: '+pageErrors.join(' | '));
if(!boot.rail||!boot.panel||!boot.language||!boot.contact||!boot.gauge) throw new Error('Launch UI did not initialize '+JSON.stringify(boot));

async function snapshot(){
  return page.evaluate(()=>({
    lang:document.documentElement.lang,
    stored:window.EARTHLINE_LANGUAGE_16488,
    language:document.querySelector('#earthlineLanguageLabel16488')?.textContent?.trim(),
    contact:document.querySelector('#earthlineRailContact16512 .earthline-contact-label-16512')?.textContent?.trim(),
    placeholder:document.querySelector('#searchInput')?.getAttribute('placeholder'),
    run:document.querySelector('#runBtn span')?.textContent?.trim(),
    gauge:document.querySelector('.earthline-recharge-gauge-label-16488')?.textContent?.trim(),
    rainfall:document.querySelector('.earthline-rainfall-label-16488')?.textContent?.trim(),
    swales:document.querySelector('#earthlineHamburgerMenu16233 a[href="#swales-explained"] span:last-child')?.textContent?.trim(),
    process:document.querySelector('#earthlineHamburgerMenu16233 a.earthline-process-link-16265 span:last-child')?.textContent?.trim(),
    propFn:typeof window.earthlinePropertyTargetLabel16848,
    propSample:typeof window.earthlinePropertyTargetLabel16848==='function'?window.earthlinePropertyTargetLabel16848({lat:44.5,lng:-72.6},window.EARTHLINE_LANGUAGE_16488):null
  }));
}
function need(cond,msg,obj){if(!cond)throw new Error(msg+' '+JSON.stringify(obj||{}));}
async function choose(value){await page.evaluate(v=>{const s=document.querySelector('#earthlineLanguage16488');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}))},value);await page.waitForTimeout(200)}

await choose('th');
let th=await snapshot();
need(th.lang==='th'&&th.stored==='th','Thai language state failed',th);
need(th.language==='ภาษา','Thai language label failed',th);
need(th.contact==='ติดต่อ','Thai Contact failed',th);
need(th.placeholder?.startsWith('ค้นหา'),'Thai search placeholder failed',th);
need(th.gauge==='ศักยภาพการเติมน้ำใต้ดิน','Thai gauge label failed',th);
need(th.rainfall==='ปริมาณฝนเฉลี่ยรายปี:','Thai rainfall label failed',th);
need(th.swales==='ทำความเข้าใจไบโอสเวล','Thai menu failed',th);
need(th.process==='กระบวนการ Earthline','Thai process link failed',th);
need(th.propFn==='function'&&th.propSample?.startsWith('เป้าเล็ง'),'Thai Property label owner failed',th);

await choose('vi');
let vi=await snapshot();
need(vi.lang==='vi'&&vi.stored==='vi','Vietnamese language state failed',vi);
need(vi.language==='Ngôn ngữ','Vietnamese language label failed',vi);
need(vi.contact==='LIÊN HỆ','Vietnamese Contact failed',vi);
need(vi.placeholder?.startsWith('Tìm kiếm'),'Vietnamese search placeholder failed',vi);
need(vi.gauge==='Tiềm năng bổ cập tầng chứa nước','Vietnamese gauge label failed',vi);
need(vi.rainfall==='Lượng mưa trung bình hằng năm:','Vietnamese rainfall label failed',vi);
need(vi.swales==='Giải thích Bioswale','Vietnamese menu failed',vi);
need(vi.process==='Quy trình Earthline','Vietnamese process link failed',vi);
need(vi.propFn==='function'&&vi.propSample?.startsWith('TÂM NGẮM'),'Vietnamese Property label owner failed',vi);

await choose('en');
let en=await snapshot();
need(en.lang==='en'&&en.stored==='en','English language state failed',en);
need(en.contact==='CONTACT','English Contact failed',en);
need(en.gauge==='Recharge Potential','English gauge restore failed',en);
need(en.swales==='Swales Explained','English menu restore failed',en);
need(en.process==='The Earthline Process','English process restore failed',en);

if(pageErrors.length) throw new Error('Browser page errors: '+pageErrors.join(' | '));
console.log(JSON.stringify({PASS:true,th,vi,en,consoleErrors},null,2));
await browser.close();
