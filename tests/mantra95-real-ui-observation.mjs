import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('artifacts/m95-real-ui',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:950}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const snap=async(name)=>{
 const z=await page.evaluate(name=>{
 const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
 const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
 const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
 const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
 const l='earthline-elder-tree-points-17097';
 const src=map?.getSource?.('earthline-elder-trees-17097');
 let rendered=null;try{rendered=map?.queryRenderedFeatures?.({layers:[l]})?.length??null}catch{}
 const buttons=[...document.querySelectorAll('button')].map(b=>({id:b.id,text:(b.innerText||'').replace(/\s+/g,' ').slice(0,90),visible:!!b.getClientRects().length,disabled:b.disabled})).filter(b=>/property|crosshair|analysis|investigat/i.test(b.id+' '+b.text)).slice(0,25);
 return {name,href:location.href,tier:document.documentElement.dataset.earthlineAnalysisTier,buttons,regional:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated??null,target:window.EARTHLINE_PROPERTY_TARGET_16201||null,property:a?{stage:a.stage,result:a.result,settled:a.settled,corridors:a.corridors,renderVerified:a.renderVerified,error:a.error}:null,publication:p?{published:p.published,safeCount:p.safeCount}:null,elder:e?{state:e.state,count:e.featureCount,error:e.dynamicError,mapPublished:e.mapPublished}:null,elderMap:{sourceCount:src?._data?.features?.length??null,layerExists:!!map?.getLayer?.(l),rendered},status:document.getElementById('earthlineVermontStatus16147')?.textContent?.trim()?.slice(0,1000),warnings:[...document.querySelectorAll('body *')].filter(x=>x.children.length===0&&/Property publication must remain blocked|Exclusion evidence did not complete/i.test(x.textContent||'')).slice(0,3).map(x=>x.textContent.trim().slice(0,250))};
 },name);
 await page.screenshot({path:'artifacts/m95-real-ui/'+name+'.png'});
 writeFileSync('artifacts/m95-real-ui/'+name+'.json',JSON.stringify({...z,errors},null,2));
 console.log('M95_UI '+JSON.stringify({...z,errors}));return z;
};
try{
 await page.goto('https://earthlinedevelopment.org/?m95_real_ui='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#searchInput').fill('Arizona');
 await page.locator('#runBtn').click();
 try{await page.waitForFunction(()=>window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:50000,polling:200})}catch(e){errors.push('Regional wait '+e)}
 await snap('regional-real-click');
 const b=page.locator('#earthlineDeclareProperty16169');
 if(await b.count()&&await b.isVisible()&&await b.isEnabled()){
  await b.click({timeout:7000});
  try{await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:50000,polling:200})}catch(e){errors.push('Property wait '+e)}
  await page.waitForTimeout(1700);
  await snap('property-real-click');
 }else{errors.push('Property declaration button not visible/enabled');await snap('property-control-missing')}
}catch(e){errors.push('Fatal '+String(e));try{await snap('fatal')}catch{}}
console.log('M95_UI_SUMMARY '+JSON.stringify({errors}));
await browser.close();
if(errors.length)process.exitCode=1;