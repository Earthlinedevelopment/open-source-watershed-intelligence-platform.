import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

async function snap(page){
  return page.evaluate(()=>{
    const m=(typeof M!=='undefined'&&M)||null;
    const r=window.earthlineRegional15778||{};
    const ov=document.getElementById('earthlineRegionalVectorOverlay16020');
    const paths=ov?ov.querySelectorAll('path,polyline,line').length:0;
    const audit=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    return {
      locName:String(m?.loc?.name||''),
      regionalActive:!!r.active,
      regionalMode:String(r.mode||''),
      runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')||'',
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().replace(/\s+/g,' ').slice(0,1200),
      overlayPresent:!!ov,
      overlayDisplay:ov?getComputedStyle(ov).display:null,
      overlayVisibility:ov?getComputedStyle(ov).visibility:null,
      overlayPaths:paths,
      audit,
      zoom:Number(mp?.getZoom?.()||0),
      center:mp?.getCenter?.()?{lng:Number(mp.getCenter().lng),lat:Number(mp.getCenter().lat)}:null,
      camera16602:window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602||null
    };
  });
}

async function queryNY(page){
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='New York';
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    b.click();
  });
  const shots=[];
  for(const ms of [3000,3000,4000,5000]){await page.waitForTimeout(ms);shots.push({t:shots.reduce((a,x)=>a+x.wait,0)+ms,wait:ms,s:await snap(page)});}
  return {after:await snap(page),shots};
}

async function load(){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  return {page,errors};
}

const control=await load();
const controlResult=await queryNY(control.page);
await control.page.close();

const treatment=await load();
await treatment.page.evaluate(()=>{
  const prior=window.earthlineRegionalCameraReady16336;
  if(typeof prior!=='function')throw new Error('camera-ready gate unavailable');
  function validBBox(b){return Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[2]>b[0]&&b[3]>b[1];}
  function scaleAudit(b,m){
    try{
      if(!validBBox(b)||!m||typeof m.project!=='function')return null;
      const c=m.getContainer&&m.getContainer(),cw=Number(c&&c.clientWidth)||0,ch=Number(c&&c.clientHeight)||0;
      if(!(cw>0&&ch>0))return null;
      const sw=m.project([b[0],b[1]]),ne=m.project([b[2],b[3]]);
      const pxW=Math.abs(Number(ne.x)-Number(sw.x)),pxH=Math.abs(Number(sw.y)-Number(ne.y));
      return {pxW,pxH,containerW:cw,containerH:ch,widthFraction:pxW/cw,heightFraction:pxH/ch,zoom:Number(m.getZoom&&m.getZoom())};
    }catch(_){return null;}
  }
  function presentationScale(a){return !!(a&&Number.isFinite(a.widthFraction)&&Number.isFinite(a.heightFraction)&&a.widthFraction>=0.18&&a.heightFraction>=0.22);}
  const pause=ms=>new Promise(r=>setTimeout(r,ms));
  async function cameraReady16602(b,m,timeoutMs){
    const before=scaleAudit(b,m);let forcedFit=false,fitError=null;
    if(validBBox(b)&&m&&!presentationScale(before)){
      try{
        if(m.stop)m.stop();
        if(m.setProjection)m.setProjection('mercator');
        if(typeof m.fitBounds==='function'){
          m.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:{top:70,bottom:145,left:80,right:80},maxZoom:9,duration:0,linear:true});
          forcedFit=true;await pause(90);
        }
      }catch(e){fitError=String(e&&e.message||e);}
    }
    let delegated=false;try{delegated=!!(await prior.call(this,b,m,timeoutMs));}catch(_){delegated=false;}
    const after=scaleAudit(b,m),scaleReady=presentationScale(after),ready=delegated&&scaleReady;
    window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602={installed:true,forcedFit,fitError,before,after,delegated,scaleReady,ready};
    return ready;
  }
  window.earthlineRegionalCameraReady16336=cameraReady16602;
  window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602={installed:true,armed:true};
});
const treatmentResult=await queryNY(treatment.page);
await treatment.page.close();

console.log('MANTRA38_CAMERA_AB '+JSON.stringify({control:{...controlResult,errors:control.errors.slice(0,20)},treatment:{...treatmentResult,errors:treatment.errors.slice(0,20)}}));
await browser.close();
