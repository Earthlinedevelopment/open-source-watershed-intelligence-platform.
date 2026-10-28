import { chromium } from 'playwright';
import fs from 'node:fs';
import {resolve,extname} from 'node:path';
const root=process.cwd(),origin='https://earthlinedevelopment.org',mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8'};
const browser=await chromium.launch({headless:true});
const cases=[{name:'desktop',opts:{viewport:{width:1440,height:900}}},{name:'mobile',opts:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}}];
const rows=[];
for(const tc of cases){
 const context=await browser.newContext({...tc.opts,serviceWorkers:'block'});
 await context.route(origin+'/**',async route=>{const u=new globalThis.URL(route.request().url()),decoded=decodeURIComponent(u.pathname),p=(decoded.startsWith('/')?decoded.slice(1):decoded)||'index.html',f=resolve(root,p);if(f.startsWith(root)&&fs.existsSync(f))return route.fulfill({status:200,path:f,contentType:mime[extname(f)]||'application/octet-stream',headers:{'cache-control':'no-store'}});return route.continue()});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(origin+'/?tagline17624='+tc.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 if(tc.name==='mobile'&&!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
   await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(250);
 }
 await page.waitForSelector('#earthlineLockedTagline17624',{state:'visible',timeout:15000});
 const out=await page.evaluate(()=>{
   const el=document.getElementById('earthlineLockedTagline17624'),search=document.getElementById('searchInput'),logo=document.querySelector('#earthlinePanelBrand16201 .brand img');
   const er=el.getBoundingClientRect(),sr=search.getBoundingClientRect(),cs=getComputedStyle(el);
   return {text:String(el.textContent||'').replace(/\s+/g,' ').trim(),aria:el.getAttribute('aria-label'),display:cs.display,visibility:cs.visibility,opacity:cs.opacity,tagRect:{x:er.x,y:er.y,w:er.width,h:er.height,bottom:er.bottom},searchRect:{x:sr.x,y:sr.y,w:sr.width,h:sr.height,top:sr.top},above:er.bottom<=sr.top+2,logoSrc:logo?.getAttribute('src')||'',logoAlt:logo?.getAttribute('alt')||''};
 });
 const pass=out.text==='Slow it. Sink it. Spread it.'&&out.aria==='Slow it. Sink it. Spread it.'&&out.tagRect.w>0&&out.tagRect.h>0&&out.above&&out.logoAlt==='Earthline'&&!errors.length;
 rows.push({case:tc.name,pass,out,errors});
 await context.close();
}
await browser.close();
const pass=rows.every(x=>x.pass);console.log('EARTHLINE_TAGLINE_17624 '+JSON.stringify({pass,rows}));if(!pass)process.exitCode=1;
