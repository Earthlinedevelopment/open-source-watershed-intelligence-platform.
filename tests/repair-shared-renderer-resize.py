from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
old_state="let lastData=null,scheduled=0,installed=false;"
new_state="let lastData=null,scheduled=0,installed=false,lastResizeRunToken16020='';"
old_render="function render(data){lastData=data||lastData;if(!lastData)return false;const map=m(),el=overlay();if(!map||!el)return false;const h=host(),w=Math.max(1,h.clientWidth||window.innerWidth),hh=Math.max(1,h.clientHeight||window.innerHeight);el.setAttribute('viewBox','0 0 '+w+' '+hh);el.replaceChildren();"
new_render="function render(data){lastData=data||lastData;if(!lastData)return false;const map=m(),el=overlay();if(!map||!el)return false;const resizeRunToken16020=String(lastData&&lastData.runToken||'');if(resizeRunToken16020&&resizeRunToken16020!==lastResizeRunToken16020){lastResizeRunToken16020=resizeRunToken16020;try{map.resize&&map.resize();}catch(_){}}const h=host(),w=Math.max(1,h.clientWidth||window.innerWidth),hh=Math.max(1,h.clientHeight||window.innerHeight);el.setAttribute('viewBox','0 0 '+w+' '+hh);el.replaceChildren();"
for old,new in [(old_state,new_state),(old_render,new_render)]:
    count=s.count(old)
    if count!=1:
        raise SystemExit(f'expected exactly one renderer match, found {count}: {old[:80]}')
    s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('repaired existing Regional renderer: one map-size synchronization per run token')
