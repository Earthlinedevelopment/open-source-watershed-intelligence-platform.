from pathlib import Path
p=Path('tools/mantra49-release-audit-16883.js')
s=p.read_text(encoding='utf-8')
old="await p.selectOption('#earthlineLanguage16488','en');await p.fill('#searchInput',q);const rp=regionalPromise(p);"
new="await p.selectOption('#earthlineLanguage16488','en');await p.fill('#searchInput',q);await p.press('#searchInput','Escape');await p.waitForTimeout(180);const rp=regionalPromise(p);"
if s.count(old)!=1: raise SystemExit(f'audit anchor count {s.count(old)}')
p.write_text(s.replace(old,new),encoding='utf-8')
print('patched audit to close search suggestions before Run Analysis')
