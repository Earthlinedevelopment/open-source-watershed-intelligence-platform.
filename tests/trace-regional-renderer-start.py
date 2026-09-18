from pathlib import Path
import re
text=Path('index.html').read_text(encoding='utf-8')
target=text.find("window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040")
print("AUDIT_TARGET",target)
for pat in [
    r"let\s+lastData\b",
    r"let\s+scheduled\b",
    r"function\s+render\s*\(",
    r"function\s+points\s*\(",
    r"function\s+project\s*\(",
    r"function\s+activeTier16168\s*\(",
    r"const\s+overlay\b",
]:
    matches=[m for m in re.finditer(pat,text) if target<0 or abs(m.start()-target)<120000]
    print(f"===== PATTERN {pat} count={len(matches)} =====")
    for m in matches[-8:]:
        i=m.start()
        print(f"--- @ {i} ---")
        print(text[max(0,i-5000):min(len(text),i+18000)])
