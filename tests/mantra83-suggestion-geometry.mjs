import {chromium,devices} from 'playwright';
const browser=await chromium.launch({headless:true});
for(const [name,opts] of [['desktop',{viewport:{width:1440,height:900}}],['iPhone',{...devices['iPhone 13']}],['Pixel',{...devices['Pixel 7']}]]){
  const ctx=await browser.newContext(opts);const p=await ctx.newPage();
  await p.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForTimeout(1500);
  await p.locator('#searchInput').fill('Vermont');
  await p.waitForTimeout(300);
  const d=await p.evaluate(()=>{
    const e=document.getElementById('earthlineSearchSuggestions15970'),i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    const rect=x=>x?Object.fromEntries(['left','top','right','bottom','width','height'].map(k=>[k,Math.round(x.getBoundingClientRect()[k])])):null;
    const cs=e?getComputedStyle(e):null;
    return {suggest:rect(e),input:rect(i),run:rect(b),parent:e?.parentElement?{id:e.parentElement.id,cls:e.parentElement.className}:null,position:cs?.position,top:cs?.top,bottom:cs?.bottom,open:e?.className};
  });
  console.log('M83_SUGGEST_GEOM '+JSON.stringify({name,...d}));
  await ctx.close();
}
await browser.close();