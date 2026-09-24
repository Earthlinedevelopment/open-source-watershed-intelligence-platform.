import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const TARGET={lat:34.74176,lng:-91.91143};
const OUT='artifacts/mantra47-16828-density-quota-ab';
const MODES=[
  {name:'control',enabled:false,minCandidates:99,maxSwaps:0,minSep:99},
  {name:'density3_s6',enabled:true,minCandidates:3,maxSwaps:6,minSep:2},
  {name:'density3_s10',enabled:true,minCandidates:3,maxSwaps:10,minSep:2},
  {name:'density4_s8',enabled:true,minCandidates:4,maxSwaps:8,minSep:2}
];
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];

for(const mode of MODES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document') return route.continue();
    const resp=await route.fetch(); let body=await resp.text();
    const capture='window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;';
    if(body.split(capture).length-1!==1)throw new Error('capture occurrence mismatch');
    if(mode.enabled){
      const patch=`/* EARTHLINE 16828 DIAGNOSTIC — GLOBAL COUNT-NEUTRAL OPPORTUNITY-DENSITY QUOTA */\n`+
`(()=>{\n`+
`  if(focusMode||!chosen.length||!candidates.length)return;\n`+
`  const N16828=18,minC16828=${mode.minCandidates},maxSwaps16828=${mode.maxSwaps},minSep16828=${mode.minSep};\n`+
`  const point16828=c=>{const gx=Number.isFinite(Number(c&&c.coverageGX16775))?Number(c.coverageGX16775):Number(c&&c.x),gy=Number.isFinite(Number(c&&c.coverageGY16775))?Number(c.coverageGY16775):Number(c&&c.y);if(!Number.isFinite(gx)||!Number.isFinite(gy))return null;const fx=Math.max(0,Math.min(N16828-1,Math.floor(gx*N16828/Math.max(1,hy.w)))),fy=Math.max(0,Math.min(N16828-1,Math.floor(gy*N16828/Math.max(1,hy.h))));return {gx,gy,fx,fy,cell:fx+','+fy,parent:Math.floor(fx/3)+','+Math.floor(fy/3)};};\n`+
`  const byCell16828=new Map();for(const c of candidates){const p=point16828(c);if(!p)continue;let a=byCell16828.get(p.cell);if(!a)byCell16828.set(p.cell,a=[]);a.push({c,p});}\n`+
`  for(const a of byCell16828.values())a.sort((u,v)=>(Number(v.c.score)||0)-(Number(u.c.score)||0));\n`+
`  const counts16828=()=>{const cell=new Map(),parent=new Map();for(const c of chosen){const p=point16828(c);if(!p)continue;cell.set(p.cell,(cell.get(p.cell)||0)+1);parent.set(p.parent,(parent.get(p.parent)||0)+1);}return {cell,parent};};\n`+
`  let swaps16828=0,attempts16828=0;const rows16828=[];\n`+
`  while(swaps16828<maxSwaps16828&&attempts16828++<maxSwaps16828*4){\n`+
`    const {cell:chosenCell16828,parent:chosenParent16828}=counts16828();\n`+
`    const wants=[];\n`+
`    for(const [cellKey,a] of byCell16828){if(a.length<minC16828||(chosenCell16828.get(cellKey)||0)>=2)continue;const current=chosen.filter(c=>point16828(c)?.cell===cellKey);let add=null;for(const row of a){if(chosen.includes(row.c))continue;const sep=current.length?Math.min(...current.map(q=>{const qp=point16828(q);return Math.hypot(row.p.gx-qp.gx,row.p.gy-qp.gy);})):999;if(sep>=minSep16828){add={...row,sep};break;}}if(add)wants.push({cell:cellKey,count:a.length,add});}\n`+
`    if(!wants.length)break;\n`+
`    wants.sort((a,b)=>b.count-a.count||(Number(b.add.c.score)||0)-(Number(a.add.c.score)||0)||b.add.sep-a.add.sep);\n`+
`    const want=wants[0];let donor=-1,donorMetric=Infinity;\n`+
`    for(let i=0;i<chosen.length;i++){const c=chosen[i],p=point16828(c);if(!p||p.cell===want.cell)continue;const candN=(byCell16828.get(p.cell)||[]).length;if(candN>2)continue;if((chosenParent16828.get(p.parent)||0)<=3)continue;let nearest=99;for(let j=0;j<chosen.length;j++){if(j===i)continue;const q=point16828(chosen[j]);if(q)nearest=Math.min(nearest,Math.hypot(p.fx-q.fx,p.fy-q.fy));}if(nearest>2.25)continue;const metric=(Number(c.score)||0)+candN*.025-nearest*.015;if(metric<donorMetric){donorMetric=metric;donor=i;}}\n`+
`    if(donor<0)break;const old=chosen[donor];chosen[donor]=want.add.c;swaps16828++;rows16828.push({fromScore:Number(old.score)||0,toScore:Number(want.add.c.score)||0,toCell:want.cell,toCandidates:want.count,separation:want.add.sep});\n`+
`  }\n`+
`  window.EARTHLINE_OPPORTUNITY_DENSITY_REBALANCE_16828={build:'EARTHLINE 16828 DIAGNOSTIC',minCandidates:minC16828,maxSwaps:maxSwaps16828,minSeparation:minSep16828,swaps:swaps16828,rows:rows16828,chosenCount:chosen.length,rule:'count-neutral second corridor in candidate-rich 18x18 cells; donor from <=2-candidate non-isolated cells; donor 6x6 parent retains >=3'};\n`+
`})();\n`;
      body=body.replace(capture,patch+capture);
    }
    body=body.replace(capture,"window.__EARTHLINE_M47_16828_CHAIN={hy,candidates,chosen};"+capture);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  try{
    await page.goto(BASE+`?m47_16828=${mode.name}_${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
    try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.__EARTHLINE_M47_16828_CHAIN;},null,{timeout:65000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(900);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(T=>{
    const {hy,candidates,chosen}=window.__EARTHLINE_M47_16828_CHAIN;
    const rad=x=>x*Math.PI/180;
    const hav=(a,b)=>{const R=6371,dLat=rad(b[1]-a[1]),dLon=rad(b[0]-a[0]),q=Math.sin(dLat/2)**2+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));};
    const target=[T.lng,T.lat];
    const minDist=c=>{let d=Infinity;for(const p of (Array.isArray(c?.segment)?c.segment:[]))if(Array.isArray(p)&&p.length>=2)d=Math.min(d,hav(target,[Number(p[0]),Number(p[1])]));return d;};
    const rows=arr=>(arr||[]).map((c,i)=>({i,c,d:minDist(c)})).filter(r=>Number.isFinite(r.d)).sort((a,b)=>a.d-b.d);
    const summary=rs=>{const counts={};for(const r of [5,10,20,40,80,120])counts[r]=rs.filter(x=>x.d<=r).length;return {total:rs.length,counts,nearest:rs.slice(0,18).map(r=>({d:Number(r.d.toFixed(3)),score:Number(r.c?.score??NaN),x:Number(r.c?.x??NaN),y:Number(r.c?.y??NaN)}))};};
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    return {candidates:summary(rows(candidates)),chosen:summary(rows(chosen)),generated:pub?.generated??null,visible:disp?.swaleLines??pub?.overlaySwaleLines??null,unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip?.swales??null,coreMs:perf?.totalMs??null,density:window.EARTHLINE_OPPORTUNITY_DENSITY_REBALANCE_16828||null};
  },TARGET);
  const result={mode,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};results.push(result);writeFileSync(`${OUT}/${mode.name}.json`,JSON.stringify(result,null,2));
  try{await page.screenshot({path:`${OUT}/arkansas-${mode.name}.png`,fullPage:false});}catch(_){}
  console.log('EARTHLINE_M47_16828 '+JSON.stringify(result));await context.close();
}
writeFileSync(`${OUT}/results.json`,JSON.stringify(results,null,2));await browser.close();
if(results.some(r=>r.loadError||r.timedOut||r.pageErrors.length||!r.audit))process.exitCode=1;
