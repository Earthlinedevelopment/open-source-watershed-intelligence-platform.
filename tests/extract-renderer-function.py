from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
needle="window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040="
i=text.find(needle)
print("AUDIT",i)
lo=text.rfind("function render",0,i)
print("RENDER",lo)
print(text[max(0,lo-3000):min(len(text),i+4500)])
