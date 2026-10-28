import { chromium } from 'playwright';
import fs from 'node:fs';
import { resolve,extname } from 'node:path';
const root=process.cwd(),origin='https://earthlinedevelopment.org';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.py':'text/plain; charset=utf-8'};
const cases=['Chiang Mai, Thailand','Can Tho, Vietnam','Vientiane, Laos'];
const browser=await chromium.launch({headless:true});const rows=[];
for(const query of cases){
 const context=await browser.newContext({viewport:{width:1600,height:900},serviceWorkers:'block'});
 await context.route(origin+'/**',async route=>{const u=new URL(route.request().url()),p=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html',file=resolve(root,p);try{if(file.startsWith(root)&&fs.existsSync(file)&&fs.statSync(file).isFile())return route.fulfill({status:200,path:file,contentType:mime[extname(file).toLowerCase()]||'application/octet-stream',headers:{'cache-control':'no-store'}})}catch(_){}return route.continue()});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(origin+'/?sea17621='+encodeURIComponent(query)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.locator('#searchInput').fill(query);await page.waitForTimeout(900);
 const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();if(await opt.count())await opt.click().catch(()=>{});
 const run=page.locator('#runBtn');if(await run.isVisible()&&!await run.evaluate(b=>b.dataset.busy==='1'||b.disabled))await run.click();
 await page.waitForFunction(()=>{const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!p&&/screening published/i.test(s)},null,{timeout:120000,polling:150});
 await page.waitForTimeout(700);
 const snap=await page.evaluate(query=>{const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{},p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},f=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{},b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||{},root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||{},aq=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16700||window.EARTHLINE_AQUIFER_AUDIT_16472||null;return {query,tier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),generated:Number(p.generated||0),visible:Number(d.swaleLines||0),water:Number(d.waterPaths||0),arrows:Number(d.directionArrows||0),contours:Number(d.contourLines||0),labels:Number(d.elevationLabels||0),unsafe:Number(f.unsafeSegments||0),outside:Number(b.outsideAfterClip?.swales||0),rootPass:root.pass??null,aquifer:aq,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')}} ,query);
 const pass=snap.tier==='regional'&&snap.generated>0&&snap.visible===snap.generated&&snap.water>0&&snap.arrows>0&&snap.contours>0&&snap.unsafe===0&&snap.outside===0&&snap.rootPass!==false&&!errors.length;
 rows.push({query,pass,snap,errors});console.log('EARTHLINE_SEA_17621 '+JSON.stringify(rows.at(-1)));
 await context.close();
}
await browser.close();
const summary={pass:rows.every(r=>r.pass),rows};console.log('EARTHLINE_SEA_17621_SUMMARY '+JSON.stringify(summary));if(!summary.pass)process.exitCode=1;
