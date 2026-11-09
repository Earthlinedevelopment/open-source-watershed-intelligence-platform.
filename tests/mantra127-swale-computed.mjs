import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
await mkdir('artifacts/m127-swale',{recursive:true});
const page=await browser.newPage({viewport:{width:1800,height:1000},serviceWorkers:'block'});
const result={target:'https://earthlinedevelopment.org/',checks:{},errors:[]};
page.on('pageerror',e=>result.errors.push(String(e)));
try{
 await page.goto('https://earthlinedevelopment.org/?m127swale='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.locator('#searchInput').fill('Iowa state');
 await page.locator('#searchInput').press('Enter');
 await page.waitForFunction(()=>/screening published|regional analysis complete|analysis failed/i.test(document.getElementById('earthlineVermontStatus16147')?.textContent||''),null,{timeout:120000});
 await page.evaluate(()=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;m.jumpTo({zoom:11})});
 await page.waitForTimeout(1900);
 result.computed=await page.evaluate(()=>{
  const svg=document.getElementById('earthlineRegionalVectorOverlay16020'),g=svg?.querySelector('[data-layer="swale-opportunities"]');
  const paths=[...(g?.querySelectorAll('path')||[])],target=paths.find(x=>x.classList.contains('earthline-swale-core-16168'))||paths[0];
  const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
  const styles=el=>{if(!el)return null;const s=getComputedStyle(el);return {display:s.display,visibility:s.visibility,opacity:s.opacity,stroke:s.stroke,strokeWidth:s.strokeWidth,fill:s.fill,pointerEvents:s.pointerEvents}};
  const parents=[];for(let el=target;el&&parents.length<8;el=el.parentElement)parents.push({tag:el.tagName,id:el.id,cls:String(el.getAttribute('class')||'').slice(0,140),displayAttribute:el.getAttribute('display'),styles:styles(el),rect:rect(el)});
  return {mapZoom:(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap)?.getZoom(),svg:svg?{styles:styles(svg),rect:rect(svg)}:null,group:g?{displayAttribute:g.getAttribute('display'),styles:styles(g),rect:rect(g)}:null,pathCount:paths.length,firstPath:target?{dLength:target.getAttribute('d')?.length||0,styles:styles(target),rect:rect(target)}:null,parents,runStatus:document.getElementById('earthlineVermontStatus16147')?.textContent};
 });
 await page.screenshot({path:'artifacts/m127-swale/iowa-z11.png',timeout:20000});
}catch(e){result.failure=String(e)}
await writeFile('artifacts/m127-swale/results.json',JSON.stringify(result,null,2));
console.log('M127_SWALE_COMPUTED '+JSON.stringify(result));
await browser.close();
if(result.failure)process.exitCode=1;
