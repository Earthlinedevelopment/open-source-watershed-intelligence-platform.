import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
page.on('console',m=>{ if(/Earthline|Vancouver|aquifer|flow/i.test(m.text())) console.log('BROWSER',m.text()); });
await page.goto(URL+'?vancouver-gate='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='vancouver island';
  i.dispatchEvent(new Event('input',{bubbles:true}));
  i.dispatchEvent(new Event('change',{bubbles:true}));
  b.click();
});
await page.waitForFunction(()=>{
  const t=window.EARTHLINE_REGIONAL_TERMINAL_16539;
  return t&&['published','failed','unavailable'].includes(String(t.status||''));
},null,{timeout:150000,polling:200});
await page.waitForTimeout(4000);

const result=await page.evaluate(()=>{
  const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
  const flows=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.flows?.features||[]).filter(f=>f?.properties?.feature_type==='flow');
  const arrows=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.flows?.features||[]).filter(f=>f?.properties?.feature_type==='flow-arrow');
  const swales=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]);
  const aqAudit=window.EARTHLINE_VANCOUVER_AQUIFER_AUDIT_16912||null;
  const waterAudit=window.EARTHLINE_VANCOUVER_WATER_AUDIT_16912||null;
  const boundaryAudit=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
  const aqSource=map?.getSource?.('el-live-aquifer-15970');
  const aqData=aqSource?._data||null;
  const aqSourceFeatures=Array.isArray(aqData?.features)?aqData.features.length:0;
  const aqFill='el-live-aquifer-fill-15970', aqLine='el-live-aquifer-line-15970';
  const flowLine='el-live-flow-line-15970';
  const layerState=id=>{
    if(!map?.getLayer?.(id))return {exists:false};
    let visibility=null,opacity=null,width=null;
    try{visibility=map.getLayoutProperty(id,'visibility')??'visible';}catch(_){}
    try{opacity=map.getPaintProperty(id,id===aqFill?'fill-opacity':'line-opacity');}catch(_){}
    try{width=map.getPaintProperty(id,'line-width');}catch(_){}
    let rendered=0;
    try{rendered=map.queryRenderedFeatures(undefined,{layers:[id]}).length;}catch(_){}
    return {exists:true,visibility,opacity,width,rendered};
  };
  const aqFillState=layerState(aqFill), aqLineState=layerState(aqLine), flowState=layerState(flowLine);

  const endpointKey=(c)=>Array.isArray(c)&&c.length>=2
    ? (Math.round(Number(c[0])*1000)/1000)+','+(Math.round(Number(c[1])*1000)/1000)
    : null;
  const endCounts=new Map(), startCounts=new Map();
  let shortPaths=0, totalVertices=0;
  for(const f of flows){
    const cs=f?.geometry?.coordinates||[];
    if(cs.length<8)shortPaths++;
    totalVertices+=cs.length;
    const s=endpointKey(cs[0]),e=endpointKey(cs[cs.length-1]);
    if(s)startCounts.set(s,(startCounts.get(s)||0)+1);
    if(e)endCounts.set(e,(endCounts.get(e)||0)+1);
  }
  let endpointConfluences=0;
  for(const [k,n] of endCounts) if(n>=2 || (n>=1 && startCounts.has(k))) endpointConfluences++;

  return {
    terminal:window.EARTHLINE_REGIONAL_TERMINAL_16539||null,
    mapAuthority:{
      lexicalPresent:typeof earthlineMap!=='undefined',
      windowPresent:!!window.earthlineMap,
      sameObject:(typeof earthlineMap!=='undefined'&&window.earthlineMap)?earthlineMap===window.earthlineMap:null
    },
    waterAudit,aqAudit,boundaryAudit,
    displayAudit:window.EARTHLINE_VANCOUVER_DISPLAY_AUDIT_16915||null,
    nativeAudit:window.EARTHLINE_REGIONAL_NATIVE_PUBLICATION_16920||null,
    flowProfile:window.EARTHLINE_REGIONAL_FLOW_PROFILE_16918||null,
    visual:{
      flows:flows.length,arrows:arrows.length,swales:swales.length,
      shortPaths,totalVertices,endpointConfluences
    },
    map:{
      aquiferSourceFeatures:aqSourceFeatures,
      aquiferFill:aqFillState,
      aquiferLine:aqLineState,
      flowLine:flowState
    }
  };
});
console.log('VANCOUVER_LIVE_DIAGNOSTIC '+JSON.stringify(result));

if(result.terminal?.status!=='published')throw new Error('Vancouver Island did not publish');
if(!(Number(result.waterAudit?.waterPaths)>0)||!(Number(result.visual.flows)>0))throw new Error('Vancouver Island water paths missing');
if(Number(result.visual.flows)<60)throw new Error('Vancouver Island tributary/path density insufficient: '+String(result.visual.flows));
if(Number(result.visual.endpointConfluences)<3)throw new Error('Vancouver Island tributary/confluence structure insufficient: '+String(result.visual.endpointConfluences));
if(!(Number(result.aqAudit?.published)>0))throw new Error('Vancouver Island official aquifer data missing');
if(!(Number(result.map?.aquiferSourceFeatures)>0))throw new Error('Vancouver Island aquifer Mapbox source is empty');
if(result.map?.aquiferFill?.visibility==='none')throw new Error('Vancouver Island aquifer fill layer hidden');
if(!(Number(result.map?.aquiferFill?.rendered)>0))throw new Error('Vancouver Island aquifer polygons exist but are not visibly rendered in viewport');
if(result.map?.flowLine?.exists!==true)throw new Error('Vancouver Island flow line layer missing');
if(result.map?.flowLine?.visibility==='none')throw new Error('Vancouver Island flow line layer hidden');
if(!(Number(result.map?.flowLine?.rendered)>0))throw new Error('Vancouver Island flows exist but are not visibly rendered in viewport');
if(!result.boundaryAudit)throw new Error('Vancouver Island authoritative containment audit missing');
await browser.close();

// EARTHLINE 16920 shared native publication candidate gate
