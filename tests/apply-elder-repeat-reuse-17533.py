from pathlib import Path

p=Path('earthline-launch-16872.js')
s=p.read_text(encoding='utf-8')
old="dynamic:{worker:null,seq:0,pending:new Map(),key:'',result:null,promise:null,error:null,warmPromise:null,warmed:false,tileWarmKey:'',tileWarmPromise:null}"
new="dynamic:{worker:null,seq:0,pending:new Map(),key:'',result:null,promise:null,error:null,warmPromise:null,warmed:false,tileWarmKey:'',tileWarmPromise:null,completedOnce:false}"
if old not in s: raise SystemExit('dynamic state anchor missing')
s=s.replace(old,new,1)

old2="""        state.dynamic.result=normalized;state.dynamic.error=null;
        return normalized;"""
new2="""        state.dynamic.result=normalized;state.dynamic.error=null;state.dynamic.completedOnce=true;
        return normalized;"""
if old2 not in s: raise SystemExit('result anchor missing')
s=s.replace(old2,new2,1)

old3="""      const pending17166=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      if(pending17166?.state==='property-pending'&&state.dynamic.promise)return pending17166.summary||null;
      await load();
      const pendingAfterLoad17166=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      if(pendingAfterLoad17166?.state==='property-pending'&&state.dynamic.promise)return pendingAfterLoad17166.summary||null;"""
new3="""      const pending17166=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      if(pending17166?.state==='property-pending'&&state.dynamic.promise&&state.dynamic.completedOnce)return pending17166.summary||null;
      await load();
      const pendingAfterLoad17166=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      if(pendingAfterLoad17166?.state==='property-pending'&&state.dynamic.promise&&state.dynamic.completedOnce)return pendingAfterLoad17166.summary||null;"""
if old3 not in s: raise SystemExit('refresh guard anchor missing')
s=s.replace(old3,new3,1)
p.write_text(s,encoding='utf-8')

w=Path('earthline-elder-worker-17129.js')
t=w.read_text(encoding='utf-8')
old4='await py.runPythonAsync(\\`'
old5='\\`);'
if old4 not in t or old5 not in t: raise SystemExit('worker escape anchors missing')
t=t.replace(old4,'await py.runPythonAsync(`',1).replace(old5,'`);',1)
w.write_text(t,encoding='utf-8')
print('installed 17533 repeat-promise reuse + worker syntax fix')