from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
anchor="""    const visualData={runToken,query:q,bounds:b,boundsHash:bHash,contours,flows,swales,recharge:regionalRecharge16492,aquifers:{type:"FeatureCollection",features:(Array.isArray(M.usgsAquifers)?M.usgsAquifers:[]).map((poly,i)=>({type:"Feature",properties:{name:String(poly&&poly.name||"Mapped aquifer context"),source:String(poly&&poly.source||poly&&poly.dataSource||"Mapped groundwater context"),report_context_only:true,index:i},geometry:{type:"Polygon",coordinates:[(poly&&Array.isArray(poly.lngLatPts)?poly.lngLatPts:[]).map(c=>[Number(c[0]),Number(c[1])]).filter(c=>Number.isFinite(c[0])&&Number.isFinite(c[1]))]}})).filter(f=>f.geometry.coordinates[0].length>=3)},generatedAt:new Date().toISOString()};"""
insert=r'''    /* EARTHLINE 16912 — VANCOUVER ISLAND OFFICIAL AQUIFER CONTEXT.
       Vancouver Island Regional only. Uses the Government of British Columbia
       Ground Water Aquifers polygon service and filters returned polygon parts
       against the already-authoritative CGNDB Vancouver Island boundary.
       Existing Regional aquifer source/layers own publication. */
    let vancouverAquiferGeo16912={type:"FeatureCollection",features:[]};
    if(!focusMode&&/vancouver\s+island/i.test(String(q||""))){
      try{
        const boundary16912=selectionBoundary16539||await jurisdictionBoundaryPromise16539;
        if(!boundary16912||!boundary16912.geometry)throw new Error("Vancouver Island authoritative boundary unavailable");
        const bbox16912=(Array.isArray(b)&&b.length===4?b:[-128.4320374,48.3078651,-123.2653903,50.8787003]).map(Number);
        const endpoint16912="https://delivery.maps.gov.bc.ca/arcgis/rest/services/whse/bcgw_pub_whse_water_management/MapServer/48/query";
        const params16912=new URLSearchParams({
          where:"1=1",geometry:bbox16912.join(","),geometryType:"esriGeometryEnvelope",inSR:"4326",
          spatialRel:"esriSpatialRelIntersects",
          outFields:"AQUIFER_ID,NAME,MATERIAL,SUBTYPE,VULNERABILITY,MAPPING_YEAR,AQUIFER_DETAILS_URL",
          returnGeometry:"true",outSR:"4326",geometryPrecision:"5",maxAllowableOffset:"0.0005",f:"geojson"
        });
        const signal16912=(typeof AbortSignal!=="undefined"&&typeof AbortSignal.timeout==="function")?AbortSignal.timeout(9000):undefined;
        const response16912=await fetch(endpoint16912+"?"+params16912.toString(),{mode:"cors",cache:"force-cache",signal:signal16912,headers:{Accept:"application/geo+json,application/json"}});
        if(!response16912.ok)throw new Error("BC aquifer HTTP "+response16912.status);
        const raw16912=await response16912.json();
        const anyInside16912=(ring16912)=>{
          if(!Array.isArray(ring16912))return false;
          const step16912=Math.max(1,Math.floor(ring16912.length/40));
          for(let i16912=0;i16912<ring16912.length;i16912+=step16912){
            const p16912=ring16912[i16912];
            if(Array.isArray(p16912)&&earthlinePointInJurisdiction16539([Number(p16912[0]),Number(p16912[1])],boundary16912.geometry))return true;
          }
          return false;
        };
        const filtered16912=[];
        for(const f16912 of (raw16912&&Array.isArray(raw16912.features)?raw16912.features:[])){
          const g16912=f16912&&f16912.geometry;if(!g16912)continue;
          let geometry16912=null;
          if(g16912.type==="Polygon"){
            if(Array.isArray(g16912.coordinates)&&g16912.coordinates.length&&anyInside16912(g16912.coordinates[0]))geometry16912=g16912;
          }else if(g16912.type==="MultiPolygon"){
            const parts16912=(g16912.coordinates||[]).filter(poly16912=>Array.isArray(poly16912)&&poly16912.length&&anyInside16912(poly16912[0]));
            if(parts16912.length)geometry16912={type:"MultiPolygon",coordinates:parts16912};
          }
          if(!geometry16912)continue;
          const props16912=Object.assign({},f16912.properties||{},{
            name:String(f16912.properties&&f16912.properties.NAME||("BC Aquifer "+String(f16912.properties&&f16912.properties.AQUIFER_ID||""))).trim(),
            source:"Government of British Columbia — Ground Water Aquifers",
            source_tier:"authoritative-provincial",
            report_context_only:true
          });
          filtered16912.push({type:"Feature",properties:props16912,geometry:geometry16912});
        }
        vancouverAquiferGeo16912={type:"FeatureCollection",features:filtered16912};
        if(filtered16912.length){
          try{
            const parsed16912=typeof earthlineParseAquiferFeatures==="function"
              ?earthlineParseAquiferFeatures(vancouverAquiferGeo16912,"geojson",{defaultName:"Mapped BC aquifer",source:"Government of British Columbia — Ground Water Aquifers",aquiferType:"bc-official"})
              :[];
            if(Array.isArray(parsed16912)&&parsed16912.length)M.usgsAquifers=parsed16912;
            M.usgsAquiferStatus="loaded-bc-official";
            if(M.layers&&M.layers.usgsAquifer)M.layers.usgsAquifer.on=true;
          }catch(_){}
          if(!guardedSetGeo(runToken,m,IDS.aquifer,vancouverAquiferGeo16912,"bc-ground-water-aquifers"))return false;
          try{if(m.getLayer(IDS.aquiferFill))m.setLayoutProperty(IDS.aquiferFill,"visibility","visible");}catch(_){}
          try{if(m.getLayer(IDS.aquiferLine))m.setLayoutProperty(IDS.aquiferLine,"visibility","visible");}catch(_){}
        }
        window.EARTHLINE_VANCOUVER_AQUIFER_AUDIT_16912={
          build:"EARTHLINE 16912",runToken,query:String(q||""),source:"Government of British Columbia — Ground Water Aquifers",
          returned:Number(raw16912&&raw16912.features&&raw16912.features.length||0),published:filtered16912.length,
          boundary:"Canadian Geographical Names Database — Vancouver Island (JBRIN)",at:new Date().toISOString()
        };
      }catch(error16912){
        window.EARTHLINE_VANCOUVER_AQUIFER_AUDIT_16912={build:"EARTHLINE 16912",runToken,query:String(q||""),published:0,error:String(error16912&&error16912.message||error16912),at:new Date().toISOString()};
      }
    }
    if(!focusMode&&/vancouver\s+island/i.test(String(q||""))){
      window.EARTHLINE_VANCOUVER_WATER_AUDIT_16912={
        build:"EARTHLINE 16912",runToken,
        waterPaths:(flows.features||[]).filter(f=>f&&f.properties&&f.properties.feature_type==="flow").length,
        directionArrows:(flows.features||[]).filter(f=>f&&f.properties&&f.properties.feature_type==="flow-arrow").length,
        boundaryAudit:genericBoundaryAudit16539||null,at:new Date().toISOString()
      };
    }

''' + anchor
if "EARTHLINE_VANCOUVER_AQUIFER_AUDIT_16912" not in s:
    if anchor not in s: raise SystemExit("visualData anchor missing")
    s=s.replace(anchor,insert,1)
p.write_text(s,encoding="utf-8")
print("patched Vancouver Island official aquifers + water audit")
