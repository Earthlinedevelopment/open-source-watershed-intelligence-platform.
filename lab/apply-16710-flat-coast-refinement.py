from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

patch("contour-signature",
"  async function makeContours(hy,candidateQuantile16609=false){",
"  async function makeContours(hy,candidateQuantile16609=false,levelsOverride16710=null){")

patch("contour-levels",
"""    if(candidateQuantile16609){
      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}
    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}""",
"""    if(Array.isArray(levelsOverride16710)&&levelsOverride16710.length){
      const seen16710=new Set();
      for(const raw16710 of levelsOverride16710){const k16710=Math.round(Number(raw16710)*10)/10;if(Number.isFinite(k16710)&&k16710>min&&k16710<max&&!seen16710.has(k16710)){seen16710.add(k16710);levels.push(k16710);}}
    }else if(candidateQuantile16609){
      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}
    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}""")

patch("swale-signature",
"  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null){",
"  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16710=null){")

patch("supplemental-owner",
"    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);",
"""    if(!focusMode&&Array.isArray(supplementalCandidates16710)&&supplementalCandidates16710.length)candidates.push(...supplementalCandidates16710);
    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);""")

needle="""    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);"""

repl="""    let supplementalCandidates16710=[];
    let scaleRefineTrigger16710=false;
    if(!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>=12000&&hy.outsideLandMask16632&&hy.validityMask16584){
      const nearOcean16710=(x,y,r=2)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=hy.w||yy<0||yy>=hy.h)continue;if(hy.outsideLandMask16632[yy*hy.w+xx])return true;}return false;};
      const channel16710=percentile(hy.acc,.972);let coastalCells16710=0,screenPass16710=0;
      for(let y=1;y<hy.h-1;y++)for(let x=1;x<hy.w-1;x++){const i=y*hy.w+x;if(hy.validityMask16584[i]!==1||!nearOcean16710(x,y,2))continue;coastalCells16710++;const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);if(Number.isFinite(sp)&&sp>=.20&&sp<=4&&Number.isFinite(ac)&&ac<channel16710)screenPass16710++;}
      const ratio16710=coastalCells16710?screenPass16710/coastalCells16710:1;
      scaleRefineTrigger16710=coastalCells16710>=50&&ratio16710<=.02;
      window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16710={maxCellM:Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0),coastalCells:coastalCells16710,screenPass:screenPass16710,screenPassRatio:ratio16710,triggered:scaleRefineTrigger16710,rule:'coarse coastal opportunity starvation at >=12 km cells; refined candidates limited to 0.2-4% slope',at:new Date().toISOString()};
    }
    if(scaleRefineTrigger16710){
      const savedLandAudit16710=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584,savedGen16710=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167;
      try{
        const coastCells16710=[];
        const nearOceanCell16710=(x,y,r=2)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=hy.w||yy<0||yy>=hy.h)continue;if(hy.outsideLandMask16632[yy*hy.w+xx])return true;}return false;};
        for(let y=1;y<hy.h-1;y++)for(let x=1;x<hy.w-1;x++){const i=y*hy.w+x;if(hy.validityMask16584[i]===1&&nearOceanCell16710(x,y,2))coastCells16710.push({x,y});}
        coastCells16710.sort((a,b)=>a.y-b.y);
        const parts16710=Math.min(3,Math.max(1,Math.ceil(coastCells16710.length/90))),tiles16710=[];
        for(let part=0;part<parts16710;part++){
          const a=Math.floor(coastCells16710.length*part/parts16710),z=Math.floor(coastCells16710.length*(part+1)/parts16710),group=coastCells16710.slice(a,z);if(!group.length)continue;
          let minX=Math.min(...group.map(p=>p.x)),maxX=Math.max(...group.map(p=>p.x)),minY=Math.min(...group.map(p=>p.y)),maxY=Math.max(...group.map(p=>p.y));
          minX=Math.max(0,minX-4);maxX=Math.min(hy.w-1,maxX+4);minY=Math.max(0,minY-4);maxY=Math.min(hy.h-1,maxY+4);
          const b0=hy.bounds[0],b1=hy.bounds[1],b2=hy.bounds[2],b3=hy.bounds[3],lon=x=>b0+(x/(hy.w-1))*(b2-b0),lat=y=>b3-(y/(hy.h-1))*(b3-b1);
          const tb=[lon(minX),lat(maxY),lon(maxX),lat(minY)];if(tb[2]>tb[0]&&tb[3]>tb[1])tiles16710.push({id:'coast-'+(part+1),b:tb});
        }
        const start16710=performance.now();
        const tileResults16710=await Promise.all(tiles16710.map(async tile=>{
          const d=await loadDEM(tile.b,112,112,6000,'flat-coast refinement '+tile.id),g=earthlineLandValidityMask16584(d,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16710;
          const h=await hydrology(d,g.mask);h.outsideLandMask16632=g.outsideLandMask16632||null;h.inlandWaterMask16632=g.inlandWaterMask16632||null;
          const channel=percentile(h.acc,.972),elevs=[];
          const nearOut=(x,y,r=4)=>{for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=h.w||yy<0||yy>=h.h)continue;if(g.outsideLandMask16632[yy*h.w+xx])return true;}return false;};
          for(let y=1;y<h.h-1;y++)for(let x=1;x<h.w-1;x++){const i=y*h.w+x;if(g.mask[i]!==1||!nearOut(x,y,4))continue;const sp=Number(h.slope[i]),ac=Number(h.acc[i]),el=Number(h.elev[i]);if(Number.isFinite(sp)&&sp>=.20&&sp<=4&&Number.isFinite(ac)&&ac<channel&&Number.isFinite(el))elevs.push(el);}
          elevs.sort((a,b)=>a-b);const levels=[],seen=new Set();if(elevs.length){for(const frac of [.05,.12,.22,.34,.47,.60]){const e=elevs[Math.min(elevs.length-1,Math.floor((elevs.length-1)*frac))],k=Math.round(e*2)/2;if(!seen.has(k)){seen.add(k);levels.push(k);}}}
          const c=await makeContours(h,true,levels),local=await makeSwales(h,c,false,swaleJurisdictionGeometry16539,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16710;
          const dist=ll=>{const gg=llGrid(h,ll);if(!gg||!Number.isFinite(gg.x)||!Number.isFinite(gg.y))return null;const cx=Math.max(0,Math.min(h.w-1,Math.round(gg.x))),cy=Math.max(0,Math.min(h.h-1,Math.round(gg.y)));for(let r=0;r<=30;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const xx=cx+dx,yy=cy+dy;if(xx<0||xx>=h.w||yy<0||yy>=h.h)continue;if(g.outsideLandMask16632[yy*h.w+xx])return r;}return null;};
          const rows=(local.features||[]).map(f=>{const seg=f.geometry&&f.geometry.coordinates||[],mid=seg[Math.floor((seg.length-1)/2)]||null,dd=mid?dist(mid):null,km=Number.isFinite(dd)?dd*Math.max(h.cellX,h.cellY)/1000:null,sp=Number(f.properties&&f.properties.slope_pct);return {f,seg,mid,km,sp};}).filter(r=>Number.isFinite(r.km)&&r.km<=20&&Number.isFinite(r.sp)&&r.sp>=.20&&r.sp<=4).sort((a,b)=>(b.f.properties?.score||0)-(a.f.properties?.score||0));
          const picked=[];for(const r of rows){if(picked.length>=12)break;picked.push(r);}
          return picked.map(r=>{const mg=llGrid(hy,r.mid);return {segment:r.seg,x:Math.max(1,Math.min(hy.w-2,Math.round(mg.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(mg.y))),slope:r.sp,acc:0,maxAcc:0,score:Math.max(0,Math.min(1,Number(r.f.properties?.score||0)/100)),confidence:'preferred',minLinePx16632:4,refined16710:true,coastKm16710:Number(r.km.toFixed(1)),tile16710:tile.id};});
        }));
        const raw=tileResults16710.flat().sort((a,b)=>(Number(b.score)||0)-(Number(a.score)||0)||(Number(a.coastKm16710)||Infinity)-(Number(b.coastKm16710)||Infinity)),seenMain=new Set();
        for(const c of raw){const k=String(c.x)+','+String(c.y);if(seenMain.has(k))continue;seenMain.add(k);supplementalCandidates16710.push(c);}
        window.EARTHLINE_SCALE_REFINED_INPUT_16710={tiles:tiles16710.length,rawInput:raw.length,input:supplementalCandidates16710.length,elapsedMs:Math.round(performance.now()-start16710),rows:supplementalCandidates16710.map(c=>({x:c.x,y:c.y,slope:c.slope,score:c.score,coastKm:c.coastKm16710,tile:c.tile16710}))};
      }catch(e){window.EARTHLINE_SCALE_REFINED_INPUT_16710={error:String(e)};}
      finally{window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16710;window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16710;}
    }
    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16710);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);"""

patch("regional-refinement-call",needle,repl)

p.write_text(s,encoding="utf-8")
print("16710 applied")
