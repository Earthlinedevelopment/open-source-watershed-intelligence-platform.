import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';
const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831}});
await installCandidateOrigin(context);
const page=await context.newPage();
await page.goto(BASE+'?az_candidate_component='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(200);}
await page.locator('#searchInput').fill('Arizona');await page.waitForTimeout(900);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();if(await opt.count())await opt.click().catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:150});
const t={lng:-111.93067,lat:34.21568};
await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.59});try{m.fire?.('dragend')}catch(_){}},t);
await page.waitForFunction(t=>{const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;return !!p&&Math.abs(Number(p.lng)-t.lng)<0.00008&&Math.abs(Number(p.lat)-t.lat)<0.00008},t,{timeout:15000,polling:100});
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(prev=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>prev,before,{timeout:90000,polling:120});
const out=await page.evaluate(()=>{
 const md=(typeof M!=='undefined'&&M)||window.M||{}, cov=md.coverageDiagnostic15803||{};
 const mask=new Uint8Array(N);for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++)if(earthlineSafeCell(x,y,4))mask[idx(x,y)]=1;
 const comp=new Int32Array(N);let cid=0;const sizes={};const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
 for(let i=0;i<N;i++){if(!mask[i]||comp[i])continue;cid++;let n=0;const q=[i];comp[i]=cid;for(let qi=0;qi<q.length;qi++){const k=q[qi],x=k%GW,y=Math.floor(k/GW);n++;for(const [dx,dy] of dirs){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const ni=idx(nx,ny);if(mask[ni]&&!comp[ni]){comp[ni]=cid;q.push(ni)}}}sizes[cid]=n;}
 const accepted=(cov?.spatial?.candidates||[]).filter(c=>c.accepted===true).map(c=>{
   const gx=Math.max(0,Math.min(GW-1,Math.round(Number(c.x)))),gy=Math.max(0,Math.min(GH-1,Math.round(Number(c.y)))),component=comp[idx(gx,gy)];
   return {id:c.id,final:c.finalCorridorId15843,x:Number(c.x),y:Number(c.y),component,componentCells:sizes[component]||0,origin:c.candidateOrigin15840,score:c.score};
 });
 const pairs=[];const m=Number(md.cellM||1);
 for(let i=0;i<accepted.length;i++)for(let j=i+1;j<accepted.length;j++)if(accepted[i].component&&accepted[i].component===accepted[j].component){
   pairs.push({a:accepted[i].final,b:accepted[j].final,component:accepted[i].component,dM:Math.hypot(accepted[i].x-accepted[j].x,accepted[i].y-accepted[j].y)*m});
 }
 const nearest=accepted.map(a=>{const ds=pairs.filter(p=>p.a===a.final||p.b===a.final).map(p=>p.dM);return {...a,nearestSameComponentM:ds.length?Math.min(...ds):null}});
 const componentSlopes={};
 for(let i=0;i<N;i++){const c=comp[i];if(!c)continue;const x=i%GW,y=Math.floor(i/GW),v=Number(slopePct(x,y));if(!Number.isFinite(v))continue;(componentSlopes[c]||(componentSlopes[c]=[])).push(v);}
 const componentStats={};
 for(const [k,vals] of Object.entries(componentSlopes)){vals.sort((a,b)=>a-b);const q=p=>vals[Math.min(vals.length-1,Math.max(0,Math.floor((vals.length-1)*p)))];componentStats[k]={n:vals.length,p10:q(.1),p25:q(.25),median:q(.5),p75:q(.75),p90:q(.9),min:vals[0],max:vals[vals.length-1]};}
 const allCandidates=(cov?.spatial?.candidates||[]).map(c=>{
   const gx=Math.max(0,Math.min(GW-1,Math.round(Number(c.x)))),gy=Math.max(0,Math.min(GH-1,Math.round(Number(c.y)))),component=comp[idx(gx,gy)];
   return {id:c.id,final:c.finalCorridorId15843||null,status:c.status||null,reason:c.reason||null,x:Number(c.x),y:Number(c.y),component,componentCells:sizes[component]||0,origin:c.candidateOrigin15840||null,levelIndex:c.levelIndex??null,score:Number(c.score||0),accepted:c.accepted===true};
 });
 return {cellM:m,componentCount:cid,componentSizes:sizes,componentStats,accepted:nearest,pairs,allCandidates,meta:md.swaleMeta||null,stage:md.swaleDiagnostics?.stage||null};
});
console.log('EARTHLINE_AZ_CANDIDATE_COMPONENT '+JSON.stringify(out));
await browser.close();
