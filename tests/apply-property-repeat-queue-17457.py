from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_decl="  let running=false,stageTimer=0,runSerial=0;"
new_decl="""  let running=false,stageTimer=0,runSerial=0;
  let queuedRepeatProperty17457=null; /* EARTHLINE 17457 — one moved repeat request may wait for current terminal settle. */"""
if s.count(old_decl)!=1: raise SystemExit(f"running declaration anchor count {s.count(old_decl)}")
s=s.replace(old_decl,new_decl,1)

old_guard="""    if(running)return false;"""
new_guard="""    if(running){
      /* EARTHLINE 17457 — a user may move the crosshair after the first Property
         result is already visible while the terminal owner is still finishing its
         bounded settle. Do not drop that physical press. Queue exactly one moved
         target and launch it only after the current governed run reaches finally.
         Same-target repeat presses remain ignored, so no duplicate analysis is
         created and scientific runs never overlap. */
      try{
        const target17457=window.EARTHLINE_PROPERTY_TARGET_16201||null;
        const current17457=window.EARTHLINE_PROPERTY_DECLARATION_16169?.center||null;
        const lng17457=Number(target17457?.lng),lat17457=Number(target17457?.lat);
        const oldLng17457=Number(current17457?.lng),oldLat17457=Number(current17457?.lat);
        const moved17457=[lng17457,lat17457,oldLng17457,oldLat17457].every(Number.isFinite)&&
          (Math.abs(lng17457-oldLng17457)>1e-7||Math.abs(lat17457-oldLat17457)>1e-7);
        if(moved17457){
          queuedRepeatProperty17457={
            target:JSON.parse(JSON.stringify(target17457)),
            queuedAt:new Date().toISOString()
          };
          window.EARTHLINE_PROPERTY_REPEAT_QUEUE_17457={
            build:'EARTHLINE 17457',state:'queued',
            target:{lng:lng17457,lat:lat17457},
            current:{lng:oldLng17457,lat:oldLat17457},
            at:queuedRepeatProperty17457.queuedAt
          };
          status('Current Property analysis is finishing — the moved 20-acre location is queued and will start automatically.','pending');
          return true;
        }
      }catch(_){}
      return false;
    }"""
if s.count(old_guard)!=1: raise SystemExit(f"running guard anchor count {s.count(old_guard)}")
s=s.replace(old_guard,new_guard,1)

old_final="""    finally{if(serial===runSerial){running=false;document.documentElement.dataset.earthlinePropertyRunState='idle';document.documentElement.classList.remove('earthline-property-running-16233');clearTimers();setButton(false);clearAllBusy();restoreGrab();try{window.getSelection?.()?.removeAllRanges?.();button()?.blur?.()}catch(_){}updateBuild();earthlinePropertyTrace16319("terminal finally","mark",{runState:'idle'});window.EARTHLINE_PROPERTY_TRACE_ACTIVE_16319=false}}"""
new_final="""    finally{if(serial===runSerial){
      running=false;document.documentElement.dataset.earthlinePropertyRunState='idle';document.documentElement.classList.remove('earthline-property-running-16233');clearTimers();setButton(false);clearAllBusy();restoreGrab();try{window.getSelection?.()?.removeAllRanges?.();button()?.blur?.()}catch(_){}updateBuild();earthlinePropertyTrace16319("terminal finally","mark",{runState:'idle'});window.EARTHLINE_PROPERTY_TRACE_ACTIVE_16319=false;
      const queued17457=queuedRepeatProperty17457;
      queuedRepeatProperty17457=null;
      if(queued17457?.target){
        window.EARTHLINE_PROPERTY_TARGET_16201=Object.assign({},queued17457.target,{at:new Date().toISOString(),source:String(queued17457.target.source||'crosshair-repeat-17457')});
        window.EARTHLINE_PROPERTY_REPEAT_QUEUE_17457={
          build:'EARTHLINE 17457',state:'launching',
          target:{lng:Number(queued17457.target.lng),lat:Number(queued17457.target.lat)},
          queuedAt:queued17457.queuedAt,at:new Date().toISOString()
        };
        setTimeout(()=>{
          if(running)return;
          const q17457=window.EARTHLINE_PROPERTY_REPEAT_QUEUE_17457;
          if(q17457)q17457.state='started';
          void terminalPropertyRun();
        },0);
      }
    }}"""
if s.count(old_final)!=1: raise SystemExit(f"terminal finally anchor count {s.count(old_final)}")
s=s.replace(old_final,new_final,1)

s="<!-- EARTHLINE_PROPERTY_REPEAT_QUEUE_17457: one moved repeat Property press queues behind current governed settle; no overlapping runs. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched moved repeat Property queue 17457")
