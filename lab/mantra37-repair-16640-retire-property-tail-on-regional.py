from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16640 — REGIONAL HANDOFF RETIRES PROPERTY PRESENTATION TAIL'
if marker in s:
    print('16640 already applied')
    raise SystemExit(0)

# 1) The bounded Property post-publish presentation loop already knows how to stop.
old1="""        const tier=String(displayed&&(displayed.tier||displayed.mode)||'').toLowerCase();
        if(serial!==runSerial||Number(md.searchGen||0)!==Number(searchGen)||tier==='regional')return;"""
new1="""        const tier=String(displayed&&(displayed.tier||displayed.mode)||'').toLowerCase();
        /* EARTHLINE 16640 — REGIONAL HANDOFF RETIRES PROPERTY PRESENTATION TAIL.
           15778/15805 already own the tier handoff before Regional camera motion.
           Honor that existing owner here so bounded Property presentation work cannot
           run behind the next Regional terrain pass. No new owner/timer/listener/rule. */
        const regionalOwner16640=window.earthlineRegional15778||null;
        if(serial!==runSerial||Number(md.searchGen||0)!==Number(searchGen)||tier==='regional'||(regionalOwner16640&&regionalOwner16640.active===true&&regionalOwner16640.mode==='regional'))return;"""
if s.count(old1)!=1:
    raise SystemExit(f'guard1 failed count={s.count(old1)}')
s=s.replace(old1,new1,1)

# 2) Stop the separate visibility-settlement tail when the existing Regional owner takes control.
old2="""        if(serial!==runSerial)return;
        const living16262=propertyLivingMapVisible16262(count);"""
new2="""        const regionalOwner16640b=window.earthlineRegional15778||null;
        if(serial!==runSerial||(regionalOwner16640b&&regionalOwner16640b.active===true&&regionalOwner16640b.mode==='regional'))return;
        const living16262=propertyLivingMapVisible16262(count);"""
if s.count(old2)!=1:
    raise SystemExit(f'guard2 failed count={s.count(old2)}')
s=s.replace(old2,new2,1)

# 3) Property basemap settlement is minified differently in this lineage. Match the
# exact existing owner/function rather than formatting whitespace.
pat=r"(function earthlineSettlePropertyBasemap16348\(reason='property-frame'\)\{.*?const sample=\(label\)=>\{\s*try\{)"
matches=list(re.finditer(pat,s,re.S))
if len(matches)!=1:
    raise SystemExit(f'guard3 failed count={len(matches)}')
insert="""
        const regionalOwner16640c=window.earthlineRegional15778||null;
        if(regionalOwner16640c&&regionalOwner16640c.active===true&&regionalOwner16640c.mode==='regional'){
          if(!audit.retiredAt){audit.retiredAt=new Date().toISOString();audit.retiredReason='regional-owner-handoff-16640';}
          return null;
        }"""
m=matches[0]
s=s[:m.end()]+insert+s[m.end():]

if s.count(marker)!=1:
    raise SystemExit('post-guard failed: marker count != 1')
if s.count('regional-owner-handoff-16640')!=1:
    raise SystemExit('post-guard failed: basemap retirement marker count != 1')
p.write_text(s,encoding='utf-8')
print('16640 applied: existing Regional owner now retires all bounded Property presentation tails immediately')
