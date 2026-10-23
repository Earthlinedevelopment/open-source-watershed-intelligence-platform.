from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")

old1="""    if(!mp||!active||count<1){clearSafePropertyFallback16221(reason+':inactive-or-empty');return {ok:count===0&&active,count,visible:false,active,error:!mp?'map unavailable':(!active?'property display inactive':'verified zero-corridor result')}}
    const ensured=ensureSafePropertyLayers16221();"""
new1="""    if(!mp||!active||count<1){clearSafePropertyFallback16221(reason+':inactive-or-empty');return {ok:count===0&&active,count,visible:false,active,error:!mp?'map unavailable':(!active?'property display inactive':'verified zero-corridor result')}}
    const livingNow16291=propertyLivingMapVisible16262(count);
    if(livingNow16291.ok){
      setSafeLayerVisibility16221(false);
      window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221={build:BUILD,reason:reason+':living-owner-active',active:true,verified:true,count,visible:false,delegatedTo:'living-swales-15792',living:livingNow16291,at:new Date().toISOString()};
      return {ok:true,count,visible:false,active,delegatedToLiving:true,living:livingNow16291};
    }
    const ensured=ensureSafePropertyLayers16221();"""
if s.count(old1)!=1: raise SystemExit("SYNC_INSERT_COUNT="+str(s.count(old1)))
s=s.replace(old1,new1,1)

old2="""    for(const delay of [0,90,260,620,1300,2600]){"""
new2="""    for(const delay of [320,700,1400,2600]){"""
if s.count(old2)!=1: raise SystemExit("SCHEDULE_COUNT="+str(s.count(old2)))
s=s.replace(old2,new2,1)

old3="""    const first=syncSafePropertyFallback16221('terminal-immediate-16260');
    if(first.ok)return {...first,required:true,pending:false};
    scheduleSafePropertyFallback16221('terminal-background-16260');
    return {...first,ok:false,count,visible:false,required:true,pending:true};"""
new3="""    const livingImmediate16291=propertyLivingMapVisible16262(count);
    if(livingImmediate16291.ok){
      setSafeLayerVisibility16221(false);
      return {ok:true,count,visible:false,required:true,pending:false,delegatedToLiving:true,living:livingImmediate16291};
    }
    await new Promise(resolve=>setTimeout(resolve,320));
    const livingGrace16291=propertyLivingMapVisible16262(count);
    if(livingGrace16291.ok){
      setSafeLayerVisibility16221(false);
      return {ok:true,count,visible:false,required:true,pending:false,delegatedToLiving:true,living:livingGrace16291};
    }
    const first=syncSafePropertyFallback16221('terminal-after-living-grace-16291');
    if(first.ok)return {...first,required:true,pending:false};
    scheduleSafePropertyFallback16221('terminal-background-16291');
    return {...first,ok:false,count,visible:false,required:true,pending:true};"""
if s.count(old3)!=1: raise SystemExit("VERIFY_COUNT="+str(s.count(old3)))
s=s.replace(old3,new3,1)

p.write_text(s)
print("EARTHLINE_PROPERTY_OWNER_PATCH_OK")
