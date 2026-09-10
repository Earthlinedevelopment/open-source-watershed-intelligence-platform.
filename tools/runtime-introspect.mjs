import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForTimeout(2500);

const compactValue=v=>{
  try{
    if(v==null)return v;
    if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')return v;
    if(Array.isArray(v))return v.slice(0,8);
    if(typeof v==='object'){
      const o={}; for(const k of Object.keys(v).slice(0,30)){
        const x=v[k]; if(x==null||['string','number','boolean'].includes(typeof x))o[k]=x;
        else if(Array.isArray(x))o[k]=`[array:${x.length}]`;
        else if(typeof x==='function')o[k]='[function]';
        else o[k]='[object]';
      } return o;
    }
  }catch(_){return '[unreadable]';}
  return `[${typeof v}]`;
};

async function runtime(label){
  return await page.evaluate(({label})=>{
    const re=/(earthline|regional|camera|location|search|geocode|place|run|select|center)/i;
    const fnInfo=(owner,key)=>{
      try{
        const v=owner[key];
        if(typeof v!=='function')return null;
        const src=Function.prototype.toString.call(v).replace(/\s+/g,' ').slice(0,260);
        return {key,arity:v.length,tag:v.__earthline16602?'16602':null,src};
      }catch(_){return null;}
    };
    const winFns=Object.getOwnPropertyNames(window).filter(k=>re.test(k)&&typeof window[k]==='function').slice(0,250).map(k=>fnInfo(window,k)).filter(Boolean);
    const winVals={};
    for(const k of Object.getOwnPropertyNames(window).filter(k=>re.test(k)&&typeof window[k]!=='function').slice(0,160)){
      try{const v=window[k]; if(v==null||['string','number','boolean'].includes(typeof v))winVals[k]=v;}
      catch(_){}
    }
    const m=(typeof M!=='undefined'&&M)||window.M||null;
    const mFns=m?Object.keys(m).filter(k=>re.test(k)&&typeof m[k]==='function').slice(0,200).map(k=>fnInfo(m,k)).filter(Boolean):[];
    const mVals={};
    if(m)for(const k of Object.keys(m).filter(k=>re.test(k)).slice(0,120)){
      try{const v=m[k];if(v==null||['string','number','boolean'].includes(typeof v))mVals[k]=v;else if(k==='loc'||k==='location'||k==='selectedLocation')mVals[k]=JSON.parse(JSON.stringify(v));}catch(_){}
    }
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
    const input=document.getElementById('searchInput');
    const run=document.getElementById('runBtn');
    return {
      label,
      href:location.href,
      input:{value:input?.value||'',ariaExpanded:input?.getAttribute('aria-expanded'),role:input?.getAttribute('role'),list:input?.getAttribute('list'),controls:input?.getAttribute('aria-controls')},
      run:{disabled:!!run?.disabled,ariaBusy:run?.getAttribute('aria-busy'),onclick:typeof run?.onclick==='function'?Function.prototype.toString.call(run.onclick).replace(/\s+/g,' ').slice(0,320):null},
      center:{Mlat:Number(m&&m.centerLat),Mlng:Number(m&&m.centerLng),mapCenter:map?.getCenter?{lat:map.getCenter().lat,lng:map.getCenter().lng}:null,zoom:map?.getZoom?map.getZoom():null},
      loc:m?.loc?JSON.parse(JSON.stringify(m.loc)):null,
      camera16602:window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602||null,
      winFns,mFns,winVals,mVals
    };
  },{label});
}

async function visibleSearchElements(){
  return await page.evaluate(()=>{
    const input=document.getElementById('searchInput');
    const ir=input?.getBoundingClientRect();
    const all=[...document.querySelectorAll('body *')];
    const rows=[];
    for(const el of all){
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      if(r.width<20||r.height<10||cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity||1)===0)continue;
      const text=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
      if(!text||text.length>500)continue;
      const near=ir&&r.top>=ir.top-20&&r.top<=ir.bottom+500&&r.left<=ir.right+500&&r.right>=ir.left-500;
      const semantic=/option|listbox|suggest|search|result|geocod|place/i.test([el.id,el.className,el.getAttribute('role'),el.getAttribute('data-testid')].join(' '));
      if(!near&&!semantic)continue;
      rows.push({tag:el.tagName,id:el.id||null,cls:String(el.className||'').slice(0,180),role:el.getAttribute('role'),text:text.slice(0,300),data:[...el.attributes].filter(a=>a.name.startsWith('data-')).slice(0,8).map(a=>[a.name,a.value]),rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}});
      if(rows.length>=100)break;
    }
    return rows;
  });
}

const report={startedAt:new Date().toISOString(),url:URL,errors,steps:[]};
report.steps.push(await runtime('initial'));

const input=page.locator('#searchInput');
await input.fill('Alabama');
await input.dispatchEvent('input');
await page.waitForTimeout(2200);
report.alabamaSuggestions=await visibleSearchElements();
report.steps.push(await runtime('after typing Alabama'));

let clickedAlabama=false;
const candidates=page.locator('[role="option"], [role="listbox"] *, .mapboxgl-ctrl-geocoder--suggestion, [class*="suggest"], [class*="result"]');
const n=await candidates.count();
for(let i=0;i<n;i++){
  const el=candidates.nth(i); let text=''; try{text=(await el.innerText()).trim();}catch(_){}
  if(/alabama/i.test(text)){
    try{await el.click({timeout:2500});clickedAlabama=true;break;}catch(_){}
  }
}
if(!clickedAlabama){
  const textMatch=page.getByText(/Alabama/i).filter({visible:true});
  const c=await textMatch.count();
  for(let i=0;i<c;i++){
    const el=textMatch.nth(i);try{if((await el.evaluate(e=>e.id!=='searchInput'&&e.tagName!=='BODY'))){await el.click({timeout:2500});clickedAlabama=true;break;}}catch(_){}
  }
}
await page.waitForTimeout(1200);
report.clickedAlabama=clickedAlabama;
report.steps.push(await runtime('after Alabama suggestion click'));

if(clickedAlabama){
  const run=page.locator('#runBtn');
  try{await run.click({timeout:5000});report.clickedRun=true;}catch(e){report.clickedRun=false;report.runClickError=String(e);}
  await page.waitForTimeout(500);
  report.steps.push(await runtime('500ms after Run'));
  try{await page.waitForFunction(()=>document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true',null,{timeout:30000,polling:200});}catch(_){}
  await page.waitForTimeout(500);
  report.steps.push(await runtime('after Run settled'));
}

report.finalErrors=errors.slice(0,50);
await fs.mkdir('runtime-results',{recursive:true});
await fs.writeFile('runtime-results/earthline-runtime-introspect.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_RUNTIME_INTROSPECT '+JSON.stringify({clickedAlabama:report.clickedAlabama,clickedRun:report.clickedRun,steps:report.steps.map(s=>({label:s.label,center:s.center,loc:s.loc,camera16602:s.camera16602,winFns:s.winFns.map(x=>x.key),mFns:s.mFns.map(x=>x.key)})),suggestions:report.alabamaSuggestions.slice(0,20)}));
await browser.close();
