// Checks geometryAudit against hand-built scenes with known answers. Offline; needs only Playwright.
import {chromium} from 'playwright';
import {geometryAudit} from './geometry-audit.mjs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
await page.setContent('<html><body></body></html>');
const result=await page.evaluate(({fn})=>{
  const C={lng:-92.14778,lat:34.75262};const kx=6371008.8*Math.cos(C.lat*Math.PI/180)*Math.PI/180,ky=6371008.8*Math.PI/180;
  const ll=(x,y)=>[C.lng+x/kx,C.lat+y/ky];                       // metres east/north of centre -> lng/lat
  const line=(...pts)=>({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:pts.map(p=>ll(p[0],p[1]))}});
  const road=[line([0,-300],[0,300])];                              // N-S road through the middle
  const water=[
    line([-40,100],[40,120]),                                       // crosses the road
    line([-300,200],[100,200]),                                     // 400 m ruler-straight, due E-W
    line([-150,-100],[-120,-60],[-95,-80],[-60,-30],[-20,-50],[30,-10],[60,-40],[110,-2]), // wavy, not crossing... (ends east of road? crosses once)
    ...Array.from({length:12},(_,i)=>line([150+i*1.0,-50],[150+i*1.0,20])), // 12 vertical lines 1 m apart (comb)
  ];
  const swales=[line([2,-200],[2,-150]),                            // 2 m from road (inside 3.05 m setback)
                line([60,-200],[110,-196]),line([60,-196.5],[110,-192.5]), // two swales 3.5 m apart (closer than 4.572)
                line([60,-180],[110,-176])];                        // a fine swale, ~16 m away
  const styleLayers=[{id:'road-street',type:'line'},{id:'road-street-case',type:'line'},{id:'road-label',type:'symbol'},{id:'earthline-water-path-test',type:'line'},{id:'el-other-test',type:'fill'}];
  window.earthlineMap={getCenter:()=>C,getStyle:()=>({layers:styleLayers}),
    queryRenderedFeatures:({layers})=>layers.flatMap(id=>id==='road-street'?road:id==='earthline-water-path-test'?water:[])};
  window.earthlineSwaleGeoJSON=()=>({features:swales});
  // one recharge target: 15 m-radius circle centred on the "fine swale" (so only that swale crosses it); swales 2 and 3 pass 20 m and 16.5 m from its centre
  window.earthlineRechargeGeoJSON=()=>({features:[{type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[Array.from({length:65},(_,i)=>{const a=i/64*2*Math.PI;return ll(85+15*Math.cos(a),-178+15*Math.sin(a));})]}}]});
  return (new Function('return '+fn))()();
},{fn:geometryAudit.toString()});
await browser.close();
const w=result.drawnLayers&&result.drawnLayers[0],s=result.swaleOutput;
console.log(JSON.stringify(result,null,1).slice(0,2500));
const checks=[
 ['audit ran ok',result.ok===true],
 ['roads seen',result.roadCheckValid===true&&result.roadLayersQueried===1],
 ['water: 3 lines cross the road (the short crossing line, the 400 m line and the wavy line all span x=0)',w&&w.roadCrossings===3],
 ['water: one ruler-straight 400 m line',w&&w.rulerStraightLong===1],
 ['water: one axis-aligned long line',w&&w.axisAlignedLong===1],
 ['water: comb of 12 found as one tight cluster',w&&w.largestTightCluster===12],
 ['water: 11 neighbouring comb pairs',w&&w.tightPairs>=11],
 ['swales: exactly 1 within road setback',s&&s.withinRoadSetback===1],
 ['swales: exactly 1 pair closer than 4.572 m',s&&s.tightPairs===1],
 ['swales: none cross the road',s&&s.roadCrossings===0],
 ['recharge: 1 target seen',result.rechargeOverlap&&result.rechargeOverlap.targets===1],
 ['recharge: exactly 1 of 4 swales touches the target',result.rechargeOverlap&&result.rechargeOverlap.swalesChecked===4&&result.rechargeOverlap.swalesTouchingTargets===1],
 ['recharge: about 30 m of 200 m inside (12-18 %)',result.rechargeOverlap&&result.rechargeOverlap.shareOfSwaleLengthInsideTargetsPct>=12&&result.rechargeOverlap.shareOfSwaleLengthInsideTargetsPct<=18],
];
let bad=0;for(const [n,ok] of checks){console.log((ok?'PASS ':'FAIL ')+n);if(!ok)bad++;}
process.exit(bad?1:0);
