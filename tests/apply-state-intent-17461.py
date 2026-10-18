from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    function placeIntentRows16539(raw){
      const v=clean(raw),kq=key(v);
      if(v.length<3||/\\d/.test(v)||/,/.test(v)||/\\b(?:state|province|region|country|nation|city|address|road|rd|street|st|avenue|ave|drive|dr|lane|ln|highway|hwy|route)\\b/i.test(v))return [];
      const words=kq.split(' ').filter(Boolean);if(!words.length||words.length>4)return [];
      return [
        {q:v+' state',l:v+' — State / Region',k:'Resolve this exact name as a state, province, or region'},
        {q:v+' country',l:v+' — Country',k:'Resolve this exact name as a country'},
        {q:v+' city',l:v+' — City / Place',k:'Resolve this exact name as a city or populated place'}
      ];
    }"""
new="""    function placeIntentRows16539(raw){
      const v=clean(raw),kq=key(v);
      if(v.length<3||/\\d/.test(v)||/,/.test(v)||/\\b(?:state|province|region|country|nation|city|address|road|rd|street|st|avenue|ave|drive|dr|lane|ln|highway|hwy|route)\\b/i.test(v))return [];
      const words=kq.split(' ').filter(Boolean);if(!words.length||words.length>4)return [];
      const stateProfile17461=(typeof EARTHLINE_US_STATE_REGISTRY_16556!=='undefined'?(EARTHLINE_US_STATE_REGISTRY_16556||[]):[]).find(p=>earthlinePlaceKey16537(p?.query||'')===earthlinePlaceKey16537(v));
      if(stateProfile17461){
        /* Registered U.S. states already have an authoritative state-profile row.
           Do not manufacture impossible same-name country/city choices. Georgia
           alone retains Country because Georgia is also a sovereign country. */
        if(kq==='georgia')return [{q:v+' country',l:v+' — Country',k:'Resolve this exact name as a country'}];
        return [];
      }
      return [
        {q:v+' state',l:v+' — State / Region',k:'Resolve this exact name as a state, province, or region'},
        {q:v+' country',l:v+' — Country',k:'Resolve this exact name as a country'},
        {q:v+' city',l:v+' — City / Place',k:'Resolve this exact name as a city or populated place'}
      ];
    }"""
if s.count(old)!=1: raise SystemExit(f"place intent anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_US_STATE_INTENT_FILTER_17461: registered U.S. states do not generate fake Country/City intent rows; Georgia country preserved. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched U.S. state intent filter 17461")
