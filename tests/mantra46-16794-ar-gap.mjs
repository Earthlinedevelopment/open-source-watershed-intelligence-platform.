import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra46-16794-ar-gap';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1908,height:882}});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.goto(BASE+'?m46_ar_gap='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='Arkansas';
  i.dispatchEvent(new Event('input',{bubbles:true}));
  i.dispatchEvent(new Event('change',{bubbles:true}));
  b.click();
});
await page.waitForFunction(()=>{
  const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
  const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
  return /screening published\./i.test(s)&&root&&String(root.query||'').toLowerCase().includes('arkansas');
},{timeout:55000,polling:100});
await page.waitForTimeout(1500);

const result=await page.evaluate(()=>{
  const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
  const fine=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null;
  const spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null;
  const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
  const terrainGap=window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730||null;
  const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
  const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
  const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
  const publication=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;

  const bbox=pkg?.location?.bbox||[-94.61786,33.0043,-89.641,36.49953];
  const target={lng:-91.91143,lat:34.74176};
  const cellFor=(lng,lat)=>({
    bx:Math.max(0,Math.min(11,Math.floor((lng-bbox[0])/(bbox[2]-bbox[0])*12))),
    by:Math.max(0,Math.min(11,Math.floor((bbox[3]-lat)/(bbox[3]-bbox[1])*12)))
  });
  const targetCell=cellFor(target.lng,target.lat);
  const inspectKeys=[];
  for(let by=Math.max(0,targetCell.by-3);by<=Math.min(11,targetCell.by+1);by++){
    for(let bx=Math.max(0,targetCell.bx-1);bx<=Math.min(11,targetCell.bx+1);bx++)inspectKeys.push(bx+','+by);
  }

  const style=earthlineMap.getStyle();
  const sourceRows=[];
  const cellCounts={};
  for(const id of Object.keys(style.sources||{})){
    let src=null,data=null;
    try{src=earthlineMap.getSource(id);data=src&&src._data;}catch(_){}
    const feats=data&&Array.isArray(data.features)?data.features:null;
    if(!feats)continue;
    let lineCount=0,swaleLike=0;
    for(const f of feats){
      const g=f&&f.geometry;
      if(!g||g.type!=='LineString'||!Array.isArray(g.coordinates)||!g.coordinates.length)continue;
      lineCount++;
      const p=f.properties||{};
      if('slope_pct' in p || 'score' in p || 'confidence' in p || /swale/i.test(String(p.kind||p.type||p.name||'')))swaleLike++;
    }
    if(lineCount)sourceRows.push({id,lineCount,swaleLike});
  }

  const swaleSource=sourceRows.sort((a,b)=>b.swaleLike-a.swaleLike||b.lineCount-a.lineCount)[0]||null;
  if(swaleSource){
    const data=earthlineMap.getSource(swaleSource.id)?._data;
    for(const f of data.features||[]){
      const coords=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;
      if(!coords||!coords.length)continue;
      const mid=coords[Math.floor((coords.length-1)/2)];
      if(!Array.isArray(mid))continue;
      const c=cellFor(Number(mid[0]),Number(mid[1]));
      const k=c.bx+','+c.by;
      cellCounts[k]=(cellCounts[k]||0)+1;
    }
  }

  const opp=new Map((fine?.opportunityCells||[]).map(r=>[r.bx+','+r.by,r]));
  const unresolved=new Map((fine?.unresolvedAfter||[]).map(r=>[r.bx+','+r.by,r]));
  const selected=new Map((fine?.selected||[]).map(r=>[r.bx+','+r.by,r]));
  const candCoverage=new Set(spread?.candidateCoverageCellKeys||[]);
  const candidateCells=new Set(spread?.candidateCellKeys||[]);
  const finalCells=new Set(spread?.finalCellKeys||[]);
  const cells=inspectKeys.map(k=>({
    key:k,
    opportunity:opp.get(k)||null,
    refined:selected.get(k)||null,
    unresolved:unresolved.get(k)||null,
    candidateCoverage:candCoverage.has(k),
    candidateMidpoint:candidateCells.has(k),
    finalSelected:finalCells.has(k),
    displayedSwales:Number(cellCounts[k]||0)
  }));

  return {
    pkg, target, targetCell, cells,
    fine:{tileBudget:fine?.tileBudget,added:fine?.added,selected:fine?.selected,unresolvedAfter:fine?.unresolvedAfter,failedTiles:fine?.failedTiles,opportunityCells:fine?.opportunityCells},
    spread:{initialCells:spread?.initialCells,finalCells:spread?.finalCells,targetCells:spread?.targetCells,attainableTargetCells:spread?.attainableTargetCells,selectionStopReason:spread?.selectionStopReason,swaps:spread?.swaps},
    terrainGap,
    root,
    boundary,
    flow,
    perf,
    publication,
    display,
    sourceRows,
    swaleSource,
    pageErrors:[]
  };
});

result.pageErrors=pageErrors;
writeFileSync(OUT+'/result.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_AR_GAP '+JSON.stringify({
  targetCell:result.targetCell,
  cells:result.cells,
  fine:{tileBudget:result.fine.tileBudget,added:result.fine.added,selected:result.fine.selected?.length,unresolvedAfter:result.fine.unresolvedAfter?.length,failedTiles:result.fine.failedTiles},
  spread:result.spread,
  coreMs:result.perf?.totalMs??null,
  generated:result.publication?.generated??null,
  visible:result.display?.swaleLines??result.publication?.overlaySwaleLines??null,
  unsafe:result.flow?.unsafeSegments??null,
  pageErrors
}));
await page.screenshot({path:OUT+'/arkansas-gap.png',fullPage:false});
await browser.close();
