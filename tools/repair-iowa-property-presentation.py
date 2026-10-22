from pathlib import Path
s=Path("index.html").read_text(errors="strict")
for term in [
    "settlePropertyMapVisibility16260",
    "presentation-unavailable",
    "renderVerified:ok",
    "regionalOverlay16336",
    "safeAudit17183"
]:
    print("COUNT",term,s.count(term))
idx=s.find("settlePropertyMapVisibility16260")
print("INDEX",idx)
print("SNIP_START")
print(repr(s[max(0,idx-300):idx+3500]))
print("SNIP_END")
