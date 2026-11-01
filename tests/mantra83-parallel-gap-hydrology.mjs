import {webkit,devices} from 'playwright';

const helper=String.raw`
  const EARTHLINE_HYDRO_POOL_16790=(()=>{
    const src=`
class Heap{constructor(){this.a=[];}push(o){const a=this.a;a.push(o);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p].z<=o.z)break;a[i]=a[p];i=p;}a[i]=o;}pop(){const a=this.a;if(!a.length)return null;const root=a[0],last=a.pop();if(a.length){let i=0;while(true){let l=i*2+1,r=l+1;if(l>=a.length)break;let c=r<a.length&&a[r].z<a[l].z?r:l;if(a[c].z>=last.z)break;a[i]=a[c];i=c;}a[i]=last;}return root;}get length(){return this.a.length;}}
self.onmessage=e=>{
 const {id,elev,w,h,bounds,mask}=e.data,N=w*h,valid=(mask&&mask.length===N)?mask:null;
 const terrain=new Float32Array(elev),filled=new Float32Array(elev),seen=new Uint8Array(N),heap=new Heap();
 if(valid)for(let i=0;i<N;i++)if(!valid[i]){terrain[i]=NaN;filled[i]=0;seen[i]=1;}
 function add(i){if(i<0||i>=N||seen[i]||(valid&&!valid[i]))return;seen[i]=1;heap.push({i,z:filled[i]});}
 const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
 if(valid){for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(!valid[i])continue;let outlet=x===0||y===0||x===w-1||y===h-1;if(!outlet)for(const [dx,dy] of dirs){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h||!valid[yy*w+xx]){outlet=true;break;}}if(outlet)add(i);}}
 else{for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=1;y<h-1;y++){add(y*w);add(y*w+w-1);}}
 while(heap.length){const p=heap.pop(),x=p.i%w,y=(p.i/w)|0;for(const [dx,dy] of dirs){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const j=yy*w+xx;if(seen[j]||(valid&&!valid[j]))continue;seen[j]=1;if(filled[j]<=p.z)filled[j]=p.z+0.01;heap.push({i:j,z:filled[j]});}}
 const mid=(bounds[1]+bounds[3])/2,cellX=(bounds[2]-bounds[0])*111320*Math.cos(mid*Math.PI/180)/(w-1),cellY=(bounds[3]-bounds[1])*111320/(h-1),to=new Int32Array(N);to.fill(-1);
 const slope=new Float32Array(N);if(valid)slope.fill(NaN);
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;if(valid&&!valid[i])continue;let best=-1,bestDrop=0;for(const [dx,dy] of dirs){const j=(y+dy)*w+(x+dx);if(valid&&!valid[j])continue;const dist=Math.hypot(dx*cellX,dy*cellY),drop=(filled[i]-filled[j])/dist;if(drop>bestDrop){bestDrop=drop;best=j;}}to[i]=best;slope[i]=bestDrop*100;}
 const order=[];for(let i=0;i<N;i++)if(!valid||valid[i])order.push(i);order.sort((a,c)=>filled[c]-filled[a]);
 const acc=new Float32Array(N);if(valid){acc.fill(NaN);for(const i of order)acc[i]=1;}else acc.fill(1);
 for(let oi=0;oi<order.length;oi++){const i=order[oi],j=to[i];if(j>=0&&(!valid||valid[j]))acc[j]+=acc[i];}
 self.postMessage({id,filled,to,slope,acc,terrain,cellX,cellY},[filled.buffer,to.buffer,slope.buffer,acc.buffer,terrain.buffer]);
};`;
    const url=URL.createObjectURL(new Blob([src],{type:'text/javascript'})),workers=[],idle=[],pending=new Map(),queue=[];let seq=0;
    const n=Math.max(2,Math.min(4,Number(navigator.hardwareConcurrency)||2));
    function dispatch(){while(idle.length&&queue.length){const w=idle.pop(),task=queue.shift();w.__busy=task.id;pending.set(task.id,{resolve:task.resolve,reject:task.reject,w,meta:task.meta});w.postMessage(task.payload,task.transfer);}}
    for(let i=0;i<n;i++){const w=new Worker(url);w.onmessage=e=>{const row=pending.get(e.data.id);if(!row)return;pending.delete(e.data.id);idle.push(w);const m=row.meta;row.resolve({filled:e.data.filled,to:e.data.to,slope:e.data.slope,acc:e.data.acc,cellX:e.data.cellX,cellY:e.data.cellY,w:m.w,h:m.h,bounds:m.bounds,elev:e.data.terrain,validityMask16584:m.mask});dispatch();};w.onerror=e=>{const id=w.__busy,row=pending.get(id);if(row){pending.delete(id);row.reject(e);}idle.push(w);dispatch();};workers.push(w);idle.push(w);}
    return (dem,mask)=>new Promise((resolve,reject)=>{const id=++seq,elev=new Float32Array(dem.elev),m=mask?new Uint8Array(mask):null;queue.push({id,resolve,reject,meta:{w:dem.w,h:dem.h,bounds:dem.bounds,mask:m},payload:{id,elev,w:dem.w,h:dem.h,bounds:dem.bounds,mask:m},transfer:[elev.buffer,...(m?[m.buffer]:[])]});dispatch();});
  })();
  function earthlineParallelHydrology16790(dem,mask){return EARTHLINE_HYDRO_POOL_16790(dem,mask);}
`;

const browser=await webkit.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13']});
const page=await context.newPage();
await page.route('https://earthlinedevelopment.org/',async route=>{
  const res=await route.fetch();let body=await res.text();
  const anchor='  async function hydrology(dem,validityMask16584=null){';
  if(!body.includes(anchor))throw new Error('hydrology anchor missing');
  body=body.replace(anchor,helper+'\n'+anchor);
  const a='const h16731=await hydrology(d16731,g16731.mask);';
  const b='const h16731=await earthlineParallelHydrology16790(d16731,g16731.mask);';
  const c='const h16741=await hydrology(d16741,g16741.mask);';
  const d='const h16741=await earthlineParallelHydrology16790(d16741,g16741.mask);';
  if(!body.includes(a)||!body.includes(c))throw new Error('gap hydrology call missing');
  body=body.replace(a,b).replace(c,d);
  await route.fulfill({response:res,body});
});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(700);
await page.locator('#searchInput').fill('Vermont');
const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
const t0=Date.now();
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
await page.waitForTimeout(250);
const out=await page.evaluate(t0=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return {ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Math.max(0,...fs.map(f=>Number(f?.properties?.slope_pct)||0)),coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,gap:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null};},t0);
if(out.swales!==81||out.rendered!==324||out.maxSlope>4||!out.coverage?.passed)throw new Error('parallel hydrology output failed '+JSON.stringify(out));
console.log('M83_PARALLEL_HYDROLOGY_PASS '+JSON.stringify(out));
await browser.close();