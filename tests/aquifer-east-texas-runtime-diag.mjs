import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='Texas';
  i.dispatchEvent(new Event('input',{bubbles:true}));
  i.dispatchEvent(new Event('change',{bubbles:true}));
  b.click();
});

let timedOut=false;
try{
  await page.waitForFunction(()=>{
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    return /screening published\./i.test(s)||/ANALYSIS FAILED/i.test(s)||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
  },{timeout:35000,polling:100});
}catch(_){timedOut=true;}
await page.waitForTimeout(1200);

const snap=await page.evaluate(()=>{
  const RX=/aquifer|groundwater|ground water|well|hydrogeo/i;
  const summary=v=>{
    try{
      if(v==null)return {type:String(v)};
      if(Array.isArray(v))return {type:'array',length:v.length};
      if(typeof v==='object')return {type:'object',keys:Object.keys(v).slice(0,60)};
      return {type:typeof v,value:String(v).slice(0,500)};
    }catch(e){return {type:'error',error:String(e)};}
  };
  const coordStats=features=>{
    const out={total:0,east:0,central:0,west:0,unknown:0,bbox:null};
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    const pts=[];
    const walk=c=>{if(!Array.isArray(c))return;if(c.length>=2&&Number.isFinite(+c[0])&&Number.isFinite(+c[1])){pts.push([+c[0],+c[1]]);return;}for(const x of c)walk(x);};
    for(const f of features||[]){
      out.total++;
      pts.length=0;walk(f?.geometry?.coordinates);
      if(!pts.length){out.unknown++;continue;}
      let sx=0,sy=0;for(const [x,y] of pts){sx+=x;sy+=y;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
      const lon=sx/pts.length;
      if(lon>-96)out.east++;else if(lon<-100)out.west++;else out.central++;
    }
    if(Number.isFinite(minX))out.bbox=[minX,minY,maxX,maxY];
    return out;
  };

  const globalMatches=[];
  for(const k of Object.getOwnPropertyNames(window)){
    if(!RX.test(k))continue;
    try{globalMatches.push({name:k,...summary(window[k])});}catch(e){globalMatches.push({name:k,type:'error',error:String(e)});}
  }
  const mMatches=[];
  try{for(const k of Object.keys(window.M||{})){if(RX.test(k))mMatches.push({name:'M.'+k,...summary(window.M[k])});}}catch(_){}

  const candidates=[];
  const addMap=(name,v)=>{try{if(v&&typeof v.getStyle==='function'&&typeof v.getSource==='function'&&!candidates.some(x=>x.v===v))candidates.push({name,v});}catch(_){}};
  for(const name of ['map','earthlineMap','EARTHLINE_MAP']){try{addMap(name,window[name]);}catch(_){}}
  try{for(const k of Object.keys(window.M||{}))addMap('M.'+k,window.M[k]);}catch(_){}
  for(const k of Object.getOwnPropertyNames(window).slice(0,5000)){
    try{const v=window[k];if(v&&typeof v==='object')addMap(k,v);}catch(_){}
  }

  const mapResults=[];
  for(const {name,v:map} of candidates){
    let style={};try{style=map.getStyle()||{};}catch(_){}
    const sourceRows=[];
    for(const [id,cfg] of Object.entries(style.sources||{})){
      let live=null;try{live=map.getSource(id);}catch(_){}
      let data=null;
      try{data=live?._data||live?._options?.data||(cfg&&typeof cfg.data==='object'?cfg.data:null);}catch(_){}
      let features=Array.isArray(data?.features)?data.features:[];
      const propMatch=features.some(f=>RX.test(JSON.stringify(f?.properties||{})));
      const cfgText=(()=>{try{return JSON.stringify(cfg||{});}catch(_){return '';}})();
      if(RX.test(id)||RX.test(cfgText)||propMatch){
        sourceRows.push({id,type:cfg?.type||null,url:typeof cfg?.url==='string'?cfg.url:null,dataUrl:typeof cfg?.data==='string'?cfg.data:null,featureStats:coordStats(features),sampleProps:features.slice(0,5).map(f=>f?.properties||{})});
      }
    }
    const layerRows=[];
    for(const l of style.layers||[]){
      let txt='';try{txt=JSON.stringify(l);}catch(_){}
      if(RX.test(l?.id||'')||RX.test(l?.source||'')||RX.test(txt))layerRows.push({id:l.id,type:l.type,source:l.source||null,sourceLayer:l['source-layer']||null,minzoom:l.minzoom??null,maxzoom:l.maxzoom??null});
    }
    mapResults.push({name,sourceRows,layerRows});
  }

  const dom=[];
  for(const el of Array.from(document.querySelectorAll('[id],[class]'))){
    const id=el.id||'',cl=typeof el.className==='string'?el.className:'',txt=String(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,240);
    if(RX.test(id)||RX.test(cl)||RX.test(txt))dom.push({tag:el.tagName,id,className:cl.slice(0,200),text:txt});
    if(dom.length>=120)break;
  }

  const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  const visualKeys=visual&&typeof visual==='object'?Object.keys(visual):[];
  const visualMatches=[];
  if(visual&&typeof visual==='object')for(const k of visualKeys){if(RX.test(k)||RX.test(JSON.stringify(visual[k]?.features?.[0]?.properties||{})))visualMatches.push({key:k,stats:Array.isArray(visual[k]?.features)?coordStats(visual[k].features):summary(visual[k])});}

  return {globalMatches,mMatches,mapResults,dom,visualKeys,visualMatches,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null};
});

console.log('EARTHLINE_AQUIFER_EAST_TEXAS_DIAG '+JSON.stringify({timedOut,snap,errors:errors.slice(0,20)}));
await browser.close();
if(timedOut||snap.lastError)process.exitCode=1;
