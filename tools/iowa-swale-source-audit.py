import re, pathlib
s=pathlib.Path("index.html").read_text(errors="ignore")
terms=["presentation-unavailable","renderVerified","EARTHLINE_RENDER_TRUTH_SETTLEMENT_17188","safe fallback + texture verify","earthlineVerifyPropertyTexture","property-safe-water-16221","authoritativeSafeSwales15815","renderPending"]
out=[]
for term in terms:
    for m in list(re.finditer(re.escape(term),s))[:8]:
        a=max(0,m.start()-2500); b=min(len(s),m.start()+9000)
        out.append("\n===== "+term+" @ "+str(m.start())+" =====\n"+s[a:b])
pathlib.Path("iowa-swale-source-audit.txt").write_text("\n".join(out))
print("matches",len(out))
