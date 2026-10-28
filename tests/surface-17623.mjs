import { chromium } from 'playwright';import fs from 'node:fs';import {resolve,extname} from 'node:path';
const root=process.cwd(),origin='https://earthlinedevelopment.org',mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8'};
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1600,height:900},serviceWorkers:'block'});
await context.route(origin+'/**',async route=>{const u=new URL(route.request().url()),p=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html',f=resolve(root,p);if(f.startsWith(root)&&fs.existsSync(f))return route.fulfill({status:200,path:f,contentType:mime[extname(f)]||'application/octet-stream',headers:{'cache-control':'no-store'}});return route.continue()});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(origin+'/?surface17623='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});await page.waitForSelector('#searchInput',{timeout:30000});await page.waitForTimeout(800);
const out=await page.evaluate(()=>{
 const text=String(document.body.innerText||'').replace(/\s+/g,' ').trim();
 const logo=document.querySelector('#earthlinePanelBrand16201 img,.brand img,img[alt="Earthline"]'),run=document.getElementById('runBtn'),orb=run?.querySelector('i.earthline-orb-shell-16244'),lang=document.getElementById('earthlineLanguage16488'),data=document.getElementById('earthlineRailData16488');
 const vis=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>0&&r.height>0};
 return {
   tagline:/Slow it\.\s*Sink it\.\s*Spread it\./i.test(text),
   logo:vis(logo)&&String(logo.getAttribute('alt')||'').toLowerCase()==='earthline',
   orb:!!run&&!!orb&&vis(run),
   language:vis(lang)&&[...lang.options].map(o=>o.value).join(',')==='en,th,vi,lo',
   data:vis(data),
   removed:{explore:/Explore Water/i.test(text),waterStory:/Water story/i.test(text),visualScientific:/Visual Scientific/i.test(text)},
   sliders:[...document.querySelectorAll('input[type="range"]')].filter(vis).length,
   bodyFont:getComputedStyle(document.body).fontFamily
 };
});
const pass=out.tagline&&out.logo&&out.orb&&out.language&&out.data&&!out.removed.explore&&!out.removed.waterStory&&!out.removed.visualScientific&&out.sliders===0&&!errors.length;
console.log('EARTHLINE_SURFACE_17623 '+JSON.stringify({pass,out,errors}));await browser.close();if(!pass)process.exitCode=1;
