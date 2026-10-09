import { chromium } from 'playwright';
import fs from 'node:fs';

const base='http://127.0.0.1:8787/index.html';
const profiles=[
  {name:'desktop',width:1800,height:830},
  {name:'tablet',width:1024,height:768},
  {name:'mobile',width:390,height:844}
];
const results=[];
fs.mkdirSync('artifacts/stability-audit-17074',{recursive:true});

function visibleRect(el){
  if(!el)return null;
  const s=getComputedStyle(el),r=el.getBoundingClientRect();
  const visible=s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.02&&r.width>2&&r.height>2;
  return {visible,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,display:s.display,visibility:s.visibility,opacity:s.opacity};
}

for(const p of profiles){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:p.width,height:p.height}});
  const page=await context.newPage();
  const errors=[], consoleErrors=[], requestFailures=[];
  page.on('pageerror',e=>errors.push(String(e?.stack||e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  page.on('requestfailed',r=>{
    const u=r.url();
    if(!/supabase\.co\/functions\/v1\/earthline-telemetry/i.test(u))
      requestFailures.push({url:u,error:r.failure()?.errorText||''});
  });

  const started=Date.now();
  let navResponse=null, gotoError=null;
  try{
    navResponse=await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  }catch(e){gotoError=String(e)}
  const domMs=Date.now()-started;

  const overlaySamples=[];
  for(let i=0;i<30;i++){
    try{
      const sample=await page.evaluate(()=>{
        const vw=innerWidth,vh=innerHeight;
        const allow=(el)=>!!el.closest?.('#mapboxBase,.mapboxgl-map,#earthlinePanel16188,#earthlineRail16188,.left,.center,.topbar');
        const bad=[];
        for(const el of document.querySelectorAll('body *')){
          const s=getComputedStyle(el);
          if(!['fixed','absolute'].includes(s.position))continue;
          const r=el.getBoundingClientRect();
          if(r.width*r.height<vw*vh*.35)continue;
          if(r.right<=0||r.bottom<=0||r.left>=vw||r.top>=vh)continue;
          if(allow(el))continue;
          const bg=s.backgroundColor||'';
          const z=Number.parseInt(s.zIndex)||0;
          const radius=s.borderRadius||'';
          if(z>500||/rgb\(0, 0, 0\)|rgba\(0, 0, 0/.test(bg)){
            bad.push({id:el.id||'',cls:String(el.className||'').slice(0,120),tag:el.tagName,z,bg,radius,rect:{x:r.x,y:r.y,w:r.width,h:r.height}});
          }
        }
        return bad.slice(0,12);
      });
      if(sample.length)overlaySamples.push({t:i*100,items:sample});
    }catch{}
    await page.waitForTimeout(100);
  }

  let state={};
  try{
    state=await page.evaluate(()=>{
      const vr=(id)=>{
        const el=document.getElementById(id); if(!el)return null;
        const s=getComputedStyle(el),r=el.getBoundingClientRect();
        return {visible:s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.02&&r.width>2&&r.height>2,
          x:r.x,y:r.y,w:r.width,h:r.height,display:s.display,visibility:s.visibility,opacity:s.opacity,text:(el.textContent||'').trim().slice(0,100)};
      };
      const rail=document.getElementById('earthlineRail16188');
      const langText=rail?Array.from(rail.querySelectorAll('*')).filter(el=>{
        const s=getComputedStyle(el),r=el.getBoundingClientRect();
        return s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1&&/LANGUAGE/i.test(el.textContent||'');
      }).map(el=>({id:el.id,text:(el.textContent||'').trim()})):[];
      return {
        readyState:document.readyState,
        bodyChildren:document.body?.children?.length||0,
        totalNodes:document.querySelectorAll('*').length,
        map:vr('mapboxBase'),
        canvas:document.querySelectorAll('.mapboxgl-canvas').length,
        rail:vr('earthlineRail16188'),
        search:vr('earthlineRailSearch16188'),
        panel:vr('earthlinePanel16188'),
        langSelect:vr('earthlineLanguage16488'),
        langWrap:vr('earthlineLanguageWrap16488'),
        visibleLanguageText:langText,
        runtimeBuild:window.EARTHLINE_UI_EMERGENCY_17069?.state||null,
        href:location.href
      };
    });
  }catch(e){errors.push('state:'+String(e))}

  let toggle={};
  try{
    const before=await page.evaluate(()=>document.getElementById('earthlinePanel16188')?.getBoundingClientRect().width||0);
    await page.locator('#earthlineRailSearch16188').click({timeout:5000});
    await page.waitForTimeout(350);
    const after1=await page.evaluate(()=>document.getElementById('earthlinePanel16188')?.getBoundingClientRect().width||0);
    await page.locator('#earthlineRailSearch16188').click({timeout:5000});
    await page.waitForTimeout(350);
    const after2=await page.evaluate(()=>document.getElementById('earthlinePanel16188')?.getBoundingClientRect().width||0);
    toggle={before,after1,after2,changed1:Math.abs(after1-before)>20,changed2:Math.abs(after2-after1)>20};
  }catch(e){toggle={error:String(e)}}

  let heartbeat={};
  try{
    heartbeat=await page.evaluate(async()=>{
      const t0=performance.now();
      let ticks=0;
      const h=setInterval(()=>ticks++,20);
      await new Promise(r=>setTimeout(r,1000));
      clearInterval(h);
      return {ticks,elapsed:performance.now()-t0};
    });
  }catch(e){heartbeat={error:String(e)}}

  await page.screenshot({path:`artifacts/stability-audit-17074/${p.name}.png`,fullPage:false});
  results.push({profile:p,httpStatus:navResponse?.status?.()||null,gotoError,domMs,state,toggle,heartbeat,
    pageErrors:errors,consoleErrors:consoleErrors.slice(0,20),requestFailures:requestFailures.slice(0,20),overlaySamples});
  await browser.close();
}
fs.writeFileSync('artifacts/stability-audit-17074/results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.gotoError||r.pageErrors.length||r.heartbeat.ticks<25||!r.state.search?.visible||r.state.visibleLanguageText?.length)) process.exitCode=1;
