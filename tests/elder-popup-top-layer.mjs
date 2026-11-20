import {chromium,webkit} from 'playwright';
import {readFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const src=readFileSync('earthline-elder-restored-17097.js','utf8');
const start=src.indexOf('function liftElderPopupAboveMap17097(popup, mapInstance){');
const end=src.indexOf('function showElderTreePopup(e,persistent){',start);
assert(start>0&&end>start,'must exercise real Elder popup helper');
const helper=src.slice(start,end);
assert(src.includes('liftElderPopupAboveMap17097(popup,m);'),'real popup handlers call helper');
mkdirSync('elder-popup-test',{recursive:true});
const html=[
 '<style>body{margin:0;font:12px sans-serif}',
 '#map{position:absolute;left:35px;top:30px;width:600px;height:350px;z-index:1;background:#325d43}',
 '#waterOverlay{position:fixed;left:35px;top:30px;width:600px;height:350px;z-index:2147483600;pointer-events:auto;background:rgba(0,150,255,.12)}',
 '#popup{position:absolute;top:100px;left:180px;width:118px;height:80px;background:#fff;border:2px solid #b88a35;box-sizing:border-box;z-index:2147483000;pointer-events:auto}',
 '#popupClose{position:absolute;right:3px;top:3px}</style>',
 '<div id="map"><div id="popup" class="mapboxgl-popup earthline-elder-triggered-popup">',
 '<button id="popupClose">×</button><strong>ELDER TREE CANDIDATE</strong>',
 '<div>Confidence 73%</div><div>Modeled tree; age not verified.</div></div></div>',
 '<div id="waterOverlay"></div>'
].join('');
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch();
 const page=await browser.newPage({viewport:{width:850,height:550}});
 await page.setContent(html);
 await page.addScriptTag({content:helper+';window.liftElderPopupAboveMap17097=liftElderPopupAboveMap17097;'});
 const data=await page.evaluate(()=>{
  const popupEl=document.getElementById('popup'),initialTitle=popupEl.textContent;
  const map=document.getElementById('map'),listeners={};
  let point={x:240,y:105};
  const mapObj={
   getContainer:()=>map,project:()=>point,
   on:(name,fn)=>(listeners[name]??=[]).push(fn),
   off:(name,fn)=>{listeners[name]=(listeners[name]||[]).filter(x=>x!==fn)}
  };
  const popup={getElement:()=>popupEl,getLngLat:()=>({lng:-91.62368,lat:34.71309}),
   on:(name,fn)=>(listeners['popup-'+name]??=[]).push(fn)};
  const before=document.elementFromPoint(35+240+50,30+105+25)?.id;
  const lifted=window.liftElderPopupAboveMap17097(popup,mapObj);
  const after=document.elementFromPoint(35+240+50,30+105+25);
  const portal=document.getElementById('earthlineElderPopupTopLayer17097');
  const initialRect=popupEl.getBoundingClientRect();
  point={x:270,y:150};
  (listeners.move||[]).forEach(fn=>fn());
  const movedRect=popupEl.getBoundingClientRect();
  let closeWorks=false;
  popupEl.querySelector('button').addEventListener('click',()=>{closeWorks=true});
  popupEl.querySelector('button').click();
  popupEl.remove();
  (listeners['popup-close']||[]).forEach(fn=>fn());
  return {before,lifted,portal:!!portal,topmost:after===popupEl||popupEl.contains(after),
   portaledToBody:portal?.parentElement===document.body,
   approvedContentUnchanged:popupEl.textContent===initialTitle,
   width:Math.round(initialRect.width),height:Math.round(initialRect.height),
   deltaX:Math.round(movedRect.left-initialRect.left),deltaY:Math.round(movedRect.top-initialRect.top),
   fixedOvermap:window.getComputedStyle(portal).position==='fixed',closeWorks,
   cleaned:!document.getElementById('earthlineElderPopupTopLayer17097'),
   listenerCleaned:(listeners.move||[]).length===0};
 });
 console.log('ELDER_POPUP_STACKING_TEST '+JSON.stringify({name,...data}));
 assert.equal(data.before,'waterOverlay','must prove overlay originally obscured popup');
 for(const k of ['lifted','portal','topmost','portaledToBody','approvedContentUnchanged','fixedOvermap','closeWorks','cleaned','listenerCleaned'])
  assert.equal(data[k],true,name+' '+k);
 assert.equal(data.width,118);
 assert.equal(data.deltaX,30);
 assert.equal(data.deltaY,45);
 await page.screenshot({path:'elder-popup-test/'+name+'.png'});
 await browser.close();
}
console.log('ELDER_POPUP_STACKING_PASS chromium+webkit');
