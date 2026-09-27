from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="const ring=document.querySelector('.earthline-recharge-gauge-ring-16488'),value=document.getElementById('earthlineRechargePotentialValue16488');if(ring&&value){const q=String(value.textContent||'').trim();ring.setAttribute('aria-label',q==='—%'?t.recharge+' '+t.notCalculated:t.recharge+' '+q)}"
new="const ring=document.querySelector('.earthline-recharge-gauge-ring-16488'),scoreValue=document.getElementById('earthlineRechargePotentialValue16488');if(ring&&scoreValue){const q=String(scoreValue.textContent||'').trim();ring.setAttribute('aria-label',q==='—%'?t.recharge+' '+t.notCalculated:t.recharge+' '+q)}"
if s.count(old)!=1:
    raise SystemExit(f'expected one language gauge variable block, found {s.count(old)}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('16848 value-shadow syntax repair applied')
