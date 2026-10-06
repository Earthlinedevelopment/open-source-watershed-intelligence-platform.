import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
mkdirSync('artifacts/mobile-acceptance-17005',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:390,height:844},
  isMobile:true,
  hasTouch:true,
  deviceScaleFactor:3
});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?mobile_acceptance_17005='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForSelector('#earthlineRailSearch16188',{timeout:15000});
await page.waitForTimeout(1200);

async function audit(label){
  const data=await page.evaluate(()=>{
    const rect=id=>{const e=document.getElementById(id);if(!e)return null;const r=e.getBoundingClientRect();const s=getComputedStyle(e);return {id,display:s.display,visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
    const blackCandidates=[...document.querySelectorAll('body *')].map((e,i)=>{
      const s=getComputedStyle(e),r=e.getBoundingClientRect();
      const bg=s.backgroundColor;
      const pos=s.position;
      const visible=s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>40&&r.height>20;
      const dark=/rgba?\((?:0|1?[0-9]|2[0-9]|3[0-9]),\s*(?:0|1?[0-9]|2[0-9]|3[0-9]),\s*(?:0|1?[0-9]|2[0-9]|3[0-9])/.test(bg||'');
      const large=r.width*r.height>5000;
      if(!(visible&&dark&&large))return null;
      return {tag:e.tagName,id:e.id||'',cls:String(e.className||'').slice(0,120),bg,pos,z:s.zIndex,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),text:String(e.textContent||'').trim().slice(0,120)};
    }).filter(Boolean).slice(0,40);
    return {
      viewport:document.querySelector('meta[name="viewport"]')?.content||null,
      panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188'),
      rail:rect('earthlineRail16188'),
      panel:rect('earthlinePanel16188'),
      close:rect('earthlinePanelClose16188'),
      run:rect('runBtn'),
      blackCandidates
    };
  });
  writeFileSync('artifacts/mobile-acceptance-17005/'+label+'.json',JSON.stringify(data,null,2));
  return data;
}

const initial=await audit('01-initial');
await page.click('#earthlineRailSearch16188');
await page.waitForTimeout(500);
const opened=await audit('02-opened');

const railHidden=opened.rail && opened.rail.visibility==='hidden' && opened.rail.pointerEvents==='none';
const panelOpen=opened.panelOpen===true && opened.panel && opened.panel.w>=380;
if(!railHidden) throw new Error('Mobile rail remains interactive/visible above open panel: '+JSON.stringify(opened.rail));
if(!panelOpen) throw new Error('Mobile search panel did not become authoritative full-width surface: '+JSON.stringify(opened.panel));

await page.click('#earthlinePanelClose16188');
await page.waitForTimeout(700);
const closed=await audit('03-closed');

if(closed.panelOpen) throw new Error('Panel-open state remained after close');
const suspiciousAfterClose=closed.blackCandidates.filter(x=>{
  const txt=(x.text||'').toLowerCase();
  const allowed = x.id==='mapboxBase' || x.cls.includes('mapboxgl') || txt.includes('earthline');
  return !allowed;
});
if(suspiciousAfterClose.length) throw new Error('Suspicious black overlay(s) after panel close: '+JSON.stringify(suspiciousAfterClose));

writeFileSync('artifacts/mobile-acceptance-17005/summary.json',JSON.stringify({pass:true,errors,initial,opened,closed},null,2));
await page.screenshot({path:'artifacts/mobile-acceptance-17005/after-close.png',fullPage:true});
console.log('EARTHLINE_MOBILE_17005 PASS '+JSON.stringify({railHidden,panelOpen,blackCandidatesAfterClose:closed.blackCandidates.length,pageErrors:errors.length}));
await browser.close();
