import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const CASES=['Iowa','Arkansas'];
mkdirSync('artifacts/mantra46-16792-footprint-anchor',{recursive:true});

function once(body,name,needle,repl){const n=body.split(needle).length-1;if(n!==1)throw new Error(name+' expected once, found '+n);return body.replace(needle,repl);}
function patchBody(body){
 const old=`              const mg16780=llGrid(hy,mid16780);if(!mg16780||!Number.isFinite(mg16780.x)||!Number.isFinite(mg16780.y))return null;
              const cbx16780=Math.max(0,Math.min(fineNX16780-1,Math.floor(Number(mg16780.x)*fineNX16780/Math.max(1,hy.w))));
              const cby16780=Math.max(0,Math.min(fineNY16780-1,Math.floor(Number(mg16780.y)*fineNY16780/Math.max(1,hy.h))));
              if(cbx16780!==tile16780.row.bx||cby16780!==tile16780.row.by)return null;
              return {segment:seg16780,x:Math.max(1,Math.min(hy.w-2,Math.round(mg16780.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(mg16780.y))),slope:sp16780,acc:0,maxAcc:0,score:Math.max(0,Math.min(1,score16780/100)),confidence:'preferred',minLinePx16632:.75,refined16702:true,fineOpportunity16780:true,tile16702:tile16780.id,tile16780:tile16780.id};`;
 const repl=`              let anchorG16792=null;
              const tryAnchor16792=p16792=>{
                const g16792=llGrid(hy,p16792);if(!g16792||!Number.isFinite(g16792.x)||!Number.isFinite(g16792.y))return false;
                const bx16792=Math.max(0,Math.min(fineNX16780-1,Math.floor(Number(g16792.x)*fineNX16780/Math.max(1,hy.w))));
                const by16792=Math.max(0,Math.min(fineNY16780-1,Math.floor(Number(g16792.y)*fineNY16780/Math.max(1,hy.h))));
                if(bx16792===tile16780.row.bx&&by16792===tile16780.row.by){anchorG16792=g16792;return true;}return false;
              };
              for(let i16792=0;i16792<seg16780.length&&!anchorG16792;i16792++){
                const a16792=seg16780[i16792];tryAnchor16792(a16792);
                if(anchorG16792||i16792===0)continue;
                const b16792=seg16780[i16792-1];if(!Array.isArray(a16792)||!Array.isArray(b16792))continue;
                for(const t16792 of [.25,.5,.75]){if(tryAnchor16792([Number(b16792[0])+(Number(a16792[0])-Number(b16792[0]))*t16792,Number(b16792[1])+(Number(a16792[1])-Number(b16792[1]))*t16792]))break;}
              }
              if(!anchorG16792)return null;
              return {segment:seg16780,x:Math.max(1,Math.min(hy.w-2,Math.round(anchorG16792.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(anchorG16792.y))),slope:sp16780,acc:0,maxAcc:0,score:Math.max(0,Math.min(1,score16780/100)),confidence:'preferred',minLinePx16632:.75,refined16702:true,fineOpportunity16780:true,footprintAnchor16792:true,tile16702:tile16780.id,tile16780:tile16780.id};`;
 return once(body,'fine target anchor',old,repl);
}

const browser=await chromium.launch({headless:true});const results=[];
for(const query of CASES){
 const context=await browser.newContext({viewport:{width:1920,height:1080}});const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
 let loadError=null,timedOut=false;const started=Date.now();
 await page.route('**/*',async route=>{const req=route.request();if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){const response=await route.fetch();let body=await response.text();body=patchBody(body);await route.fulfill({response,body});return;}await route.continue();});
 try{
  await page.goto(BASE+'?m46_16792_anchor='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  try{await page.waitForFunction(q=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''))&&String(window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784?.query||'').toLowerCase().includes(q.toLowerCase()),query,{timeout:45000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(800);
 }catch(e){loadError=String(e);}
 const a=loadError?{}:await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
 try{await page.screenshot({path:'artifacts/mantra46-16792-footprint-anchor/'+query.toLowerCase()+'.png',fullPage:false});}catch(_){}
 const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs:a?.perf?.totalMs??null,generated:a?.pub?.generated??null,visible:a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null,unsafe:a?.flow?.unsafeSegments??null,rootPass:a?.root?.pass??null,candidateCells:a?.spread?.candidateCells??null,finalCells:a?.spread?.finalCells??null,tileBudget:a?.fine?.tileBudget??null,added:a?.fine?.added??null,unresolvedAfter:a?.fine?.unresolvedAfter?.length??null,unresolved:a?.fine?.unresolvedAfter??null,refineMs:a?.fine?.elapsedMs??null,outsideAfterClip:a?.boundary?.outsideAfterClip??null,lastError:a?.lastError||null};
 results.push(row);console.log('EARTHLINE_M46_16792_ANCHOR '+JSON.stringify(row));await context.close();
}
await browser.close();writeFileSync('artifacts/mantra46-16792-footprint-anchor/results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.coreMs)>15000||Number(r.unsafe)!==0||Number(r.generated)!==Number(r.visible)||Number(r.outsideAfterClip?.swales||0)!==0))process.exitCode=1;
