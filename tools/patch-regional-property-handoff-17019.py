from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""      const targetParentToken16347=String(chosen&&chosen.parentRunToken||'');
      const activePublishedToken16347=String(window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||'');
      const publishedState16347=String(document.documentElement.dataset.earthlineRunState||'')==='published';
      const validParent16347=parentTier16347==='regional'&&!!displayedToken16347&&displayedToken16347===liveToken16347&&displayedToken16347===targetParentToken16347&&displayedToken16347===activePublishedToken16347&&publishedState16347;
      window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347={build:'EARTHLINE 16347',selectedCode,parentTier:parentTier16347,displayedToken:displayedToken16347||null,liveToken:liveToken16347||null,targetParentToken:targetParentToken16347||null,activePublishedToken:activePublishedToken16347||null,publishedState:publishedState16347,validParent:validParent16347,at:new Date().toISOString()};"""
new="""      let targetParentToken16347=String(chosen&&chosen.parentRunToken||'');
      const activePublishedToken16347=String(window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||'');
      const publishedState16347=String(document.documentElement.dataset.earthlineRunState||'')==='published';
      const currentRegionalParent16347=parentTier16347==='regional'&&!!displayedToken16347&&displayedToken16347===liveToken16347&&displayedToken16347===activePublishedToken16347&&publishedState16347;
      let targetRebound16347=false,targetGeometryMatch16347=false;
      if(currentRegionalParent16347&&targetParentToken16347!==displayedToken16347&&chosen&&Number.isFinite(Number(chosen.lng))&&Number.isFinite(Number(chosen.lat))){
        try{
          const features16347=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
          targetGeometryMatch16347=features16347.some((f16347,index16347)=>{
            const p16347=f16347&&f16347.properties||{},g16347=f16347&&f16347.geometry||null;
            const coords16347=g16347&&g16347.type==='LineString'?g16347.coordinates:(g16347&&g16347.type==='MultiLineString'&&Array.isArray(g16347.coordinates)?g16347.coordinates.slice().sort((a,b)=>(b?.length||0)-(a?.length||0))[0]:null);
            if(!Array.isArray(coords16347)||!coords16347.length)return false;
            const code16347=String(p16347.display_code||p16347.label||((/^[ABC]$/.test(String(p16347.grade||''))?String(p16347.grade):'C')+String(Number(p16347.display_rank||p16347.rank||index16347+1)||index16347+1)));
            if(code16347!==selectedCode)return false;
            const ll16347=coords16347[Math.floor((coords16347.length-1)/2)];
            return Array.isArray(ll16347)&&Math.abs(Number(ll16347[0])-Number(chosen.lng))<1e-7&&Math.abs(Number(ll16347[1])-Number(chosen.lat))<1e-7;
          });
          if(targetGeometryMatch16347){
            targetParentToken16347=displayedToken16347;
            chosen.parentRunToken=displayedToken16347;
            targetRebound16347=true;
          }
        }catch(_){}
      }
      const validParent16347=currentRegionalParent16347&&displayedToken16347===targetParentToken16347;
      window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347={build:'EARTHLINE 17019',selectedCode,parentTier:parentTier16347,displayedToken:displayedToken16347||null,liveToken:liveToken16347||null,targetParentToken:targetParentToken16347||null,activePublishedToken:activePublishedToken16347||null,publishedState:publishedState16347,currentRegionalParent:currentRegionalParent16347,targetGeometryMatch:targetGeometryMatch16347,targetRebound:targetRebound16347,validParent:validParent16347,at:new Date().toISOString()};"""
if s.count(old)!=1:
    raise SystemExit(f"anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("PATCH_OK")
