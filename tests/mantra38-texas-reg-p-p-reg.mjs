import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const errors=[];

async function oneAttempt(attempt){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  page.on('pageerror',e=>errors.push({attempt,type:'pageerror',message:String(e)}));
  page.on('console',m=>{if(m.type()==='error')errors.push({attempt,type:'console',message:m.text()});});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});

  await page.evaluate(()=>{
    window.__TX_TRACE=[];
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const cam=()=>{const c=mp?.getCenter?.();return {z:Number(mp?.getZoom?.()||0),c:c?{lng:Number(c.lng),lat:Number(c.lat)}:null};};
    const rec=(type,data={})=>window.__TX_TRACE.push({type,t:performance.now(),cam:cam(),...data});
    rec('installed');

    const wrap=(name,before,after)=>{
      const f=window[name]; if(typeof f!=='function'||f.__txWrapped)return false;
      const w=async function(...args){before?.(args);let out,err;try{out=await f.apply(this,args);return out;}catch(e){err=e;throw e;}finally{after?.(args,out,err);}};
      w.__txWrapped=true;w.__base=f;window[name]=w;return true;
    };
    wrap('settleRegionalCamera',args=>rec('settle-start',{arg1:String(args[1]??'').slice(0,500)}),(args,out,err)=>rec('settle-end',{out:String(out),err:err?String(err):null}));
    wrap('earthlineRenderRegionalOverlay16020',args=>{
      const fs=args?.[0]?.swales?.features||[];const lengths=[];
      for(const f of fs){const cc=f?.geometry?.coordinates||[];let L=0,last=null;for(const ll of cc){try{const p=mp.project({lng:Number(ll[0]),lat:Number(ll[1])});if(last)L+=Math.hypot(p.x-last.x,p.y-last.y);last=p;}catch(_){}}lengths.push(Number(L.toFixed(2)));}
      rec('renderer-start',{swales:fs.length,min:lengths.length?Math.min(...lengths):null,max:lengths.length?Math.max(...lengths):null,ge22:lengths.filter(x=>x>=22).length});
    },(args,out,err)=>rec('renderer-end',{err:err?String(err):null,audit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null}));

    for(const method of ['fitBounds','easeTo','flyTo','jumpTo']){
      try{const base=mp?.[method];if(typeof base!=='function'||base.__txWrapped)continue;mp[method]=function(...args){rec('camera-'+method,{args:JSON.stringify(args).slice(0,700)});return base.apply(this,args)};mp[method].__txWrapped=true;}catch(_){ }
    }
  });

  const started=Date.now();
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  try{await page.waitForFunction(()=>{const r=window.earthlineRegional15778||{};const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;const a=window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329;return (!!e||(!r.active&&a?.passed===true))&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';},null,{timeout:36000,polling:200});}catch(_){ }
  await page.waitForTimeout(1000);

  const result=await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),m=(typeof M!=='undefined'&&M)||null,r=window.earthlineRegional15778||{};
    const c=mp?.getCenter?.();const style=mp?.getStyle?.()||{};
    const interesting=(style.layers||[]).filter(l=>/aquifer|ground|basin|swale|corridor|label/i.test(String(l.id||''))).map(l=>({id:l.id,type:l.type,source:l.source,sourceLayer:l['source-layer']||null,visibility:l.layout?.visibility||'visible',textField:l.layout?.['text-field']||null}));
    const rendered=[];
    for(const l of interesting){
      let feats=[];try{feats=mp.queryRenderedFeatures(undefined,{layers:[l.id]})||[];}catch(_){ }
      if(feats.length)rendered.push({layer:l.id,source:l.source,count:feats.length,examples:feats.slice(0,20).map(f=>({props:f.properties||{},type:f.geometry?.type,coord:f.geometry?.type==='Point'?f.geometry.coordinates:null}))});
    }
    const dom=[];
    for(const el of document.querySelectorAll('body *')){
      const txt=String(el.textContent||'').trim().replace(/\s+/g,' ');
      if(!/MAPPED AQUIFER|San Luis|Two Buttes/i.test(txt))continue;
      const kids=el.children?.length||0;if(kids>4)continue;
      const b=el.getBoundingClientRect();if(b.width<1||b.height<1)continue;
      dom.push({tag:el.tagName,id:el.id||'',class:String(el.className?.baseVal||el.className||''),text:txt.slice(0,240),html:String(el.outerHTML||'').slice(0,700),box:{x:b.x,y:b.y,w:b.width,h:b.height}});
      if(dom.length>=30)break;
    }
    const globals={};for(const k of Object.keys(window)){if(!/aquifer|boundary|state.*165|16565|contain/i.test(k))continue;let v;try{v=window[k];}catch(_){continue;}if(typeof v==='function')globals[k]=String(v).slice(0,1200);else if(v&&typeof v==='object'){try{globals[k]=JSON.stringify(v).slice(0,3000);}catch(_){globals[k]=String(v);}}else globals[k]=String(v).slice(0,500);if(Object.keys(globals).length>=50)break;}
    return {
      loc:{name:String(m?.loc?.name||''),fullName:String(m?.loc?.fullName||'')},
      center:c?{lng:Number(c.lng),lat:Number(c.lat)}:null,zoom:Number(mp?.getZoom?.()||0),regionalActive:!!r.active,
      preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,cameraAudit:window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null,
      runError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,displayAudit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
      corridorAudit:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,generationAudit:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
      containment:window.EARTHLINE_OPTIONAL_CONTEXT_CONTAINMENT_16565||window.EARTHLINE_OPTIONAL_CONTEXT_AUDIT_16565||null,
      trace:window.__TX_TRACE||[],interesting,rendered,dom,globals
    };
  });
  result.attempt=attempt;result.elapsedMs=Date.now()-started;
  await page.close();return result;
}

const attempts=[];for(let i=1;i<=4;i++)attempts.push(await oneAttempt(i));
console.log('MANTRA38_TEXAS_OWNER_TRACE '+JSON.stringify({attempts,errors:errors.slice(0,50)}));
await browser.close();
