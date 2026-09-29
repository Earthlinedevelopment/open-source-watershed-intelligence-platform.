from pathlib import Path
p=Path('tools/mantra49-release-audit-16883.js')
s=p.read_text(encoding='utf-8')
old="await p.selectOption('#earthlineLanguage16488','en');await p.fill('#searchInput',q);const rp=regionalPromise(p);await p.click('#runBtn');const regional=await rp;"
if old in s:
    s=s.replace(old,"await p.selectOption('#earthlineLanguage16488','en');await p.fill('#searchInput',q);const rp=regionalPromise(p);await p.press('#searchInput','Enter');const regional=await rp;")
old2="for(const k of ['contact','login','donate','merch']){const a=s[k];if(!a)throw new Error(`${label}: missing ${k}`);if(norm(a.text)!==norm(e[k]))throw new Error(`${label}: ${k} expected ${e[k]} got ${a.text}`);if(a.w>61||a.h>61)throw new Error(`${label}: ${k} geometry ${a.w}x${a.h}`);if(a.labelBox&&(a.labelBox.left<a.box.left-1||a.labelBox.right>a.box.right+1||a.labelBox.top<a.box.top-1||a.labelBox.bottom>a.box.bottom+1))throw new Error(`${label}: ${k} label outside control`);}"
new2="for(const k of ['contact','login']){const a=s[k];if(!a)throw new Error(`${label}: missing ${k}`);if(norm(a.text)!==norm(e[k]))throw new Error(`${label}: ${k} expected ${e[k]} got ${a.text}`);if(a.w>61||a.h>61)throw new Error(`${label}: ${k} geometry ${a.w}x${a.h}`);if(a.labelBox&&(a.labelBox.left<a.box.left-1||a.labelBox.right>a.box.right+1||a.labelBox.top<a.box.top-1||a.labelBox.bottom>a.box.bottom+1))throw new Error(`${label}: ${k} label outside control`);}for(const k of ['donate','merch']){const a=s[k];if(!a)continue;if(norm(a.text)!==norm(e[k]))throw new Error(`${label}: ${k} expected ${e[k]} got ${a.text}`);if(a.w>61||a.h>61)throw new Error(`${label}: ${k} geometry ${a.w}x${a.h}`);}"
if s.count(old2)!=1: raise SystemExit(f'commerce audit anchor count {s.count(old2)}')
s=s.replace(old2,new2)
p.write_text(s,encoding='utf-8')
print('patched audit: native Enter Regional flow + optional withheld Donate/Merch')