import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[],patches={};
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1 match, found '+n);body=body.replace(needle,replacement);};
  apply('demComputeYield',`      if((gy&7)===7)await wait(0);`,`      if((gy&7)===7)await Promise.resolve();`);
  apply('pitFillComputeYield',`        await wait(0);
      }
    }
    const mid=(b[1]+b[3])/2,cellX=`,`        await Promise.resolve();
      }
    }
    const mid=(b[1]+b[3])/2,cellX=`);
  apply('flowDirectionComputeYield',`        await wait(0);
      }
    }
    const order=[];`,`        await Promise.resolve();
      }
    }
    const order=[];`);
  apply('flowAccumComputeYield',`        await wait(0);
      }
    }
    return {filled,to,slope,acc,cellX,cellY,w,h,bounds:b,elev:terrainElev16584,validityMask16584:valid16584};`,`        await Promise.resolve();
      }
    }
    return {filled,to,slope,acc,cellX,cellY,w,h,bounds:b,elev:terrainElev16584,validityMask16584:valid16584};`);
  apply('contourComputeYield',`      await wait(0);
    }
    return {type:'FeatureCollection',features};`,`      await Promise.resolve();
    }
    return {type:'FeatureCollection',features};`);
  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_yield_cross_state='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const cases=['Texas','Texas','Texas','New York','Vermont','Massachusetts'];
for(let idx=0;idx<cases.length;idx++){
  const query=cases[idx],repeat=idx+1;
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(700);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,m=typeof M!=='undefined'&&M?M:null;
    return {loc:String(m?.loc?.name||m?.loc?.fullName||''),swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,outside:b?.outsideAfterClip??null,aquifer:a,gridW:flow?.gridAudit?.grid?.w??null,gridH:flow?.gridAudit?.grid?.h??null,unsafe:flow?.unsafeSegments??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
  });
  const row={repeat,query,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_YIELD_CROSS_STATE '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_YIELD_CROSS_STATE_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
const texas=rows.filter(r=>r.query==='Texas');
const commonBad=rows.some(r=>r.timedOut||r.state.lastError||!(r.state.totalMs<=15000)||Number(r.state.gridW)!==96||Number(r.state.gridH)!==96||Number(r.state.unsafe)!==0||Number(r.state.visible||0)<=0||Number(r.state.published||0)<=0||Number(r.state.outside?.swales||0)!==0);
const txBad=texas.some(r=>r.state.visible!==66||r.state.published!==66||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10||!/Principal Aquifers/i.test(String(r.state.aquifer?.source||''))||Number(r.state.aquifer?.features||0)!==83);
if(Object.values(patches).some(v=>v!==1)||commonBad||txBad)process.exitCode=1;
