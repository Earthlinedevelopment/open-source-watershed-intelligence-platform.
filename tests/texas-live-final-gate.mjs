import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[],patches={};
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1 match, found '+n);body=body.replace(needle,replacement);};

  apply('demComputeYield',
`      if((gy&7)===7)await wait(0);`,
`      if((gy&7)===7)await Promise.resolve();`);
  apply('pitFillComputeYield',
`        await wait(0);
      }
    }
    const mid=(b[1]+b[3])/2,cellX=`,
`        await Promise.resolve();
      }
    }
    const mid=(b[1]+b[3])/2,cellX=`);
  apply('flowDirectionComputeYield',
`        await wait(0);
      }
    }
    const order=[];`,
`        await Promise.resolve();
      }
    }
    const order=[];`);
  apply('flowAccumComputeYield',
`        await wait(0);
      }
    }
    return {filled,to,slope,acc,cellX,cellY,w,h,bounds:b,elev:terrainElev16584,validityMask16584:valid16584};`,
`        await Promise.resolve();
      }
    }
    return {filled,to,slope,acc,cellX,cellY,w,h,bounds:b,elev:terrainElev16584,validityMask16584:valid16584};`);
  apply('contourComputeYield',
`      await wait(0);
    }
    return {type:'FeatureCollection',features};`,
`      await Promise.resolve();
    }
    return {type:'FeatureCollection',features};`);

  apply('productInit',
`    const productsStarted16198=performance.now();`,
`    const productsStarted16198=performance.now();
    const txProfile16647={runToken,startedAt:productsStarted16198,useSupplemental:false};
    window.EARTHLINE_TX_PRODUCT_PROFILE_16647=txProfile16647;
    let txMark16647=performance.now();`);

  apply('normalContours',
`    let contours=await makeContours(hy);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · CONTOURS COMPLETE',runToken);await wait(0);`,
`    txMark16647=performance.now();
    let contours=await makeContours(hy);
    txProfile16647.normalContoursMs=Math.round(performance.now()-txMark16647);
    noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · CONTOURS COMPLETE',runToken);
    txMark16647=performance.now();await wait(0);txProfile16647.postNormalContoursYieldMs=Math.round(performance.now()-txMark16647);`);

  apply('boundaryAwait',
`      selectionBoundary16539=await jurisdictionBoundaryPromise16539;`,
`      txMark16647=performance.now();
      selectionBoundary16539=await jurisdictionBoundaryPromise16539;
      txProfile16647.boundaryAwaitMs=Math.round(performance.now()-txMark16647);`);

  apply('supplementalContours',
`    const swaleCandidateContours16609=useSupplemental16609?await makeContours(hy,true):contours;`,
`    txProfile16647.useSupplemental=!!useSupplemental16609;
    txMark16647=performance.now();
    const swaleCandidateContours16609=useSupplemental16609?await makeContours(hy,true):contours;
    txProfile16647.supplementalContoursMs=Math.round(performance.now()-txMark16647);`);

  apply('swales',
`    let swales=makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`,
`    txMark16647=performance.now();
    let swales=makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);
    txProfile16647.swalesMs=Math.round(performance.now()-txMark16647);
    noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);
    txMark16647=performance.now();await wait(0);txProfile16647.postSwalesYieldMs=Math.round(performance.now()-txMark16647);`);

  apply('styleWater',
`      hy.styleWaterIndex16584=earthlineLoadedStyleWaterIndex16584(map(),hy.bounds);`,
`      txMark16647=performance.now();
      hy.styleWaterIndex16584=earthlineLoadedStyleWaterIndex16584(map(),hy.bounds);
      txProfile16647.styleWaterIndexMs=Math.round(performance.now()-txMark16647);`);

  apply('flows',
`    let flows=makeFlows(hy);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · FLOWS COMPLETE',runToken);await wait(0);`,
`    txMark16647=performance.now();
    let flows=makeFlows(hy);
    txProfile16647.flowsMs=Math.round(performance.now()-txMark16647);
    noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · FLOWS COMPLETE',runToken);
    txMark16647=performance.now();await wait(0);txProfile16647.postFlowsYieldMs=Math.round(performance.now()-txMark16647);
    txMark16647=performance.now();`);

  apply('flowAuditEnd',
`    window.EARTHLINE_ORB_RESPONSIVENESS_16245={build:'EARTHLINE 16245',cooperativeTerrain:true,compositorOrb:true,productsMs:Math.round(performance.now()-contoursStarted16245),at:new Date().toISOString()};`,
`    txProfile16647.flowAuditMs=Math.round(performance.now()-txMark16647);
    window.EARTHLINE_ORB_RESPONSIVENESS_16245={build:'EARTHLINE 16245',cooperativeTerrain:true,compositorOrb:true,productsMs:Math.round(performance.now()-contoursStarted16245),at:new Date().toISOString()};`);

  apply('jurisdictionClip',
`      const bounded16539=earthlineClipRegionalProducts16539({contours,flows,swales,query:q,runToken},boundary16539);`,
`      txMark16647=performance.now();
      const bounded16539=earthlineClipRegionalProducts16539({contours,flows,swales,query:q,runToken},boundary16539);
      txProfile16647.jurisdictionClipMs=Math.round(performance.now()-txMark16647);`);

  apply('cameraSettle',
`    const cameraFinalStarted16329=performance.now();
    const cameraReady16334=await cameraSettle16310;
    phase16198.cameraReadyBeforePublishMs=Math.round(performance.now()-cameraFinalStarted16329);`,
`    const cameraFinalStarted16329=performance.now();
    const cameraReady16334=await cameraSettle16310;
    phase16198.cameraReadyBeforePublishMs=Math.round(performance.now()-cameraFinalStarted16329);
    txProfile16647.cameraFinalMs=phase16198.cameraReadyBeforePublishMs;`);

  apply('finalWaterClip',
`      flows=earthlineFinalWaterClip16584(hy,flows,m,runToken);`,
`      txMark16647=performance.now();
      flows=earthlineFinalWaterClip16584(hy,flows,m,runToken);
      txProfile16647.finalWaterClipMs=Math.round(performance.now()-txMark16647);`);

  apply('publicationStart',
`    if(!guardedSetGeo(runToken,m,IDS.contours,contours,'earthline-modeled-contours'))return false;`,
`    txMark16647=performance.now();
    if(!guardedSetGeo(runToken,m,IDS.contours,contours,'earthline-modeled-contours'))return false;`);

  apply('publicationEnd',
`    phaseMark16198('terrainProductsAndPublishMs',productsStarted16198);`,
`    txProfile16647.publicationMs=Math.round(performance.now()-txMark16647);
    txProfile16647.totalProductsMs=Math.round(performance.now()-productsStarted16198);
    txProfile16647.completedAt=performance.now();
    window.EARTHLINE_TX_PRODUCT_PROFILE_16647=Object.assign({},txProfile16647);
    phaseMark16198('terrainProductsAndPublishMs',productsStarted16198);`);

  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_compute_yield16647='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
for(let repeat=1;repeat<=5;repeat++){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(500);
 const state=await page.evaluate(()=>{
  const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
  const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
  const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
  const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
  return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,phases:p?.phaseTotalsMs??null,profile:window.EARTHLINE_TX_PRODUCT_PROFILE_16647||null,gridW:flow?.gridAudit?.grid?.w??null,gridH:flow?.gridAudit?.grid?.h??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
 });
 const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_PRODUCT_PROFILE_16647 '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_PRODUCT_PROFILE_16647_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
