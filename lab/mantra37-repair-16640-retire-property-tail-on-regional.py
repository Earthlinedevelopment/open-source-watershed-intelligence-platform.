from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16640 — REGIONAL HANDOFF RETIRES PROPERTY PRESENTATION TAIL'
if marker in s:
    print('16640 already applied')
    raise SystemExit(0)

# 1) The bounded Property post-publish presentation loop already knows how to stop.
# Teach it to honor the existing 15778 owner immediately, rather than waiting for
# the displayed snapshot to change to Regional after publication.
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

# 2) Stop the separate visibility-settlement tail as soon as the same existing
# Regional owner has taken control.
old2="""        if(serial!==runSerial)return;
        const living16262=propertyLivingMapVisible16262(count);"""
new2="""        const regionalOwner16640b=window.earthlineRegional15778||null;
        if(serial!==runSerial||(regionalOwner16640b&&regionalOwner16640b.active===true&&regionalOwner16640b.mode==='regional'))return;
        const living16262=propertyLivingMapVisible16262(count);"""
if s.count(old2)!=1:
    raise SystemExit(f'guard2 failed count={s.count(old2)}')
s=s.replace(old2,new2,1)

# 3) Property basemap settlement uses finite delayed samples plus one-shot move/idle
# callbacks. Make each sample a no-op once 15778 says Regional owns presentation.
old3="""    const sample=(label)=>{
      try{
        const host=mp.getContainer?.(),canvas=mp.getCanvas?.();"""
new3="""    const sample=(label)=>{
      try{
        const regionalOwner16640c=window.earthlineRegional15778||null;
        if(regionalOwner16640c&&regionalOwner16640c.active===true&&regionalOwner16640c.mode==='regional'){
          if(!audit.retiredAt){audit.retiredAt=new Date().toISOString();audit.retiredReason='regional-owner-handoff-16640';}
          return null;
        }
        const host=mp.getContainer?.(),canvas=mp.getCanvas?.();"""
if s.count(old3)!=1:
    raise SystemExit(f'guard3 failed count={s.count(old3)}')
s=s.replace(old3,new3,1)

if s.count(marker)!=1:
    raise SystemExit('post-guard failed: marker count != 1')
p.write_text(s,encoding='utf-8')
print('16640 applied: existing Regional owner now retires all bounded Property presentation tails immediately')
