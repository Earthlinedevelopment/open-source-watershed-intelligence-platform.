import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const browser=await chromium.launch({headless:true});
const rows=[];
for(let round=1;round<=7;round++){
  for(const tc of [{name:'landscape',w:844,h:390},{name:'portrait',w:390,h:844},{name:'desktop',w:1440,h:900}]){
    const context=await browser.newContext({viewport:{width:tc.w,height:tc.h},isMobile:tc.name!=='desktop',hasTouch:tc.name!=='desktop'});
    await installCandidateOrigin(context);
    const page=await context.newPage();
    await page.goto('https://earthlinedevelopment.org/?suggest-candidate='+round+'-'+tc.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    if(tc.name!=='desktop'&&!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
      await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(200);
    }
    await page.locator('#searchInput').fill('61 Sle');await page.waitForTimeout(700);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').first();
    if(!(await opt.count()))throw new Error(tc.name+' no suggestion');
    const rect=await opt.boundingBox(), menuRect=await page.locator('#earthlineSearchSuggestions15970').boundingBox();
    const inViewport=!!rect&&rect.x>=0&&rect.y>=0&&rect.x+rect.width<=tc.w+1&&rect.y+rect.height<=tc.h+1;
    console.log('M81_SUGGEST_PRE '+JSON.stringify({round,...tc,rect,menuRect,inViewport,inputRect:await page.locator('#searchInput').boundingBox(),runRect:await page.locator('#runBtn').boundingBox(),scrollY:await page.evaluate(()=>window.scrollY)}));
    if(!inViewport){rows.push({round,...tc,rect,menuRect,inViewport,tapOk:false,valueOk:false,pass:false});await context.close();continue;}
    let tapOk=false;
    if(tc.name==='desktop'){await opt.click({timeout:8000});tapOk=true}else{await opt.tap({timeout:8000});tapOk=true}
    const value=await page.locator('#searchInput').inputValue();
    const row={round,...tc,rect,menuRect,inViewport,tapOk,valueOk:/61 Sleepy Hollow/i.test(value)};
    row.pass=row.inViewport&&row.tapOk&&row.valueOk;rows.push(row);console.log('M81_SUGGEST '+JSON.stringify(row));
    await context.close();
  }
}
await browser.close();
if(rows.some(r=>!r.pass))throw new Error('suggestion candidate failed '+JSON.stringify(rows.filter(r=>!r.pass)));
