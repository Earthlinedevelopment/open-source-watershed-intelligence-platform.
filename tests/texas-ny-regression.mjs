import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL='https://earthlinedevelopment.org/?earthline_regression=tx_renderer_probe_'+Date.now();
const CASES=['Texas','Texas','Texas','Texas','Texas','New York'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
const results=[];let loadError=null;
try{
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>typeof window.earthlineRenderRegionalOverlay16020==='function',{timeout:15000});
  await page.evaluate(()=>{
    window.__EARTHLINE_RENDER_PROBES=[];
    const original=window.earthlineRenderRegionalOverlay16020;
    if(!original.__earthlineProbeWrapped){
      const wrapped=function(data){
        const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
        const features=Array.isArray(data?.swales?.features)?data.swales.features:[];
        const lengths=[];
        for(const f of features){
          const coords=f?.geometry?.type==='LineString'?f.geometry.coordinates:[];
          const pts=[];
          for(const ll of coords){
            try{const p=map?.project?.({lng:Number(ll[0]),lat:Number(ll[1])});if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)){const q=pts[pts.length-1];if(!q||Math.hypot(q.x-p.x,q.y-p.y)>.35)pts.push({x:p.x,y:p.y});}}catch(_){}
          }
          let len=0;for(let i=1;i<pts.length;i++)len+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);
          lengths.push({pts:pts.length,len:Number(len.toFixed(2)),eligible:pts.length>=3&&len>=22});
        }
        let beforeZoom=null,bounds=null;try{beforeZoom=Number(map?.getZoom?.());const b=map?.getBounds?.();bounds=b?[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()]:null;}catch(_){}
        let result=false,error=null;try{result=original(data);}catch(e){error=String(e);throw e;}finally{
          const audit=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
          window.__EARTHLINE_RENDER_PROBES.push({runToken:data?.runToken||null,query:data?.query||'',source:features.length,eligible:lengths.filter(x=>x.eligible).length,lengths,zoom:beforeZoom,bounds,result,error,auditSwales:Number(audit?.swaleLines||0),at:Date.now()});
        }
        return result;
      };
      wrapped.__earthlineProbeWrapped=true;window.earthlineRenderRegionalOverlay16020=wrapped;
    }
  });
}catch(e){loadError=String(e);}

for(let run=0;run<CASES.length&&!loadError;run++){
  const query=CASES[run];
  const prevToken=await page.evaluate(()=>window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584?.runToken||window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970?.runToken||null);
  const probeStart=await page.evaluate(()=>window.__EARTHLINE_RENDER_PROBES?.length||0);
  const clickStarted=Date.now();let timedOut=false,terminalAt=0;
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');if(!i||!b)throw new Error('search controls unavailable');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  try{
    await page.waitForFunction(({q,prev})=>{const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,token=(err&&err.runToken)||(flow&&flow.runToken)||null;if(!token||token===prev)return false;if(err&&err.runToken===token)return true;const m=typeof M!=='undefined'&&M?M:null,status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),loc=[m?.loc?.name,m?.loc?.fullName].filter(Boolean).join(' '),identity=q.toLowerCase().split(/\s+/).every(w=>loc.toLowerCase().includes(w));return identity&&/screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;},{q:query,prev:prevToken},{timeout:30000,polling:50});terminalAt=Date.now();
  }catch(_){timedOut=true;terminalAt=Date.now();}
  const after=await page.evaluate(start=>{const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;return {perf,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,pub,flowAudit:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),probes:(window.__EARTHLINE_RENDER_PROBES||[]).slice(start)};},probeStart);
  const r={run:run+1,query,clickToTerminalMs:terminalAt-clickStarted,timedOut,coreMs:Number(after?.perf?.totalMs||Infinity),terrainSource:after?.perf?.terrainSource||null,status:after?.status||'',generated:after?.pub?.generated??null,overlaySwaleLines:after?.pub?.overlaySwaleLines??null,lastError:after?.lastError||null,flowAudit:after?.flowAudit||null,renderProbes:after?.probes||[],pageErrors:pageErrors.slice(0,20)};
  results.push(r);console.log('EARTHLINE_TX_RENDER_PROBE '+JSON.stringify(r));
}
await browser.close();
writeFileSync('tx-ny-regression-results.json',JSON.stringify(results,null,2));
const bad=loadError||results.length!==CASES.length||results.some(r=>r.timedOut||r.lastError||!Number.isFinite(r.coreMs)||r.coreMs>15000||r.clickToTerminalMs>15000||!/screening published\./i.test(r.status)||(Number(r.generated||0)>0&&Number(r.overlaySwaleLines||0)===0));
if(loadError)console.error('LOAD_ERROR',loadError);
if(bad)process.exitCode=1;
