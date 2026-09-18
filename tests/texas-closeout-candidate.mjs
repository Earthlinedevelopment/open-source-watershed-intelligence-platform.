import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const patches={};
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,repl)=>{patches[name]=body.split(needle).length-1;body=body.split(needle).join(repl);};
  apply('coarse7Sample',
    'if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;',
    'if(segment.length<10||lineLengthPixels(hy,segment)<((!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>10000)?7:10))return null;');
  apply('coarse7Screen',
    'if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}',
    'if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<((!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>10000)?7:10)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');
  apply('preCameraResize',
    '    const cameraSettle16310=Promise.resolve(settleRegionalCamera(m,b,runToken)).catch(()=>false);',
    '    try{m.resize&&m.resize();}catch(_){}\n    const cameraSettle16310=Promise.resolve(settleRegionalCamera(m,b,runToken)).catch(()=>false);');
  apply('removeLateResize',
    "const resizeRunToken16020=String(lastData&&lastData.runToken||'');if(resizeRunToken16020&&resizeRunToken16020!==lastResizeRunToken16020){lastResizeRunToken16020=resizeRunToken16020;try{map.resize&&map.resize();}catch(_){}}",
    "const resizeRunToken16020=String(lastData&&lastData.runToken||'');if(resizeRunToken16020&&resizeRunToken16020!==lastResizeRunToken16020){lastResizeRunToken16020=resizeRunToken16020;}");
  apply('regionalAquiferBBox',
    'try{M.layers.usgsAquifer.on=true;M.usgsAquiferLoading=false;setTimeout(()=>fetchUSGSAquifers(),80);}catch(e){}',
    'try{M.layers.usgsAquifer.on=true;M.usgsAquiferLoading=false;const rb=Array.isArray(parent&&parent.bbox)&&parent.bbox.length===4?{minLng:Number(parent.bbox[0]),minLat:Number(parent.bbox[1]),maxLng:Number(parent.bbox[2]),maxLat:Number(parent.bbox[3])}:null;setTimeout(()=>fetchUSGSAquifers(rb,{owner:"regional"}),80);}catch(e){}');
  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?texas_closeout='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=3;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
  const started=Date.now();
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'');const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(1800);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null;
    const mm=(typeof M!=='undefined'&&M)||{};const a=mm.usgsAquiferAudit||null;const box=mm.usgsAquiferBox||null;
    return {swales:sw.length,visible:d?.swaleLines??null,zones:{
      panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),
      panhandleWestNM:count((x,y)=>x>-103.2&&x<-102&&y>31.8&&y<36.6),
      upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),
      midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),
      lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),
      eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)
    },candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,phases:p?.phaseTotalsMs??null,outside:b?.outsideAfterClip??null,
    aquifer:{audit:a,box,status:mm.usgsAquiferStatus||null,count:Array.isArray(mm.usgsAquifers)?mm.usgsAquifers.length:null,layerOn:mm.layers?.usgsAquifer?.on??null},
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()};
  });
  const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_CLOSEOUT '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_CLOSEOUT_SUMMARY '+JSON.stringify({patches,rows,errors:errors.slice(0,20)}));
await browser.close();
