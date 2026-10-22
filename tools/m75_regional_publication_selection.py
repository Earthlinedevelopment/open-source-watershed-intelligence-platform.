from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(errors='strict')

old="""    const visualData={runToken,query:q,bounds:b,boundsHash:bHash,contours,flows,swales,recharge:regionalRecharge16492,aquifers:{type:"FeatureCollection",features:(Array.isArray(M.usgsAquifers)?M.usgsAquifers:[]).map((poly,i)=>({type:"Feature",properties:{name:String(poly&&poly.name||"Mapped aquifer context"),source:String(poly&&poly.source||poly&&poly.dataSource||"Mapped groundwater context"),report_context_only:true,index:i},geometry:{type:"Polygon",coordinates:[(poly&&Array.isArray(poly.lngLatPts)?poly.lngLatPts:[]).map(c=>[Number(c[0]),Number(c[1])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]))]}})).filter(f=>f.geometry.coordinates[0].length>=3)},generatedAt:new Date().toISOString()};"""
new="""    const publishedSwales17700=focusMode?swales:(()=>{
      const src=Array.isArray(swales&&swales.features)?swales.features.slice():[];
      const west=Number(b[0]),south=Number(b[1]),east=Number(b[2]),north=Number(b[3]);
      const binsX=6,binsY=6;
      const scoreOf=f=>{
        const p=f&&f.properties||{};
        const grade=String(p.grade||'').toUpperCase();
        const gradeBoost=grade==='A'?300:(grade==='B'?200:(grade==='C'?100:0));
        return gradeBoost+Number(p.score||p.rank_score||p.priority||0);
      };
      const midpoint=f=>{
        const g=f&&f.geometry,c=g&&g.type==='LineString'?g.coordinates:null;
        if(!Array.isArray(c)||!c.length)return null;
        return c[Math.floor((c.length-1)/2)];
      };
      const rows=src.map((f,i)=>({f,i,score:scoreOf(f),mid:midpoint(f)}))
        .filter(r=>r.mid&&Number.isFinite(Number(r.mid[0]))&&Number.isFinite(Number(r.mid[1])))
        .sort((a,b)=>b.score-a.score||a.i-b.i);
      const perBin=new Map(),selected=[];
      for(const r of rows){
        const x=Math.max(0,Math.min(binsX-1,Math.floor((Number(r.mid[0])-west)/Math.max(1e-9,east-west)*binsX)));
        const y=Math.max(0,Math.min(binsY-1,Math.floor((Number(r.mid[1])-south)/Math.max(1e-9,north-south)*binsY)));
        const key=x+','+y;
        if(perBin.has(key))continue;
        perBin.set(key,true);selected.push(r.f);
        if(selected.length>=32)break;
      }
      if(selected.length<12){
        for(const r of rows){
          if(selected.includes(r.f))continue;
          selected.push(r.f);
          if(selected.length>=Math.min(24,rows.length))break;
        }
      }
      window.EARTHLINE_REGIONAL_PUBLICATION_SELECTION_17700={
        build:'EARTHLINE 17700',runToken,
        generatedCandidates:src.length,publishedCorridors:selected.length,
        method:'score-ranked one-per-6x6-terrain-sector; candidate pool retained internally',
        at:new Date().toISOString()
      };
      return {type:'FeatureCollection',features:selected};
    })();
    const visualData={runToken,query:q,bounds:b,boundsHash:bHash,contours,flows,swales:publishedSwales17700,recharge:regionalRecharge16492,aquifers:{type:"FeatureCollection",features:(Array.isArray(M.usgsAquifers)?M.usgsAquifers:[]).map((poly,i)=>({type:"Feature",properties:{name:String(poly&&poly.name||"Mapped aquifer context"),source:String(poly&&poly.source||poly&&poly.dataSource||"Mapped groundwater context"),report_context_only:true,index:i},geometry:{type:"Polygon",coordinates:[(poly&&Array.isArray(poly.lngLatPts)?poly.lngLatPts:[]).map(c=>[Number(c[0]),Number(c[1])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]))]}})).filter(f=>f.geometry.coordinates[0].length>=3)},generatedAt:new Date().toISOString()};"""
if s.count(old)!=1: raise SystemExit(f'VISUAL_DATA_COUNT={s.count(old)}')
s=s.replace(old,new,1)

old2="const swaleCount=swales.features.length;"
new2="const swaleCount=publishedSwales17700.features.length;"
if s.count(old2)!=1: raise SystemExit(f'SWALE_COUNT_COUNT={s.count(old2)}')
s=s.replace(old2,new2,1)

p.write_text(s)
print('EARTHLINE_M75_REGIONAL_PUBLICATION_SELECTION_OK')
