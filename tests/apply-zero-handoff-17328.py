from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
start=s.find("async function earthlineCooperativeYield16661(){")
if start<0: raise SystemExit("yield function missing")
brace=0;end=None
for i in range(start,s.__len__()):
    if s[i]=="{": brace+=1
    elif s[i]=="}":
        brace-=1
        if brace==0:
            end=i+1;break
if end is None: raise SystemExit("yield function end missing")
s=s[:start]+"async function earthlineCooperativeYield16661(){return;}"+s[end:]
s="<!-- EARTHLINE_ZERO_HANDOFF_REGIONAL_17328: remove cooperative scheduling handoff overhead during synchronous Regional screening; science/order/output unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("removed Regional cooperative handoff overhead 17328")
