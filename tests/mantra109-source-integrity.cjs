'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const count=s=>html.split(s).length-1;
const must=(ok,msg)=>assert.ok(ok,msg);
must(count('<script defer src="earthline-elder-restored-17097.js"></script>')===1,'existing Elder renderer must load exactly once');
must(fs.existsSync('earthline-elder-restored-17097.js'),'Elder source missing');
must(fs.existsSync('earthline-elder-worker-17129.js'),'Elder worker missing');
must(fs.existsSync('data/elder-trees/v2/manifest.json'),'Elder manifest missing');
must(!html.includes('const towns=[['+"'Burlington'"),'report contains fictional Vermont town list');
must(!html.includes('dpath=smoothPath(r.f)'),'report still smooths swale geometry');
must(!html.includes("if(!pts.length)return[-73.5,42.7,-71.4,45.1]"),'report still invents Vermont bounds');
const marker='  function visual(){';
const reportStart=html.indexOf('<script id="earthline-vermont-preservation-16149">');
const ownerStart=html.indexOf(marker,reportStart);
const ownerEnd=html.indexOf('  function valid(){',ownerStart);
must(reportStart>=0&&ownerStart>reportStart&&ownerEnd>ownerStart,'report owner not found');
const visualCode=html.slice(ownerStart,ownerEnd);
function runVisual(snapshot,model,visual){
  const ctx={snapshot:()=>snapshot,window:{EARTHLINE_REGIONAL_VISUAL_DATA_16020:visual,M:model},M:model};
  return vm.runInNewContext(visualCode+'\nvisual()',ctx);
}
const region={tier:'regional',runToken:'correct'};
const source={runToken:'correct',swales:{features:[{id:'CURRENT'}]}};
must(runVisual(region,{},source).runToken==='correct','matching regional report data not retained');
must(runVisual(region,{}, {runToken:'stale',swales:{features:[{id:'STALE'}]}})===null,'previous Regional run leaked into report');
const verified={
  searchGen:23,
  propertyPublication15816:{committed:true,safetyVerified:true,searchGen:23},
  propertyResultLock15815:{safetyVerified:true,searchGen:23},
  safetyAudit15806:{verified:true},
  authoritativeSafeSwales15815:{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'LineString',coordinates:[[0,0],[1,1]]},properties:{grade:'A'}}]},
  usgsAquifers:[{name:'Mapped Evidence',aquiferType:'aquifer-material',lngLatPts:[[0,0],[1,0],[1,1],[0,1],[0,0]]}]
};
const prop=runVisual({tier:'property',runToken:'prop-one'},verified,source);
must(prop?.runToken==='prop-one'&&prop.swales.features.length===1,'verified Property geometry not selected');
must(prop.aquifers.features[0].properties.name==='Mapped Evidence','groundwater name not retained');
verified.propertyResultLock15815.searchGen=22;
must(runVisual({tier:'property',runToken:'prop-one'},verified,source)===null,'unsafe/stale Property publication was accepted');
const mapStart=html.indexOf('  function reportBounds(',ownerEnd);
const mapEnd=html.indexOf('  function gradeSummary(',mapStart);
must(mapStart>reportStart&&mapEnd>mapStart,'report map renderer not found');
const mapCode=html.slice(mapStart,mapEnd);
const aq={type:'Feature',properties:{name:'TEST SOURCE AQUIFER'},geometry:{type:'Polygon',coordinates:[[[-73,44],[-72,44],[-72,45],[-73,45],[-73,44]]]}};
const swale={type:'Feature',geometry:{type:'LineString',coordinates:[[-72.9,44.1],[-72.8,44.2],[-72.7,44.15]]}};
const data={bounds:[-73.1,43.9,-71.9,45.1],tier:'regional',query:'Iowa',runToken:'run-109'};
const ctx={
  visual:()=>({aquifers:{type:'FeatureCollection',features:[aq]}}),
  contours:()=>[],flows:()=>[],swales:()=>[swale],
  allCoordinates:()=>swale.geometry.coordinates,
  graded:()=>[{grade:'A',f:swale}],
  esc:s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
};
const svg=vm.runInNewContext(mapCode+'\nmapSvg',ctx)(data,false);
must(svg.includes('TEST SOURCE AQUIFER'),'source-provided aquifer name missing from report map');
must(svg.includes('#ff9c21'),'source aquifer footprint not drawn');
must(svg.includes('Iowa'),'report map not bound to requested place');
must(!svg.includes('Burlington')&&!svg.includes('Earthline Vermont regional screening map'),'hardcoded Vermont report geography present');
must(!svg.includes('stroke-width="6.2"')&&!svg.includes('stroke-width="4.1"'),'report worm presentation persists');
const svgUnavailable=vm.runInNewContext(mapCode+'\nmapSvg',{...ctx,allCoordinates:()=>[]})({tier:'property',runToken:'unavailable'},true);
must(svgUnavailable.includes('No run-matched, verified map geometry'),'missing geometry silently backfilled');
console.log('MANTRA109 report owner, exact-source swales, aquifer geometry/names, Elder loader: PASS');
