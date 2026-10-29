import{chromium}from'playwright';import{installCandidateOrigin}from'./candidate-origin-router.mjs';
const b=await chromium.launch({headless:true}),rows=[];
for(let r=1;r<=7;r++){
 const c=await b.newContext({viewport:{width:1600,height:900}});await installCandidateOrigin(c);const p=await c.newPage(),errs=[];p.on('pageerror',e=>errs.push(String(e)));let row={round:r,pass:false};
 try{
  await p.goto('https://earthlinedevelopment.org/?ca-pointer='+r+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});await p.waitForSelector('#searchInput',{timeout:30000});
  await p.locator('#searchInput').fill('California');await p.waitForTimeout(650);const o=p.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/California/i}).first();if(await o.count())await o.click();await p.locator('#runBtn').click();
  await p.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:60000,polling:100});await p.waitForFunction(()=>{const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return v.length>0},{timeout:20000,polling:100});
  const t=await p.evaluate(()=>{const fs=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length).sort((a,b)=>+a.properties?.rank-+b.properties?.rank),f=fs[0],q=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];return{lng:+q[0],lat:+q[1]};});
  await p.evaluate(t=>{const m=window.earthlineMap||earthlineMap;m.jumpTo({center:[t.lng,t.lat],zoom:16.7,bearing:0,pitch:0})},t);await p.waitForTimeout(350);
  const hit=await p.evaluate(()=>{const e=document.getElementById('earthlineDeclareProperty16169'),q=e.getBoundingClientRect(),x=q.left+q.width/2,y=q.top+q.height/2,top=document.elementFromPoint(x,y);return{x,y,topmost:!!top?.closest?.('#earthlineDeclareProperty16169'),disabled:e.disabled,visible:getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'};});
  if(!hit.topmost||hit.disabled||!hit.visible)throw new Error('Property pointer target not actionable '+JSON.stringify(hit));
  const t0=Date.now();await p.mouse.click(hit.x,hit.y);
  await p.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.scientificSettled===true,{timeout:30000,polling:50});
  const scienceMs=Date.now()-t0;
  await p.waitForFunction(()=>{const v=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};return v.visible===true&&+v.renderedFeatures>0},{timeout:10000,polling:50});const visibleMs=Date.now()-t0;
  await p.waitForFunction(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};return e.state==='committed'||e.state==='failed'},{timeout:15000,polling:50});const elderMs=Date.now()-t0;
  const s=await p.evaluate(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},v=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{},e=window.EARTHLINE_ELDER_TREE_LAST_17097||{},m=M,z=m?.safetyAudit15806||{},map=window.earthlineMap||earthlineMap;let er=0;try{er=map.queryRenderedFeatures(undefined,{layers:['earthline-elder-tree-points-17097']}).length}catch(_){}return{corridors:+a.corridors||0,renderVerified:a.renderVerified===true,safeRendered:+v.renderedFeatures||0,elderState:e.state||null,elderCount:+e.featureCount||0,elderRendered:er,accepted:+z.acceptedIntersections||0,road:+z.clearance?.roadIntersections||0,structure:+z.clearance?.structureIntersections||0,water:+z.clearance?.waterIntersections||0,developed:+z.clearance?.developedIntersections||0};});
  row={round:r,scienceMs,visibleMs,elderMs,hit,...s,errs,pass:scienceMs<=15000&&visibleMs<=15000&&elderMs<=15000&&s.corridors>0&&s.safeRendered>0&&s.elderState==='committed'&&(s.elderCount===0||s.elderRendered>0)&&s.accepted===0&&s.road===0&&s.structure===0&&s.water===0&&s.developed===0&&!errs.length};
 }catch(e){row={round:r,pass:false,error:String(e),errs}}
 rows.push(row);console.log('M82_CA_POINTER '+JSON.stringify(row));await c.close();
}
await b.close();console.log('M82_CA_POINTER_SUMMARY '+JSON.stringify({pass:rows.filter(x=>x.pass).length,total:rows.length,maxVisible:Math.max(...rows.map(x=>+x.visibleMs||0)),rows}));if(rows.some(x=>!x.pass))process.exitCode=1;