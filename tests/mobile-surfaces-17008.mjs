import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mobile-surfaces-17008';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
const result={errors,checks:{}};

function fit(box,w=390,h=844){return !!box&&box.x>=-1&&box.y>=-1&&box.x+box.width<=w+1&&box.y+box.height<=h+1}
async function box(sel){const e=page.locator(sel).first();if(!await e.count())return null;return await e.boundingBox()}

// Main site / closed map.
await page.goto(BASE+'?mobile_surfaces_17008='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#earthlineRail16188',{state:'attached',timeout:20000});
await page.waitForTimeout(1000);
if(await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlinePanelClose16188')?.click());
  await page.waitForTimeout(400);
}
result.checks.rail=fit(await box('#earthlineRail16188'));

// Login modal and phone-safe inputs.
await page.evaluate(()=>document.getElementById('earthlineLaunchLogin16872')?.click());
await page.waitForTimeout(250);
result.checks.loginModalOpen=await page.evaluate(()=>document.getElementById('earthlineAccountModal16872')?.classList.contains('open')||false);
const cardBox=await box('#earthlineAccountModal16872 .earthline-launch-card-16872');
result.checks.loginCardFits=fit(cardBox);
result.checks.loginInputFont=await page.evaluate(()=>{
  const i=document.querySelector('#earthlineAccountModal16872 input');
  return i?parseFloat(getComputedStyle(i).fontSize):null;
});
result.checks.loginInputNoIosZoom=(result.checks.loginInputFont??0)>=16;
await page.locator('#earthlineAccountModal16872 .earthline-launch-close-16872').click();
await page.waitForTimeout(150);
result.checks.loginModalClosed=!(await page.evaluate(()=>document.getElementById('earthlineAccountModal16872')?.classList.contains('open')||false));

// Hamburger menu.
await page.evaluate(()=>document.getElementById('earthlineRailMenu16188')?.click());
await page.waitForTimeout(200);
const menuBox=await box('#earthlineHamburgerMenu16233');
result.checks.menuFits=fit(menuBox);
result.checks.menuLinks=await page.locator('#earthlineHamburgerMenu16233 a').count();
await page.keyboard.press('Escape').catch(()=>{});

// DATA button/modal if available.
const dataBtn=page.locator('#earthlineRail16188').getByText('DATA',{exact:true}).first();
result.checks.dataButtonExists=(await dataBtn.count())>0;
if(result.checks.dataButtonExists){
  await dataBtn.click();
  await page.waitForTimeout(250);
  const modal=page.locator('#earthlineRechargeDataModal16488');
  result.checks.dataModalVisible=(await modal.count())>0 && await modal.isVisible();
  const shellBox=await box('#earthlineRechargeDataShell16488');
  result.checks.dataShellFits=fit(shellBox);
  if(await page.locator('#earthlineRechargeDataClose16488').count()) await page.locator('#earthlineRechargeDataClose16488').click();
}

// Language selector basic interaction.
const select=page.locator('#earthlineRail16188 select').first();
result.checks.languageSelectExists=(await select.count())>0;
if(result.checks.languageSelectExists){
  const opts=await select.locator('option').allTextContents();
  result.checks.languageOptions=opts;
  const vietnam=opts.find(x=>/viet/i.test(x));
  if(vietnam){await select.selectOption({label:vietnam}); await page.waitForTimeout(200); result.checks.vietnameseSelectable=true}
  else result.checks.vietnameseSelectable=false;
}

// External rail links route correctly without completing any transaction.
for(const [key,id,expectPath] of [['donate','earthlineLaunchDonate16872','donate.html'],['merch','earthlineLaunchMerch16872','merchandise.html']]){
  let popup=null;
  const p=page.waitForEvent('popup',{timeout:2500}).catch(()=>null);
  await page.evaluate(id=>document.getElementById(id)?.click(),id);
  popup=await p;
  if(popup){
    await popup.waitForLoadState('domcontentloaded').catch(()=>{});
    result.checks[key+'PopupUrl']=popup.url();
    result.checks[key+'PopupCorrect']=popup.url().includes(expectPath);
    await popup.close();
  }else{
    result.checks[key+'PopupCorrect']=false;
  }
}

// Standalone auxiliary pages mobile layout.
for(const path of ['donate.html','merchandise.html']){
  const p=await context.newPage();
  await p.goto(BASE+path+'?mobile_surfaces_17008='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
  await p.waitForTimeout(500);
  const audit=await p.evaluate(()=>({
    scrollW:document.documentElement.scrollWidth,
    clientW:document.documentElement.clientWidth,
    bodyW:document.body?.scrollWidth||0,
    imgs:[...document.images].map(i=>({src:i.currentSrc||i.src,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,complete:i.complete}))
  }));
  result.checks[path]={noHorizontalOverflow:audit.scrollW<=audit.clientW+2,imagesLoaded:audit.imgs.every(i=>i.complete&&i.naturalWidth>0),audit};
  await p.screenshot({path:`${OUT}/${path.replace('.html','')}.png`,fullPage:true});
  await p.close();
}

await page.screenshot({path:`${OUT}/main-mobile.png`,fullPage:true});
const booleans=[];
for(const [k,v] of Object.entries(result.checks)){
  if(typeof v==='boolean')booleans.push([k,v]);
  else if(v&&typeof v==='object'&&'noHorizontalOverflow' in v){booleans.push([k+'.noHorizontalOverflow',v.noHorizontalOverflow]);booleans.push([k+'.imagesLoaded',v.imagesLoaded]);}
}
result.pass=errors.length===0&&booleans.every(([,v])=>v!==false);
writeFileSync(`${OUT}/summary.json`,JSON.stringify(result,null,2));
console.log('EARTHLINE_MOBILE_SURFACES_17008 '+JSON.stringify({pass:result.pass,checks:result.checks,errors}));
await browser.close();
if(!result.pass)process.exitCode=1;
