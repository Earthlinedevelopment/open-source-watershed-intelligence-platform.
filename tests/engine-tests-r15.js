const E=require('../earthline-property-swales.js');
const assert=require('assert');
const W=150,H=150,CELL=2,BBOX=[-93.69,42.125,-93.67,42.135];
function grid(f){const e=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)e[y*W+x]=f(x,y);return {w:W,h:H,cellM:CELL,bbox:BBOX,elev:e};}
const none=()=>new Uint8Array(W*H);
const ok=(built=none(),water=none(),status='features-found')=>({status,sourceTier:'open-data',built,water});
const plane=pct=>grid((x,y)=>100-y*CELL*pct/100+0.05*Math.sin(x/9)); // slopes down to the south, gentle waviness
function cellsOf(out){return out.swales.flatMap(s=>s.geometry.coordinates.map(([lng,lat])=>[Math.round((lng-BBOX[0])/(BBOX[2]-BBOX[0])*W-0.5),Math.round((BBOX[3]-lat)/(BBOX[3]-BBOX[1])*H-0.5)]));}
function minDistToMask(out,mask){let m=Infinity;const cells=[];for(let i=0;i<mask.length;i++)if(mask[i])cells.push([i%W,(i/W)|0]);
  for(const [x,y] of cellsOf(out))for(const [a,b] of cells){const d=Math.hypot(x-a,y-b)*CELL;if(d<m)m=d;}return m;}
const results=[];const T=(name,fn)=>{try{fn();results.push('PASS  '+name);}catch(e){results.push('FAIL  '+name+' — '+e.message);}};

T('gentle 2% land produces swales, all within the rules',()=>{
  const o=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B'});
  assert(o.swales.length>=10,'only '+o.swales.length);
  for(const s of o.swales){const p=s.properties;assert(p.mean_slope_pct<=4&&p.mean_slope_pct>=0.2);assert(p.max_5pt_median_slope_pct<=4);assert(p.length_m>=12);assert(p.tortuosity<=2.15);}
  results.push('      swales '+o.swales.length+' · '+o.message);
});
T('swales are at least 15 ft (4.572 m) apart',()=>{
  const o=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B'});
  const L=o.swales.map(s=>s.geometry.coordinates.map(([lng,lat])=>[(lng-BBOX[0])/(BBOX[2]-BBOX[0])*W*CELL,(BBOX[3]-lat)/(BBOX[3]-BBOX[1])*H*CELL]));
  let min=Infinity;for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++)for(const p of L[i])for(const q of L[j])min=Math.min(min,Math.hypot(p[0]-q[0],p[1]-q[1]));
  assert(min>=4.572-0.01,'min spacing '+min.toFixed(2));results.push('      closest pair '+min.toFixed(2)+' m');
});
T('steep 10% land: zero swales, reason stated (not hidden)',()=>{
  const o=E.run({grid:plane(10),exclusions:ok(),soilGroup:'B'});
  assert.equal(o.swales.length,0);assert(o.rejections.R2>0);assert(/No qualifying swales/.test(o.message));results.push('      '+o.message);
});
T('road: no swale within 10 ft',()=>{
  const road=none();for(let x=0;x<W;x++)for(let y=74;y<77;y++)road[y*W+x]=1;
  const o=E.run({grid:plane(2),exclusions:ok(road),soilGroup:'B'});
  assert(o.swales.length>0);const d=minDistToMask(o,road);assert(d>=3.05-CELL*0.75,'closest '+d);results.push('      closest to road '+d.toFixed(1)+' m');
});
T('mapped stream: no swale within 18 m',()=>{
  const st=none();for(let y=0;y<H;y++)st[y*W+75]=1;
  const o=E.run({grid:plane(2),exclusions:ok(none(),st),soilGroup:'B'});
  assert(o.swales.length>0);const d=minDistToMask(o,st);assert(d>=18-CELL*0.75,'closest '+d);results.push('      closest to stream '+d.toFixed(1)+' m');
});
T('modelled wash (valley): no swale crosses it',()=>{
  const g=grid((x,y)=>100-y*CELL*0.02+Math.abs(x-75)*CELL*0.03); // V-shaped valley along x=75
  const o=E.run({grid:g,exclusions:ok(),soilGroup:'B'});
  const acc=E._internal.flowAccumulation(g.elev,W,H),thr=Math.max(12,Math.round(300/(CELL*CELL)));
  let crossings=0;for(const s of o.swales){const c=s.geometry.coordinates.map(([lng,lat])=>[(lng-BBOX[0])/(BBOX[2]-BBOX[0])*W-0.5,(BBOX[3]-lat)/(BBOX[3]-BBOX[1])*H-0.5]);
    for(let k=1;k<c.length;k++){if((c[k-1][0]-75)*(c[k][0]-75)<=0){const y=Math.round((c[k-1][1]+c[k][1])/2);if(acc[y*W+75]>=thr)crossings++;}}}
  assert.equal(crossings,0,crossings+' cross the wash where flow concentrates');results.push('      swales '+o.swales.length+', crossing the wash where flow concentrates: 0');
});
T('isolated rock or tree bumps do not remove swales',()=>{
  const g=plane(2);for(let k=0;k<40;k++){const x=(k*37)%W,y=(k*53)%H;g.elev[y*W+x]+=1.2;}
  const o=E.run({grid:g,exclusions:ok(),soilGroup:'B'});assert(o.swales.length>=5,'only '+o.swales.length);
});
T('soil group D fails drawdown: zero swales with reason',()=>{
  const o=E.run({grid:plane(2),exclusions:ok(),soilGroup:'D'});assert.equal(o.swales.length,0);assert(o.rejections.R13>0);
});
T('soil unknown: swales kept, drawdown "not assessed"',()=>{
  const o=E.run({grid:plane(2),exclusions:ok(),soilGroup:null});assert(o.swales.length>0);assert.equal(o.swales[0].properties.drawdown,'not-assessed');
});
T('road and water data failed: fail closed, zero swales',()=>{
  const o=E.run({grid:plane(2),exclusions:{status:'failed'},soilGroup:'B'});assert.equal(o.swales.length,0);assert.equal(o.status.acquisition,'failed');assert(/unavailable/.test(o.message));
});
T('nothing mapped (screened-clear): swales with the ground-check label',()=>{
  const o=E.run({grid:plane(2),exclusions:ok(none(),none(),'screened-clear'),soilGroup:'B'});assert(o.swales.length>0);assert(/check on the ground/.test(o.message));
});
T('five identical runs give identical ids and hash',()=>{
  const hs=new Set();for(let k=0;k<5;k++)hs.add(E.run({grid:plane(2),exclusions:ok(),soilGroup:'B'}).determinismHash);assert.equal(hs.size,1);
});
T('orientation: ditch on the uphill side',()=>{
  const o=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B'});assert(o.swales.every(s=>s.properties.orientation!=='ambiguous'));
});

T('v1.1: coverage explanation adds up to the property area',()=>{
  const road=none();for(let x=0;x<W;x++)for(let y=74;y<77;y++)road[y*W+x]=1;
  const o=E.run({grid:plane(2),exclusions:ok(road),soilGroup:'B'});const c=o.evidence.coverage,e=c.excluded;
  assert.equal(e.line+e.built+e.water+e.channel+e.slopeOver4+c.buildableCells,c.insideCells);assert(e.built>0);
  results.push('      coverage '+JSON.stringify(c));
});
T('v1.1: page-drawn channel mask is honoured (union, never replaced)',()=>{
  const ch=none();for(let y=0;y<H;y++)ch[y*W+40]=1;
  const o=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B',channelMask:ch});
  let minD=Infinity;for(const [x,y] of cellsOf(o))minD=Math.min(minD,Math.abs(x-40)*CELL);
  assert(o.swales.length>0);assert(minD>=CELL*2-0.01,'closest to drawn channel '+minD);results.push('      closest to drawn channel '+minD.toFixed(1)+' m');
});
T('v1.1: channelAreaM2 input changes the channel definition and is reported',()=>{
  const a=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B',channelAreaM2:300}),b=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B',channelAreaM2:2500});
  assert(a.evidence.channelAreaM2<b.evidence.channelAreaM2);assert(a.evidence.channelCells.own>=b.evidence.channelCells.own);
});
T('v1.1: setback never rounds below one cell on coarse grids',()=>{
  const CW=210,CH=146,C=5,e=new Float32Array(CW*CH);for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)e[y*CW+x]=100-y*C*0.02+0.05*Math.sin(x/9);
  const road=new Uint8Array(CW*CH);for(let x=0;x<CW;x++)road[70*CW+x]=1;
  const o=E.run({grid:{w:CW,h:CH,cellM:C,bbox:[-93.69,42.12,-93.67,42.135],elev:e},exclusions:{status:'features-found',sourceTier:'open-data',built:road,water:new Uint8Array(CW*CH)},soilGroup:'B'});
  let m=Infinity;for(const s of o.swales)for(const [lng,lat] of s.geometry.coordinates){const gy=(42.135-lat)/(0.015)*CH-0.5;m=Math.min(m,Math.abs(gy-70)*C);}
  assert(o.swales.length>0&&m>=C-0.01,'closest '+m);results.push('      5 m cells: closest to road '+m.toFixed(1)+' m');
});

T('v1.1: supplied flow accumulation and channel threshold (cells) drive R8; reported',()=>{
  const g=plane(2),acc=new Float32Array(W*H).fill(1);for(let y=0;y<H;y++)acc[y*W+60]=500; // a drawn path along x=60
  const o=E.run({grid:g,exclusions:ok(),soilGroup:'B',flowAccumulation:acc,channelThresholdCells:100});
  let minD=Infinity;for(const [x,y] of cellsOf(o))minD=Math.min(minD,Math.abs(x-60)*CELL);
  assert(o.swales.length>0&&minD>=CELL*1.5,'closest '+minD);assert.equal(o.evidence.accumulationSource,'supplied');assert.equal(o.evidence.channelThresholdCells,100);
  results.push('      supplied accumulation: closest to path '+minD.toFixed(1)+' m, '+o.swales.length+' swales');
});
// ---- R14 (PROPOSED): terrain relief gate. Flat ground with elevation-data noise must not produce swales. ----
function rng14(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gauss14(r){let u=0,v=0;while(!u)u=r();while(!v)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function flatNoisy(tiltPct,sigma,seed){const r=rng14(seed);return grid((x,y)=>Math.round((100-y*CELL*tiltPct/100+sigma*gauss14(r))/0.1)*0.1);} // 0.1 m steps like terrain-RGB
T('R14: near-flat land (0.05% tilt, 0.05 m noise): zero swales, reason stated, suppressed count reported',()=>{
  let anySuppressed=0;
  for(let seed=1;seed<=5;seed++){
    const o=E.run({grid:flatNoisy(0.05,0.05,seed),exclusions:ok(),soilGroup:'B'});
    assert.equal(o.swales.length,0,'seed '+seed+' published '+o.swales.length);
    assert.equal(o.rejections.R14,1);assert.equal(o.evidence.terrain.gate,'refused');assert(/R14/.test(o.message));
    assert(o.evidence.terrain.reliefM<1);anySuppressed+=o.evidence.terrain.swalesSuppressedByGate;
  }
  assert(anySuppressed>0,'expected the ungated engine to have found swales on at least one noisy seed');
  results.push('      ungated engine would have published '+anySuppressed+' noise swales across 5 seeds');
});
T('R14 off (minReliefM:0) reproduces the ungated result exactly, with the same count reported as suppressed',()=>{
  const g=flatNoisy(0.05,0.05,3);
  const on=E.run({grid:g,exclusions:ok(),soilGroup:'B'}),off=E.run({grid:g,exclusions:ok(),soilGroup:'B',minReliefM:0});
  assert.equal(off.swales.length,on.evidence.terrain.swalesSuppressedByGate);assert(off.swales.length>0);assert.equal(off.evidence.terrain.gate,'pass');
});
T('R14 does not touch land with real relief: 2% plane gives the same swales with the gate on or off',()=>{
  const g=plane(2);const on=E.run({grid:g,exclusions:ok(),soilGroup:'B'}),off=E.run({grid:g,exclusions:ok(),soilGroup:'B',minReliefM:0});
  assert.equal(on.swales.length,off.swales.length);assert.equal(on.determinismHash,off.determinismHash);assert(on.evidence.terrain.reliefM>=1,'relief '+on.evidence.terrain.reliefM);
});
console.log(results.join('\n'));
if(results.some(r=>r.startsWith('FAIL')))process.exit(1);

/* ---- R15: no swales under closed tree canopy (the elevation data there is the treetop surface) ---- */
(function(){
  const R=[];const t=(n,f)=>{try{f();R.push('PASS  '+n);}catch(e){R.push('FAIL  '+n+' — '+e.message);}};
  const forestBand=(x0,x1)=>{const m=new Uint8Array(W*H);for(let y=0;y<H;y++)for(let x=x0;x<x1;x++)m[y*W+x]=1;return m;};
  const inMask=(out,mask)=>cellsOf(out).filter(([x,y])=>x>=0&&y>=0&&x<W&&y<H&&mask[y*W+x]).length;
  t('R15: swales are placed on open ground only; none inside the canopy mask',()=>{
    const f=forestBand(40,110),base=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B'}),o=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B',landcover:f});
    assert(base.swales.length>0&&o.swales.length>0,'counts '+base.swales.length+' -> '+o.swales.length);
    assert.equal(inMask(o,f),0,'swale cells inside canopy');
    assert(o.rejections.R15>0,'R15 not reported');
    assert(o.evidence.canopy.applied===true&&o.evidence.canopy.flaggedCells===f.reduce((a,b)=>a+b,0));
    assert(o.evidence.coverage.excluded.canopy>0);
    R.push('      '+base.swales.length+' swales without canopy data, '+o.swales.length+' with the mask; R15 '+o.rejections.R15);
  });
  t('R15: a property that is all canopy gives zero swales and says why',()=>{
    const f=new Uint8Array(W*H).fill(1),o=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B',landcover:f});
    assert.equal(o.swales.length,0);assert(/R15/.test(o.message)&&/tree canopy covers 100%/.test(o.message),o.message);R.push('      '+o.message);
  });
  t('R15: no canopy data, or excludeClosedCanopy:false, reproduces the pre-R15 result exactly',()=>{
    const f=forestBand(40,110),a=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B'}),b=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B',landcover:f,excludeClosedCanopy:false});
    assert.equal(b.evidence.canopy.applied,false);assert.equal(b.rejections.R15,0);assert.equal(b.evidence.coverage.excluded.canopy,0);assert.equal(a.evidence.canopy.applied,false);
  });
  t('R15: five identical runs with a canopy mask give identical ids and hash',()=>{
    const f=forestBand(20,60),hs=new Set();for(let i=0;i<5;i++)hs.add(E.run({grid:plane(2),exclusions:ok(),soilGroup:'B',landcover:f}).determinismHash);assert.equal(hs.size,1);
  });
  t('R15: a swale never comes within the 1-cell margin of canopy',()=>{
    const f=forestBand(70,80),o=E.run({grid:plane(2),exclusions:ok(),soilGroup:'B',landcover:f});
    let m=Infinity;for(const [x,y] of cellsOf(o))for(let xx=70;xx<80;xx++){m=Math.min(m,Math.abs(x-xx));}
    assert(m>=1,'closest '+m+' cells');R.push('      closest swale cell to canopy '+m+' cell(s)');
  });
  console.log(R.join('\n'));if(R.some(x=>x.startsWith('FAIL')))process.exitCode=1;
})();
