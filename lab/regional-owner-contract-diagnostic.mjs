import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGETS=['Portugal','Peru','Thailand','Tuvalu','Marshall Islands','New Zealand','Canada'];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
let frame=page;
const host=await page.$('#earthline-lab-frame');
if(host){const nested=await host.contentFrame();if(nested)frame=nested;}
await frame.waitForSelector('#searchInput',{timeout:30000});
await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
await fs.writeFile('/tmp/earthline-current-public.html',await frame.content());

const ownerSource=await frame.evaluate(()=>({
  getRegionalBBox: typeof getRegionalBBox==='function'?getRegionalBBox.toString():null,
  earthlineSetMapView: typeof earthlineSetMapView==='function'?earthlineSetMapView.toString():null,
  earthlineFinishMapMotion: typeof earthlineFinishMapMotion==='function'?earthlineFinishMapMotion.toString():null,
  earthlineRunAnalysis: typeof earthlineRunAnalysis==='function'?earthlineRunAnalysis.toString():null,
  chooseTileZoom: typeof chooseTileZoom==='function'?chooseTileZoom.toString():null
}));
await fs.writeFile('/tmp/earthline-owner-functions.json',JSON.stringify(ownerSource,null,2));

async function openTarget(name){
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  frame=page;
  const h=await page.$('#earthline-lab-frame');
  if(h){const n=await h.contentFrame();if(n)frame=n;}
  await frame.waitForSelector('#searchInput',{timeout:30000});
  await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
  await frame.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},name);
  await frame.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const picked=await frame.evaluate(name=>{
    const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const b=opts.find(x=>/country/i.test(x.textContent||'')&&(norm(x.dataset.query||'')===norm(name)||norm(x.textContent||'').includes(norm(name))));
    if(!b)return null;
    const r={text:(b.textContent||'').trim(),query:b.dataset.query||'',dataset:{...b.dataset}};b.click();return r;
  },name);
  if(!picked)throw new Error('country selection missing '+name);
  await frame.waitForTimeout(1000);
  return {frame,picked};
}

const rows=[];
for(const name of TARGETS){
  try{
    const {frame,picked}=await openTarget(name);
    const state=await frame.evaluate(()=>{
      const loc=(typeof M!=='undefined'&&M&&M.loc)?JSON.parse(JSON.stringify(M.loc)):null;
      let regionalBBox=null;
      try{if(typeof getRegionalBBox==='function')regionalBBox=getRegionalBBox();}catch(e){regionalBBox={error:String(e)}}
      const map=typeof earthlineMap!=='undefined'?earthlineMap:null;
      const c=map?.getCenter?.();
      return {
        loc,
        regionalBBox,
        mapCenter:c?{lng:c.lng,lat:c.lat}:null,
        mapZoom:map?.getZoom?.()??null,
        styleLoaded:map?.isStyleLoaded?.()??null,
        canvas:map?.getCanvas?.()?.getBoundingClientRect?.()?(()=>{const r=map.getCanvas().getBoundingClientRect();return {w:r.width,h:r.height}})():null,
        runDisabled:document.getElementById('runBtn')?.disabled??null,
        runText:document.getElementById('runBtn')?.textContent?.trim()||null,
        status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1200)
      };
    });
    rows.push({name,picked,state});
  }catch(e){rows.push({name,error:String(e)});}
}
await fs.writeFile('/tmp/earthline-regional-owner-contract.json',JSON.stringify({at:new Date().toISOString(),url:URL,rows},null,2));
console.log(JSON.stringify(rows,null,2));
await browser.close();
