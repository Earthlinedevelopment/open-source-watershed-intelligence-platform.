import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Iowa','Arkansas'];
mkdirSync('artifacts/mantra46-16792-state-camera-ab',{recursive:true});

function patchBody(body){
  const needle=`          let local15873=null;
          try{if(typeof earthlineRegionOverride==="function")local15873=earthlineRegionOverride(raw);}catch(_){ }
          try{if(!local15873&&typeof findLoc==="function")local15873=findLoc(raw);}catch(_){ }`;
  const repl=`          let local15873=null;
          try{
            const profile16792=typeof earthlineJurisdictionProfile16549==="function"?earthlineJurisdictionProfile16549(raw):null;
            if(profile16792&&typeof earthlineResolveAtomicUSStatePackage16556==="function"){
              const pkg16792=await earthlineResolveAtomicUSStatePackage16556(profile16792);
              if(pkg16792&&pkg16792.location)local15873=Object.assign({},pkg16792.location);
            }
          }catch(_){ }
          try{if(!local15873&&typeof earthlineRegionOverride==="function")local15873=earthlineRegionOverride(raw);}catch(_){ }
          try{if(!local15873&&typeof findLoc==="function")local15873=findLoc(raw);}catch(_){ }`;
  const n=body.split(needle).length-1;
  if(n!==1)throw new Error('state camera insertion expected once, found '+n);
  return body.replace(needle,repl);
}

const browser=await chromium.launch({headless:true});
const rows=[];
for(const query of CASES){
  for(let run=1;run<=3;run++){
    const context=await browser.newContext({viewport:{width:1920,height:1080}});
    const page=await context.newPage(); const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
    let loadError=null,timedOut=false; const started=Date.now();
    await page.route('**/*',async route=>{
      const req=route.request();
      if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
        const response=await route.fetch(); let body=await response.text(); body=patchBody(body);
        await route.fulfill({response,body}); return;
      }
      await route.continue();
    });
    try{
      await page.goto(BASE+'?m46_16792='+encodeURIComponent(query)+'_'+run+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForSelector('#searchInput',{timeout:30000});
      await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
      try{
        await page.waitForFunction(q=>{
          const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
          const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
          return /screening published\./i.test(s)&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
        },query,{timeout:45000,polling:100});
      }catch(_){timedOut=true;}
      await page.waitForTimeout(1200);
    }catch(e){loadError=String(e);}

    const snap=loadError?{}:await page.evaluate(()=>({
      mapCenter:(()=>{try{const c=earthlineMap.getCenter();return {lng:c.lng,lat:c.lat,zoom:earthlineMap.getZoom()};}catch(_){return null}})(),
      Mloc:window.M?{lng:M.loc&&M.loc.lng,lat:M.loc&&M.loc.lat,name:M.loc&&M.loc.name,placeType:M.loc&&M.loc.placeType,centerLng:M.centerLng,centerLat:M.centerLat,decision:M.runLocationDecision15873}:null,
      pkg:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
      display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
      vis:window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null
    }));
    const slug=query.toLowerCase()+'-'+run;
    try{await page.screenshot({path:'artifacts/mantra46-16792-state-camera-ab/'+slug+'.png',fullPage:false});}catch(_){}
    const row={query,run,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,mapCenter:snap.mapCenter,Mloc:snap.Mloc,
      pkgCenter:snap.pkg?.center||null,pkgName:snap.pkg?.identity?.name||null,coreMs:snap.perf?.totalMs??null,
      swales:snap.display?.swaleLines??null,rootPass:snap.root?.pass??null,firstFailedStage:snap.root?.firstFailedStage??null};
    rows.push(row); console.log('EARTHLINE_M46_16792_STATE_CAMERA '+JSON.stringify(row));
    await context.close();
  }
}
await browser.close();
writeFileSync('artifacts/mantra46-16792-state-camera-ab/results.json',JSON.stringify(rows,null,2));
if(rows.some(r=>r.loadError||r.timedOut||r.pageErrors.length||!r.mapCenter||!r.pkgCenter||Math.abs(Number(r.mapCenter.lng)-Number(r.pkgCenter.lng))>8||Math.abs(Number(r.mapCenter.lat)-Number(r.pkgCenter.lat))>8))process.exitCode=1;
