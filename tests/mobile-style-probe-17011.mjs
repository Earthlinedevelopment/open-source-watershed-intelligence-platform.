import { chromium } from 'playwright';
const b=await chromium.launch({headless:true});
const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await p.goto('https://earthlinedevelopment.org/?styleprobe17011='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await p.waitForSelector('#earthlinePanel16188',{state:'attached',timeout:20000});
await p.waitForTimeout(700);
if(await p.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){await p.evaluate(()=>document.getElementById('earthlinePanelClose16188')?.click());await p.waitForTimeout(300);}
const out=await p.evaluate(()=>['earthlineSwaleLegend16050','earthlineAquiferLegend16070','earthlineDiagramLegend16080'].map(id=>{const e=document.getElementById(id);const s=e?getComputedStyle(e):null;return {id,attr:e?.getAttribute('style')||'',cssText:e?.style?.cssText||'',display:s?.display,visibility:s?.visibility,owner:e?.parentElement?.id||e?.parentElement?.className||''}}));
console.log('EARTHLINE_STYLE_PROBE_17011 '+JSON.stringify(out));
await b.close();