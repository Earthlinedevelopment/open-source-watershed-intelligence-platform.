from pathlib import Path
p=Path("earthline-language-hotfix-16890.js")
s=p.read_text(encoding="utf-8")
old="""function ensureLanguageOptions(){
  const sel=document.getElementById('earthlineLanguage16488');
  if(!sel)return;"""
new="""function ensureLanguageOptions(){
  let sel=document.getElementById('earthlineLanguage16488');
  if(!sel){
    const rail=document.getElementById('earthlineRail16188');
    if(!rail)return;
    let wrap=document.getElementById('earthlineLanguageWrap16488');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id='earthlineLanguageWrap16488';
      wrap.className='el-rail-control-16188 earthline-language-wrap-16488';
      wrap.setAttribute('aria-label','Language');
      wrap.style.cssText='display:flex;align-items:center;justify-content:center;padding:4px 2px;min-height:42px';
      const data=document.getElementById('earthlineRailData16488');
      const contact=document.getElementById('earthlineRailContact16512');
      if(contact&&contact.parentElement===rail)rail.insertBefore(wrap,contact);
      else if(data&&data.parentElement===rail&&data.nextSibling)rail.insertBefore(wrap,data.nextSibling);
      else rail.appendChild(wrap);
    }
    sel=document.createElement('select');
    sel.id='earthlineLanguage16488';
    sel.setAttribute('aria-label','Language');
    sel.style.cssText='max-width:64px;width:58px;min-height:34px;font:700 9px/1.1 "Noto Sans",system-ui,sans-serif;background:#10222b;color:#e7eef7;border:1px solid #456474;border-radius:7px;padding:3px 2px;cursor:pointer';
    wrap.appendChild(sel);
  }"""
if s.count(old)!=1:
    raise SystemExit(f"language owner count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("language rail owner 17614 installed")
