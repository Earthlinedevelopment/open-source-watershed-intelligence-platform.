import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';
const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831}});
await installCandidateOrigin(context);
const page=await context.newPage();
await page.goto(BASE+'?az_component_spacing='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click()); await page.waitForTimeout(200);
}
await page.locator('#searchInput').fill('Arizona'); await page.waitForTimeout(900);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click().catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:150});
const target={lng:-111.93067,lat:34.21568};
await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.59});try{m.fire?.('dragend')}catch(_){}},target);
await page.waitForFunction(t=>{const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;return !!p&&Math.abs(Number(p.lng)-t.lng)<0.00008&&Math.abs(Number(p.lat)-t.lat)<0.00008},target,{timeout:15000,polling:100});
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(prev=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>prev,before,{timeout:90000,polling:120});
await page.waitForTimeout(500);
const result=await page.evaluate(()=>{
  const md=(typeof M!=='undefined'&&M)||window.M||{};
  const mask=new Uint8Array(N);
  for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++) if(earthlineSafeCell(x,y,4))mask[idx(x,y)]=1;
  const comp=new Int32Array(N);let cid=0;const sizes={};
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  for(let i=0;i<N;i++){
    if(!mask[i]||comp[i])continue;cid++;let n=0;const q=[i];comp[i]=cid;
    for(let qi=0;qi<q.length;qi++){const k=q[qi],x=k%GW,y=Math.floor(k/GW);n++;
      for(const [dx,dy] of dirs){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const ni=idx(nx,ny);if(mask[ni]&&!comp[ni]){comp[ni]=cid;q.push(ni)}}
    }
    sizes[cid]=n;
  }
  const sw=Array.isArray(md?.swales)?md.swales:[];
  const rows=sw.map((f,i)=>{
    const pts=Array.isArray(f?.pts)?f.pts:[];
    const p=pts[Math.floor((pts.length-1)/2)]||null;
    const g=p?{x:Math.max(0,Math.min(GW-1,Math.round(Number(p[0])))),y:Math.max(0,Math.min(GH-1,Math.round(Number(p[1]))))}:null;
    const component=g?comp[idx(g.x,g.y)]:0;
    return {i,id:f?.id||null,grid:g,component,componentCells:sizes[component]||0,pts};
  });
  const gridDistanceM=(a,b)=>{
    let best=Infinity;
    for(const p of a.pts||[])for(const q of b.pts||[]){
      const d=Math.hypot(Number(p[0])-Number(q[0]),Number(p[1])-Number(q[1]))*Math.max(.001,Number(M.cellM||1));
      if(d<best)best=d;
    }
    return best;
  };
  const pair=[];
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++) if(rows[i].component&&rows[i].component===rows[j].component) pair.push({a:rows[i].id,b:rows[j].id,component:rows[i].component,dM:gridDistanceM(rows[i],rows[j])});
  const nearest=rows.map(r=>{const ps=pair.filter(p=>p.a===r.id||p.b===r.id).map(p=>p.dM);return {...r,nearestSameComponentM:ps.length?Math.min(...ps):null}});
  return {componentCount:cid,componentSizes:sizes,swales:nearest,pairs:pair,meta:md.swaleMeta||null};
});
console.log('EARTHLINE_AZ_COMPONENT_SPACING '+JSON.stringify(result));
await browser.close();
