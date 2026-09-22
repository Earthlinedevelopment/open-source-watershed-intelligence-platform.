import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Iowa','Arkansas','Oklahoma','Nebraska','Vermont','Texas','Florida','Louisiana','California','New York','Maryland','Colorado'];
const OUT='artifacts/mantra46-16795-fine-coverage-12';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const rows=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    const req=route.request();
    if(req.resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();
    const old="try{earthlineStandardAudit16784({tier:focusMode?'focus':'regional',runToken,query:q,hy,stage:'core-published'});}catch(_){ }";
    const neu="try{window.__EARTHLINE_M46_HY_16795=hy;earthlineStandardAudit16784({tier:focusMode?'focus':'regional',runToken,query:q,hy,stage:'core-published'});}catch(_){ }";
    const count=body.split(old).length-1;
    if(count!==1)throw new Error('capture insertion owner count='+count);
    body=body.replace(old,neu);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();

  try{
    await page.goto(BASE+'?m46_fine12='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_HY_16795&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:55000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(600);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const hy=window.__EARTHLINE_M46_HY_16795;
    const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const swales=visual?.swales?.features||[];

    const values=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    const channel=values.length?values[Math.max(0,Math.min(values.length-1,Math.floor((values.length-1)*.972)))]:Infinity;
    const toGrid=(ll)=>{
      if(!Array.isArray(ll)||ll.length<2||!Array.isArray(hy.bounds)||hy.bounds.length<4)return null;
      const [w,s,e,n]=hy.bounds,lng=Number(ll[0]),lat=Number(ll[1]);
      if(!Number.isFinite(lng)||!Number.isFinite(lat)||e===w||n===s)return null;
      return {x:(lng-w)/(e-w)*Math.max(1,hy.w-1),y:(n-lat)/(n-s)*Math.max(1,hy.h-1)};
    };

    const nx=24,ny=24,bins=[];
    for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opportunity:0,preferred:0,covered:false});
    const binAt=(x,y)=>bins[Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))))*nx+Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))))];

    for(let y=0;y<hy.h;y++)for(let x=0;x<hy.w;x++){
      const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;
      const b=binAt(x,y);b.valid++;
      const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);
      if(!Number.isFinite(sp)||!Number.isFinite(ac)||ac>=channel)continue;
      if(sp>=.05&&sp<=4)b.opportunity++;
      if(sp>=.20&&sp<=4)b.preferred++;
    }

    const mark=(x,y)=>{if(Number.isFinite(x)&&Number.isFinite(y))binAt(x,y).covered=true};
    for(const f of swales){
      const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;
      if(!Array.isArray(c)||!c.length)continue;
      for(let i=0;i<c.length;i++){
        const g=toGrid(c[i]);if(g)mark(g.x,g.y);
        if(i===0)continue;
        const a=toGrid(c[i-1]),b=toGrid(c[i]);if(!a||!b)continue;
        const dx=b.x-a.x,dy=b.y-a.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));
        for(let s=1;s<steps;s++){const t=s/steps;mark(a.x+dx*t,a.y+dy*t);}
      }
    }

    const qualified=bins.filter(b=>b.valid>=5&&b.opportunity>=2&&(b.opportunity/Math.max(1,b.valid))>=.18);
    const unserved=qualified.filter(b=>!b.covered);
    const preferredQualified=qualified.filter(b=>b.preferred>=2);
    const preferredUnserved=preferredQualified.filter(b=>!b.covered);

    const set=new Set(unserved.map(b=>b.bx+','+b.by)),seen=new Set(),sizes=[];
    for(const b of unserved){
      const k0=b.bx+','+b.by;if(seen.has(k0))continue;
      let size=0;const q=[b];seen.add(k0);
      while(q.length){
        const cur=q.shift();size++;
        for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
          if(!ox&&!oy)continue;
          const x=cur.bx+ox,y=cur.by+oy,k=x+','+y;
          if(x<0||x>=nx||y<0||y>=ny||!set.has(k)||seen.has(k))continue;
          seen.add(k);q.push(bins[y*nx+x]);
        }
      }
      sizes.push(size);
    }
    sizes.sort((a,b)=>b-a);

    return {
      hy:{w:hy.w,h:hy.h},
      swales:swales.length,
      qualified:qualified.length,
      coveredQualified:qualified.length-unserved.length,
      unserved:unserved.length,
      coverageRatio:qualified.length?Number(((qualified.length-unserved.length)/qualified.length).toFixed(4)):null,
      preferredQualified:preferredQualified.length,
      preferredUnserved:preferredUnserved.length,
      preferredCoverageRatio:preferredQualified.length?Number(((preferredQualified.length-preferredUnserved.length)/preferredQualified.length).toFixed(4)):null,
      largestGapCluster:sizes[0]||0,
      secondGapCluster:sizes[1]||0,
      clusters:sizes.length
    };
  });

  const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};
  rows.push(row);
  console.log('EARTHLINE_M46_FINE12 '+JSON.stringify(row));
  await context.close();
}

await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
console.log('EARTHLINE_M46_FINE12_SUMMARY '+JSON.stringify(rows.map(r=>({query:r.query,...(r.audit||{}),timedOut:r.timedOut,pageErrors:r.pageErrors}))));
